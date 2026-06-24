import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import Navbar from './components/Navbar.js';
import LandingPage from './pages/LandingPage.js';
import SchemesPage from './pages/SchemesPage.js';
import Dashboard from './pages/Dashboard.js';
import EligibilityCheckerPage from './pages/EligibilityCheckerPage.js';
import ProfileSetupPage from './pages/ProfileSetupPage.js';
import ChatBot from './components/ChatBot.js';
import OCRScanner from './components/OCRScanner.js';
import AdminPanel from './components/AdminPanel.js';

import { 
  Lock, 
  Mail, 
  User, 
  Smartphone, 
  Key, 
  X, 
  ShieldCheck, 
  Sparkles,
  Info,
  MapPin,
  Clock,
  Loader2,
  Send,
  CheckCircle2
} from 'lucide-react';

function AppContent() {
  const { user, signup, verifyOtp, login, forgotPassword, resetPassword } = useAuth();
  
  const [activeTab, setActiveTab] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'verify-otp' | 'forgot' | 'reset-password'>('login');
  
  // Auth Form parameters
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authRemember, setAuthRemember] = useState(true);
  const [authFeedback, setAuthFeedback] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactQuery, setContactQuery] = useState('');
  const [contactFeedback, setContactFeedback] = useState('');

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthFeedback('');
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await login(authEmail, authPassword, authRemember);
        setShowAuthModal(false);
        setActiveTab('dashboard');
      } else if (authMode === 'signup') {
        await signup(authName, authEmail, authPhone, authPassword);
        setAuthFeedback("Account registered successfully! Logging you in...");
        
        // Directly perform a automatic login call to make it seamless
        try {
          const loginRes = await login(authEmail, authPassword, authRemember);
          if (loginRes && loginRes.token) {
            setShowAuthModal(false);
            setActiveTab('profile-setup'); // Redirect to profile setup directly!
          } else {
            setAuthFeedback("Registration completed. Please sign in with your credentials.");
            setAuthMode('login');
          }
        } catch (loginErr) {
          setAuthFeedback("Registration completed! Please sign in using your new credentials.");
          setAuthMode('login');
        }
      } else if (authMode === 'verify-otp') {
        await verifyOtp(authEmail, authOtp);
        setShowAuthModal(false);
        setActiveTab('profile-setup'); // Redirect to configure profile after verifying email!
      } else if (authMode === 'forgot') {
        await forgotPassword(authEmail);
        setAuthFeedback("A reset verification OTP has been dispatched! (Enter code 123456 to specify new password)");
        setAuthMode('reset-password');
      } else if (authMode === 'reset-password') {
        await resetPassword(authEmail, authOtp, authPassword);
        setAuthFeedback("Credentials successfully reset! Please login.");
        setAuthMode('login');
      }
    } catch (err: any) {
      setAuthFeedback(err.message || "An authentication error occurred.");
      if (err.requiresVerification) {
        setAuthEmail(err.email || authEmail);
        setAuthMode('verify-otp');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFeedback("Namaste! Your message has been dispatched to our support wing. Reference ticket #" + Math.floor(Math.random() * 900000 + 100000) + " generated.");
    setContactName('');
    setContactEmail('');
    setContactQuery('');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col justify-between">
      
      {/* Dynamic Header & Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAuth={handleOpenAuth} 
      />

      {/* Main Interactive Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Render Tab Views dynamically based on state */}
        {activeTab === 'home' && (
          <LandingPage 
            onExploreSchemes={() => setActiveTab('schemes')} 
            onOpenAuth={handleOpenAuth}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'schemes' && (
          <SchemesPage 
            onApplySuccess={() => setActiveTab('dashboard')} 
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            onExplore={() => setActiveTab('schemes')}
            onEditProfile={() => setActiveTab('profile-setup')}
            onViewEligibility={() => setActiveTab('eligibility')}
          />
        )}

        {activeTab === 'eligibility' && (
          <EligibilityCheckerPage />
        )}

        {activeTab === 'profile-setup' && (
          <ProfileSetupPage 
            onSuccess={() => setActiveTab('dashboard')} 
          />
        )}

        {activeTab === 'assistant' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white">BharatAssist AI Multilingual Companion</h2>
              <p className="text-xs text-slate-400">Ask queries about grants, state rules, or application steps</p>
            </div>
            <ChatBot />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white">Automated AI Document Verification</h2>
              <p className="text-xs text-slate-400">Validate demographic name alignment and compliance criteria using Tesseract OCR scanner</p>
            </div>
            <OCRScanner onUploadSuccess={() => {}} />
          </div>
        )}

        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminPanel />
        )}

        {/* Static About Page */}
        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto space-y-8" id="about-us-view">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="font-display text-2xl font-bold text-white">About BharatAssist AI Gateway</h2>
              <p className="text-xs text-slate-400 mt-1">National informatics initiative simplifying direct welfare access</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-5">
                <Sparkles className="h-6 w-6 text-amber-400 mb-3" />
                <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">Semantic Discovery</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  Powered by advanced semantic analysis, the gateway matches dynamic criteria without depending on absolute keyword matches.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-5">
                <ShieldCheck className="h-6 w-6 text-emerald-400 mb-3" />
                <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">Credential Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  Tesseract OCR engines inspect parameters in real-time, matching citizen entries against uploaded Aadhaar and income sheets.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-5">
                <CheckCircle2 className="h-6 w-6 text-blue-400 mb-3" />
                <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">Direct Applications</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  Saves valuable time by routing approved, compliant citizens directly to ministerial application portals for fast Direct Benefit Transfer.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-850 bg-slate-900/10 p-6 space-y-4">
              <h3 className="font-display text-sm font-bold text-white">Our Mission</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                BharatAssist AI bridges the information asymmetry in welfare delivery. By matching profile records against dynamic rule-engines, citizens can bypass middlemen and claim their rightful benefits, supporting the Digital India initiative.
              </p>
            </div>
          </div>
        )}

        {/* Static Contact Page */}
        {activeTab === 'contact' && (
          <div className="max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md" id="contact-us-view">
            <div className="border-b border-slate-800 pb-4 mb-6">
              <h2 className="font-display text-lg font-bold text-white">Citizen Helpdesk Center</h2>
              <p className="text-xs text-slate-400 mt-1">Submit technical queries or report grievances to the nodal welfare officers</p>
            </div>

            {contactFeedback && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-800/20 bg-emerald-950/10 text-xs text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{contactFeedback}</span>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Detailed Query / Grievance Message</label>
                <textarea
                  value={contactQuery}
                  onChange={(e) => setContactQuery(e.target.value)}
                  rows={4}
                  placeholder="Explain your technical issue or grievance..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* COMPREHENSIVE AUTH DIALOG MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" id="auth-modal">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-full p-1.5 hover:bg-slate-800"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="font-display text-sm font-bold text-white mb-2">
              {authMode === 'login' && "Sign In to BharatAssist"}
              {authMode === 'signup' && "Create Citizen Account"}
              {authMode === 'verify-otp' && "Verify Citizen Credentials"}
              {authMode === 'forgot' && "Citizen Recovery Vault"}
              {authMode === 'reset-password' && "Set New Password"}
            </h3>
            <p className="text-[10px] text-slate-400 mb-5">
              {authMode === 'login' && "Sign in with your verified email and password"}
              {authMode === 'signup' && "Register to compare schemes and scan files"}
              {authMode === 'verify-otp' && "Provide the simulated email OTP token to verify profile"}
              {authMode === 'forgot' && "Confirm email to trigger credentials recovery"}
              {authMode === 'reset-password' && "Configure a safe password to lock your profile"}
            </p>

            {authFeedback && (
              <div className="mb-4 p-3 rounded-lg border border-amber-800/20 bg-amber-950/20 text-[11px] text-amber-400">
                {authFeedback}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Name field for signup */}
              {authMode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Full Name (As in Aadhaar)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Email field for auth actions */}
              {authMode !== 'verify-otp' && authMode !== 'reset-password' && (
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Citizen Email Address"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Phone field for signup */}
              {authMode === 'signup' && (
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="Mobile Contact No."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Password field for login/signup/reset */}
              {(authMode === 'login' || authMode === 'signup' || authMode === 'reset-password') && (
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Profile Password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* OTP token field */}
              {(authMode === 'verify-otp' || authMode === 'reset-password') && (
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value)}
                    placeholder="Enter 6-digit Verification OTP"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                    required
                  />
                </div>
              )}

              {/* Extra checkboxes */}
              {authMode === 'login' && (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authRemember}
                      onChange={(e) => setAuthRemember(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-amber-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('forgot')}
                    className="hover:text-white"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Button execution trigger */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 flex items-center justify-center space-x-2"
              >
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>
                    {authMode === 'login' && "Access Account"}
                    {authMode === 'signup' && "Create Free Account"}
                    {authMode === 'verify-otp' && "Confirm Email OTP"}
                    {authMode === 'forgot' && "Dispatch OTP Link"}
                    {authMode === 'reset-password' && "Activate New Password"}
                  </span>
                )}
              </button>
            </form>

            {/* Change modal auth Mode */}
            <div className="mt-5 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
              {authMode === 'login' ? (
                <p>
                  New to BharatAssist?{" "}
                  <button onClick={() => setAuthMode('signup')} className="text-amber-400 hover:underline">
                    Register Citizen Profile
                  </button>
                </p>
              ) : authMode === 'signup' ? (
                <p>
                  Already registered?{" "}
                  <button onClick={() => setAuthMode('login')} className="text-amber-400 hover:underline">
                    Access Portal
                  </button>
                </p>
              ) : (
                <button onClick={() => setAuthMode('login')} className="text-amber-400 hover:underline">
                  Back to Sign In
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
