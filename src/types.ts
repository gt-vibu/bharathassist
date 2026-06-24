export interface UserProfile {
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  state: string;
  district: string;
  occupation: string;
  annualIncome: number;
  educationLevel: string;
  category: 'General' | 'OBC' | 'SC' | 'ST';
  disabilityStatus: boolean;
  maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  familySize: number;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isEmailVerified: boolean;
  verificationOtp?: string;
  passwordHash?: string;
  createdAt: string;
  profile?: UserProfile;
  savedSchemes: string[]; // scheme IDs
  role: 'user' | 'admin';
}

export interface SchemeEligibilityCriteria {
  ageMin?: number;
  ageMax?: number;
  incomeMax?: number;
  genders?: string[]; // e.g. ["Female", "Other"]
  states?: string[]; // e.g. ["Karnataka", "All"]
  categories?: string[]; // e.g. ["SC", "ST", "OBC", "General"]
  occupations?: string[]; // e.g. ["Farmer", "Student", "Unemployed"]
  disabilityRequired?: boolean;
}

export interface Scheme {
  id: string;
  name: string;
  description: string;
  eligibilityDescription: string;
  eligibilityCriteria: SchemeEligibilityCriteria;
  benefits: string;
  documentsRequired: string[];
  officialApplicationLink: string;
  deadline: string;
  state: string; // "All" or specific state
  category: string;
  tags: string[];
}

export interface Application {
  id: string;
  userId: string;
  schemeId: string;
  schemeName: string;
  status: 'Draft' | 'Applied' | 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  benefitsUnlocked: string;
}

export interface Notification {
  id: string;
  userId: string; // "all" or specific userId
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface UserDocument {
  id: string;
  userId: string;
  documentType: 'Aadhaar Card' | 'PAN Card' | 'Income Certificate' | 'Caste Certificate' | 'Ration Card' | 'Domicile Certificate';
  fileName: string;
  uploadedAt: string;
  ocrText: string;
  status: 'Verified' | 'Pending' | 'Invalid';
  validationResults?: {
    field: string;
    value: string;
    valid: boolean;
    reason?: string;
  }[];
}

export interface EligibilityResult {
  scheme: Scheme;
  status: 'Highly Eligible' | 'Moderately Eligible' | 'Potentially Eligible' | 'Not Eligible';
  score: number; // 0 to 100
  matchingFactors: string[];
  missingFactors: string[];
}
