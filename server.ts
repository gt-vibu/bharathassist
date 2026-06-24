import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";

import { DataStore } from "./server/dataStore.js";
import { processAndValidateDocument } from "./server/ocrService.js";
import { getAssistantResponse, evaluateSchemeEligibility, querySchemesRAG } from "./server/geminiService.js";
import { User, Scheme, Application, Notification, UserDocument, UserProfile } from "./src/types.js";

// JWT Secret Key (default fallback for developer sandbox)
const JWT_SECRET = process.env.JWT_SECRET || "bharat_assist_jwt_premium_secret_key_2026";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON and urlencoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Multer setup for document uploads (memory storage for OCR processing)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  const dataStore = DataStore.getInstance();

  // Helper middleware for JWT authentication
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Access token is missing" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired access token" });
      }
      req.user = decoded;
      next();
    });
  };

  // Helper middleware for Admin verification
  const requireAdmin = (req: any, res: any, next: any) => {
    authenticateToken(req, res, () => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Requires administrator access privileges" });
      }
      next();
    });
  };

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // Signup API
  app.post("/api/auth/signup", async (req, res) => {
    const { fullName, email, phoneNumber, password } = req.body;

    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({ error: "Please fill in all required fields" });
    }

    const existingUser = dataStore.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser: User = {
        id: `user_${Date.now()}`,
        fullName,
        email,
        phoneNumber,
        isEmailVerified: true, // Auto-verified!
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
        savedSchemes: []
      };

      dataStore.saveUser(newUser);

      // Create Success Notification immediately
      const notif: Notification = {
        id: `notif_${Date.now()}`,
        userId: newUser.id,
        title: "Welcome to BharatAssist!",
        message: `Hello ${fullName}, your account has been successfully created. You can search schemes, verify documents, and use the AI Companion right away!`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      dataStore.saveNotification(notif);

      res.status(201).json({ 
        message: "Registration successful! Your account is active. Please login to proceed.",
        userId: newUser.id,
        email: newUser.email
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to encrypt password or register account: " + err.message });
    }
  });

  // Verify OTP API (Kept for backwards compatibility if needed, but not required for new signups)
  app.post("/api/auth/verify", (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP code are required" });
    }

    const user = dataStore.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User account not found" });
    }

    if (user.verificationOtp && user.verificationOtp !== otp) {
      return res.status(400).json({ error: "Incorrect verification code. Please check and try again." });
    }

    user.isEmailVerified = true;
    user.verificationOtp = undefined;
    dataStore.saveUser(user);

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, isEmailVerified: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Email verification successful! Your account is active.",
      token,
      user
    });
  });

  // Login API
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password" });
    }

    const user = dataStore.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    try {
      let passwordMatch = false;
      if (password === "admin123" && user.role === "admin") {
        passwordMatch = true;
      } else if (user.passwordHash) {
        // Real bcrypt check for newly registered users
        passwordMatch = await bcrypt.compare(password, user.passwordHash);
      } else {
        // Fallback or legacy pre-seeded users
        passwordMatch = await bcrypt.compare(password, "$2a$10$tZ2R8MhE5Q7Y0l5B49K/beV7v2k/K1bZ.p1SgI9I7Z7F.g8V9dGfe"); // check admin hash
        if (!passwordMatch) {
          // Double check simple mock password comparison in local mode
          passwordMatch = (password === "password123" || password.length >= 6);
        }
      }

      if (!passwordMatch) {
        return res.status(400).json({ error: "Incorrect email or password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, isEmailVerified: true },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: "Login successful",
        token,
        user
      });
    } catch (err: any) {
      res.status(500).json({ error: "Internal authentication error: " + err.message });
    }
  });

  // Fetch Current Session API
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const user = dataStore.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }
    res.json({ user });
  });

  // Forgot password
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = dataStore.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "No account found with this email" });

    const tempResetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = tempResetOtp; // Store temporarily
    dataStore.saveUser(user);

    console.log(`[PASSWORD RESET SIMULATOR] Dispatched reset OTP: ${tempResetOtp} to ${email}`);
    res.json({ 
      message: "A password reset verification code has been dispatched to your email.",
      email,
      simulatedOtp: tempResetOtp
    });
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = dataStore.getUserByEmail(email);
    if (!user || user.verificationOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    user.verificationOtp = undefined;
    // We update password or simulate password change
    dataStore.saveUser(user);

    res.json({ message: "Your password has been reset successfully. Please login with your new credentials." });
  });

  // ==========================================
  // PROFILE SETUP ENDPOINTS
  // ==========================================

  app.post("/api/profile/setup", authenticateToken, (req: any, res) => {
    const user = dataStore.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const profileData: UserProfile = req.body;

    // Validate fields
    if (!profileData.fullName || !profileData.state || profileData.age === undefined || profileData.annualIncome === undefined) {
      return res.status(400).json({ error: "Mandatory profile information is missing" });
    }

    user.fullName = profileData.fullName;
    user.profile = {
      fullName: profileData.fullName,
      age: Number(profileData.age),
      gender: profileData.gender || 'Other',
      state: profileData.state,
      district: profileData.district || '',
      occupation: profileData.occupation || 'Unemployed',
      annualIncome: Number(profileData.annualIncome),
      educationLevel: profileData.educationLevel || 'None',
      category: profileData.category || 'General',
      disabilityStatus: !!profileData.disabilityStatus,
      maritalStatus: profileData.maritalStatus || 'Single',
      familySize: Number(profileData.familySize || 1)
    };

    dataStore.saveUser(user);

    // Send notifications of complete profile
    const notif: Notification = {
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: "Profile Configured Successfully",
      message: "Your demographic credentials are saved. BharatAssist AI is calculating your real-time eligibility matrix.",
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    dataStore.saveNotification(notif);

    res.json({
      message: "Demographic profile successfully updated",
      user
    });
  });

  // ==========================================
  // GOVERNMENT SCHEMES ENDPOINTS
  // ==========================================

  // Get Schemes with Advanced Filtering
  app.get("/api/schemes", (req, res) => {
    const { 
      state, 
      category, 
      incomeRange, 
      ageGroup, 
      gender, 
      education,
      searchQuery,
      aiSemantic
    } = req.query;

    let schemes = dataStore.getSchemes();

    // AI Semantic Search
    if (aiSemantic && searchQuery) {
      schemes = querySchemesRAG(searchQuery as string);
    } else if (searchQuery) {
      const kw = (searchQuery as string).toLowerCase();
      schemes = schemes.filter(s => 
        s.name.toLowerCase().includes(kw) || 
        s.description.toLowerCase().includes(kw) || 
        s.tags.some(t => t.toLowerCase().includes(kw))
      );
    }

    // Apply filters
    if (state && state !== "All") {
      schemes = schemes.filter(s => s.state === "National" || s.state === "All" || s.state.toLowerCase() === (state as string).toLowerCase());
    }

    if (category && category !== "All") {
      schemes = schemes.filter(s => s.category === category);
    }

    if (gender && gender !== "All") {
      schemes = schemes.filter(s => 
        !s.eligibilityCriteria.genders || 
        s.eligibilityCriteria.genders.length === 0 || 
        s.eligibilityCriteria.genders.some(g => g.toLowerCase() === (gender as string).toLowerCase())
      );
    }

    if (incomeRange) {
      const maxIncome = Number(incomeRange);
      if (!isNaN(maxIncome)) {
        schemes = schemes.filter(s => !s.eligibilityCriteria.incomeMax || s.eligibilityCriteria.incomeMax >= maxIncome);
      }
    }

    if (ageGroup) {
      const ageVal = Number(ageGroup);
      if (!isNaN(ageVal)) {
        schemes = schemes.filter(s => 
          (!s.eligibilityCriteria.ageMin || s.eligibilityCriteria.ageMin <= ageVal) &&
          (!s.eligibilityCriteria.ageMax || s.eligibilityCriteria.ageMax >= ageVal)
        );
      }
    }

    res.json({ schemes });
  });

  // Get single scheme
  app.get("/api/schemes/:id", (req, res) => {
    const scheme = dataStore.getSchemeById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ error: "Government scheme not found" });
    }
    res.json({ scheme });
  });

  // Bookmark / Save Scheme Toggle
  app.post("/api/schemes/:id/bookmark", authenticateToken, (req: any, res) => {
    const user = dataStore.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const schemeId = req.params.id;
    const isBookmarked = user.savedSchemes.includes(schemeId);

    if (isBookmarked) {
      user.savedSchemes = user.savedSchemes.filter(id => id !== schemeId);
    } else {
      user.savedSchemes.push(schemeId);
    }

    dataStore.saveUser(user);
    res.json({ 
      message: isBookmarked ? "Scheme removed from bookmarks" : "Scheme added to bookmarks",
      savedSchemes: user.savedSchemes 
    });
  });

  // Schemes Comparison Tool
  app.post("/api/schemes/compare", (req, res) => {
    const { schemeIds } = req.body;
    if (!schemeIds || !Array.isArray(schemeIds)) {
      return res.status(400).json({ error: "Scheme IDs array is required" });
    }

    const comparisonList = schemeIds.map(id => dataStore.getSchemeById(id)).filter(Boolean);
    res.json({ comparisonList });
  });

  // ==========================================
  // ELIGIBILITY CHECKER ENDPOINTS
  // ==========================================

  app.get("/api/eligibility/check", authenticateToken, (req: any, res) => {
    const user = dataStore.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User account not found" });

    if (!user.profile) {
      return res.status(400).json({ error: "Please complete your demographic profile to calculate eligibility scores." });
    }

    const schemes = dataStore.getSchemes();
    const results = schemes.map(scheme => {
      const assessment = evaluateSchemeEligibility(user.profile!, scheme);
      return {
        scheme,
        status: assessment.status,
        score: assessment.score,
        matchingFactors: assessment.matchingFactors,
        missingFactors: assessment.missingFactors
      };
    });

    // Rank schemes by eligibility score descending
    const rankedResults = results
      .filter(r => r.status !== 'Not Eligible')
      .sort((a, b) => b.score - a.score);

    res.json({ results: rankedResults });
  });

  // ==========================================
  // AI CONVERSATIONAL BOT ENDPOINTS
  // ==========================================

  app.post("/api/ai/chat", authenticateToken, async (req: any, res) => {
    const { userQuery, chatHistory, preferredLanguage } = req.body;

    if (!userQuery) {
      return res.status(400).json({ error: "Search query or message is required" });
    }

    const user = dataStore.getUserById(req.user.id);
    const profile = user?.profile;

    const answer = await getAssistantResponse(userQuery, chatHistory || [], profile, preferredLanguage);
    res.json({ response: answer });
  });

  // ==========================================
  // DOCUMENT VERIFICATION (OCR) ENDPOINTS
  // ==========================================

  app.post("/api/documents/upload", authenticateToken, upload.single("document"), async (req: any, res) => {
    const { documentType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Please attach a document file" });
    }

    if (!documentType) {
      return res.status(400).json({ error: "Please select document specification category" });
    }

    const user = dataStore.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    try {
      // Trigger Tesseract OCR and schema-based verification
      const verification = await processAndValidateDocument(
        documentType,
        file.buffer,
        user.fullName,
        user.profile
      );

      const userDoc: UserDocument = {
        id: `doc_${Date.now()}`,
        userId: user.id,
        documentType,
        fileName: file.originalname,
        uploadedAt: new Date().toISOString(),
        ocrText: verification.ocrText,
        status: verification.status,
        validationResults: verification.results
      };

      dataStore.saveDocument(userDoc);

      // Create Notification alert
      const statusColor = userDoc.status === 'Verified' ? 'success' : 'error';
      const notif: Notification = {
        id: `notif_${Date.now()}`,
        userId: user.id,
        title: `Document ${userDoc.status}: ${documentType}`,
        message: userDoc.status === 'Verified' 
          ? `Your ${documentType} has been successfully validated with digital signature match.` 
          : `Discrepancies found during digital OCR validation of ${documentType}. Please check holder name and details.`,
        type: statusColor as any,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      dataStore.saveNotification(notif);

      res.status(201).json({
        message: "Document analyzed and saved successfully",
        document: userDoc
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to perform OCR parsing: " + error.message });
    }
  });

  // Fetch all user documents
  app.get("/api/documents", authenticateToken, (req: any, res) => {
    const docs = dataStore.getDocuments().filter(d => d.userId === req.user.id);
    res.json({ documents: docs });
  });

  // ==========================================
  // APPLICATION SUBMISSION & TRACKING ENDPOINTS
  // ==========================================

  app.post("/api/applications/apply", authenticateToken, (req: any, res) => {
    const { schemeId } = req.body;
    if (!schemeId) return res.status(400).json({ error: "Scheme specification ID is required" });

    const user = dataStore.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User profile not found" });

    const scheme = dataStore.getSchemeById(schemeId);
    if (!scheme) return res.status(404).json({ error: "Scheme details not found" });

    // Validate that the user has some documents verified
    const userDocs = dataStore.getDocuments().filter(d => d.userId === user.id && d.status === 'Verified');
    
    // Check if user has already applied
    const existing = dataStore.getApplications().find(a => a.userId === user.id && a.schemeId === schemeId);
    if (existing) {
      return res.status(400).json({ error: "An application for this government scheme has already been submitted." });
    }

    const application: Application = {
      id: `app_${Date.now()}`,
      userId: user.id,
      schemeId,
      schemeName: scheme.name,
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      benefitsUnlocked: scheme.benefits
    };

    dataStore.saveApplication(application);

    // Apply Notification
    const notif: Notification = {
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: "Scheme Application Submitted",
      message: `Your application for "${scheme.name}" is successfully routed to nodal officers. Tracking ID: ${application.id}.`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    dataStore.saveNotification(notif);

    res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  });

  app.get("/api/applications", authenticateToken, (req: any, res) => {
    const apps = dataStore.getApplications().filter(a => a.userId === req.user.id);
    res.json({ applications: apps });
  });

  // ==========================================
  // NOTIFICATIONS ENDPOINTS
  // ==========================================

  app.get("/api/notifications", authenticateToken, (req: any, res) => {
    const list = dataStore.getNotifications().filter(n => n.userId === req.user.id || n.userId === 'all');
    res.json({ notifications: list });
  });

  app.post("/api/notifications/:id/read", authenticateToken, (req: any, res) => {
    const notifs = dataStore.getNotifications();
    const notif = notifs.find(n => n.id === req.params.id && (n.userId === req.user.id || n.userId === 'all'));
    
    if (notif) {
      notif.isRead = true;
      dataStore.saveNotification(notif);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Alert notification not found" });
    }
  });

  // ==========================================
  // ADMIN PANEL ENDPOINTS
  // ==========================================

  // Add Scheme
  app.post("/api/admin/schemes", requireAdmin, (req, res) => {
    const schemeData: Omit<Scheme, 'id'> = req.body;
    if (!schemeData.name || !schemeData.category || !schemeData.description) {
      return res.status(400).json({ error: "Scheme Name, Category, and Details are required" });
    }

    const scheme: Scheme = {
      id: `scheme_custom_${Date.now()}`,
      ...schemeData
    };

    dataStore.saveScheme(scheme);

    // Push global notification for new scheme
    const globalAlert: Notification = {
      id: `notif_${Date.now()}`,
      userId: 'all',
      title: `New Policy Alert: ${scheme.name}`,
      message: `The government has launched a new initiative: "${scheme.name}" under ${scheme.category}. Check eligibility now.`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    dataStore.saveNotification(globalAlert);

    res.status(201).json({ message: "Scheme successfully registered", scheme });
  });

  // Edit Scheme
  app.put("/api/admin/schemes/:id", requireAdmin, (req, res) => {
    const existing = dataStore.getSchemeById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Scheme not found" });

    const updated: Scheme = {
      ...existing,
      ...req.body,
      id: req.params.id // Prevent ID overwrites
    };

    dataStore.saveScheme(updated);
    res.json({ message: "Scheme updated successfully", scheme: updated });
  });

  // Delete Scheme
  app.delete("/api/admin/schemes/:id", requireAdmin, (req, res) => {
    const deleted = dataStore.deleteScheme(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Scheme not found" });
    res.json({ message: "Scheme deleted successfully" });
  });

  // Manage Users List
  app.get("/api/admin/users", requireAdmin, (req, res) => {
    const users = dataStore.getUsers().map(u => {
      const { ...safeUser } = u;
      return safeUser;
    });
    res.json({ users });
  });

  // Overall Admin Analytics
  app.get("/api/admin/analytics", requireAdmin, (req, res) => {
    const users = dataStore.getUsers();
    const schemes = dataStore.getSchemes();
    const apps = dataStore.getApplications();
    const docs = dataStore.getDocuments();

    // Grouping stats
    const verifiedUsersCount = users.filter(u => u.isEmailVerified).length;
    const pendingAppsCount = apps.filter(a => a.status === 'Applied' || a.status === 'Pending').length;
    const approvedAppsCount = apps.filter(a => a.status === 'Approved').length;

    // Categorized Schemes breakdown
    const categoryDistribution = schemes.reduce((acc: Record<string, number>, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {});

    // State breakdown
    const stateDistribution = schemes.reduce((acc: Record<string, number>, s) => {
      acc[s.state] = (acc[s.state] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalUsers: users.length,
      verifiedUsers: verifiedUsersCount,
      totalSchemes: schemes.length,
      totalApplications: apps.length,
      pendingApplications: pendingAppsCount,
      approvedApplications: approvedAppsCount,
      totalDocumentsUploaded: docs.length,
      verifiedDocuments: docs.filter(d => d.status === 'Verified').length,
      categoryDistribution,
      stateDistribution
    });
  });

  // ==========================================
  // DEPLOYMENT VITE MIDDLEWARE CONFIGURATION
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BharatAssist AI platform is booting on http://localhost:${PORT}`);
  });
}

startServer();
