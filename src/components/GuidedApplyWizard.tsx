import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Scheme } from '../types.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  ArrowRight, 
  ArrowLeft, 
  UploadCloud, 
  ExternalLink, 
  ShieldCheck, 
  Loader2, 
  Lock, 
  User, 
  MapPin, 
  CreditCard, 
  AlertCircle, 
  ThumbsUp,
  FileText,
  Bookmark,
  Check,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface GuidedApplyWizardProps {
  scheme: Scheme;
  onClose: () => void;
  onApplySuccess?: () => void;
}

export default function GuidedApplyWizard({ scheme, onClose, onApplySuccess }: GuidedApplyWizardProps) {
  const { user, token, documents, uploadDocument, fetchApplications } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [filingStatus, setFilingStatus] = useState<'idle' | 'submitting' | 'redirected' | 'error'>('idle');
  
  // OCR upload states for missing documents
  const [uploadingDocType, setUploadingDocType] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Acknowledge eligibility warnings if any
  const [eligibilityAcknowledged, setEligibilityAcknowledged] = useState(false);

  // Define steps
  const steps = [
    { id: 1, name: 'Eligibility Audit', desc: 'Socioeconomic criteria check' },
    { id: 2, name: 'Documents Registry', desc: 'Required credential verification' },
    { id: 3, name: 'Procedure Walkthrough', desc: 'Ministry guidelines tutorial' },
    { id: 4, name: 'Submit & Link', desc: 'Direct secure redirection' }
  ];

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Helper map to find matched documents from the user's verified list
  const findMatchingUserDocument = (reqDocName: string) => {
    const normReq = reqDocName.toLowerCase();
    
    // Attempt standard classifications mapping
    return documents.find(d => {
      const normUserType = d.documentType.toLowerCase();
      if (normReq.includes('aadhaar') && normUserType.includes('aadhaar')) return true;
      if (normReq.includes('pan') && normUserType.includes('pan')) return true;
      if (normReq.includes('income') && normUserType.includes('income')) return true;
      if (normReq.includes('caste') && normUserType.includes('caste')) return true;
      if (normReq.includes('ration') && normUserType.includes('ration')) return true;
      if (normReq.includes('domicile') && normUserType.includes('domicile')) return true;
      
      // Fallback exact or substring
      return normUserType.includes(normReq) || normReq.includes(normUserType);
    });
  };

  // Run programmatic eligibility audit
  const profile = user?.profile;
  const auditResults = [];
  let eligibleCount = 0;
  let totalAuditItems = 0;

  if (profile) {
    // 1. State Domicile
    const stateReq = scheme.state;
    const isStateMatch = stateReq === 'All' || stateReq === 'National' || stateReq.toLowerCase() === profile.state.toLowerCase();
    totalAuditItems++;
    if (isStateMatch) eligibleCount++;
    auditResults.push({
      criteria: 'Domicile Territory',
      required: stateReq === 'All' || stateReq === 'National' ? 'Any State' : `Resident of ${stateReq}`,
      actual: profile.state,
      passed: isStateMatch,
      message: isStateMatch 
        ? `Domicile requirements verified for ${profile.state}.` 
        : `This scheme is exclusively for residents of ${stateReq}.`
    });

    // 2. Annual Income limit
    const incomeMax = scheme.eligibilityCriteria?.incomeMax;
    if (incomeMax && incomeMax > 0) {
      const isIncomeOk = profile.annualIncome <= incomeMax;
      totalAuditItems++;
      if (isIncomeOk) eligibleCount++;
      auditResults.push({
        criteria: 'Annual Household Income',
        required: `Below ₹${incomeMax.toLocaleString('en-IN')}`,
        actual: `₹${profile.annualIncome.toLocaleString('en-IN')}`,
        passed: isIncomeOk,
        message: isIncomeOk 
          ? `Income is within the permissible limit of ₹${incomeMax.toLocaleString('en-IN')}.` 
          : `Your profile income (₹${profile.annualIncome.toLocaleString('en-IN')}) exceeds the ceiling limit.`
      });
    }

    // 3. Gender Constraint
    const gendersReq = scheme.eligibilityCriteria?.genders;
    if (gendersReq && gendersReq.length > 0 && !gendersReq.includes('All')) {
      const isGenderOk = gendersReq.some(g => g.toLowerCase() === profile.gender.toLowerCase());
      totalAuditItems++;
      if (isGenderOk) eligibleCount++;
      auditResults.push({
        criteria: 'Gender Group',
        required: gendersReq.join(', '),
        actual: profile.gender,
        passed: isGenderOk,
        message: isGenderOk 
          ? `Gender profile matches the targeted welfare cohort.` 
          : `This scheme specifically targets ${gendersReq.join(', ')} applicants.`
      });
    }

    // 4. Age limits
    const ageMin = scheme.eligibilityCriteria?.ageMin;
    const ageMax = scheme.eligibilityCriteria?.ageMax;
    if ((ageMin && ageMin > 0) || (ageMax && ageMax > 0)) {
      const minOk = ageMin ? profile.age >= ageMin : true;
      const maxOk = ageMax ? profile.age <= ageMax : true;
      const isAgeOk = minOk && maxOk;
      totalAuditItems++;
      if (isAgeOk) eligibleCount++;
      
      let reqStr = '';
      if (ageMin && ageMax) reqStr = `${ageMin} to ${ageMax} years`;
      else if (ageMin) reqStr = `Minimum ${ageMin} years`;
      else if (ageMax) reqStr = `Maximum ${ageMax} years`;

      auditResults.push({
        criteria: 'Age bracket',
        required: reqStr,
        actual: `${profile.age} years old`,
        passed: isAgeOk,
        message: isAgeOk 
          ? `Age conforms to eligibility constraints.` 
          : `Your age (${profile.age}) is outside the target cohort criteria.`
      });
    }

    // 5. Category (Caste/Group)
    const categoriesReq = scheme.eligibilityCriteria?.categories;
    if (categoriesReq && categoriesReq.length > 0 && !categoriesReq.includes('All')) {
      const isCategoryOk = categoriesReq.some(c => c.toLowerCase() === profile.category.toLowerCase());
      totalAuditItems++;
      if (isCategoryOk) eligibleCount++;
      auditResults.push({
        criteria: 'Social Category',
        required: categoriesReq.join(', '),
        actual: profile.category,
        passed: isCategoryOk,
        message: isCategoryOk 
          ? `Caste category satisfies target indicators.` 
          : `Targeted exclusively towards: ${categoriesReq.join(', ')}.`
      });
    }
  }

  const hasAuditWarnings = auditResults.some(r => !r.passed);
  const auditPassedPercentage = totalAuditItems > 0 ? Math.round((eligibleCount / totalAuditItems) * 100) : 100;

  // Handle direct file uploading for missing items
  const handleUploadMissingDoc = async (typeLabel: string) => {
    // Standardize to an official Document category if possible
    let officialDocType: any = 'Aadhaar Card';
    const norm = typeLabel.toLowerCase();
    if (norm.includes('pan')) officialDocType = 'PAN Card';
    else if (norm.includes('income')) officialDocType = 'Income Certificate';
    else if (norm.includes('caste')) officialDocType = 'Caste Certificate';
    else if (norm.includes('ration')) officialDocType = 'Ration Card';
    else if (norm.includes('domicile')) officialDocType = 'Domicile Certificate';
    else {
      // Custom documents will be categorized as Domicile Certificate or dynamic
      officialDocType = 'Domicile Certificate';
    }

    setUploadingDocType(officialDocType);
    setUploadStatus('idle');
    setUploadFile(null);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadStatus('uploading');
      try {
        await uploadDocument(uploadingDocType, file);
        setUploadStatus('done');
        // Clear file input
        e.target.value = '';
      } catch (err) {
        console.error(err);
        setUploadStatus('error');
      }
    }
  };

  // Guided steps filing description walkthrough
  const getWalkthroughSteps = (cat: string) => {
    const normalizedCat = cat.toLowerCase();
    if (normalizedCat.includes('scholarship') || normalizedCat.includes('education')) {
      return [
        { title: "Authenticate Portal Credentials", details: "Visit the Ministry Scholarship interface and initiate registration using your Aadhaar credentials." },
        { title: "Fill Educational Enrollment Info", details: "Provide your current roll number, college admission index, and upload the verified high-school or previous marksheet." },
        { title: "Link Income & Caste Certificates", details: "Enter the certificate verification numbers from your scanned documents to bypass manual validation." },
        { title: "Verify Bank Account (PFMS/DBT)", details: "Ensure your bank account is linked to Aadhaar for Direct Benefit Transfer of the scholarship amount." }
      ];
    } else if (normalizedCat.includes('farmer') || normalizedCat.includes('rural')) {
      return [
        { title: "Verify Land Registration Record", details: "Enter your survey identification number or Khata index on the nodal agricultural register." },
        { title: "Complete Aadhaar E-KYC", details: "Verify your identity via mobile OTP linked securely with your UIDAI registry." },
        { title: "Validate Bank Direct Linkage", details: "Ensure zero-balance bank credential linkage is certified for PM-KISAN or State crop benefit transfers." },
        { title: "Submit and Print acknowledgement", details: "Generate the digital receipt and save the unique application index for regional verification." }
      ];
    } else {
      return [
        { title: "Verify Base Eligibility Credentials", details: "Verify that your local profile matches State or National registry criteria before redirection." },
        { title: "Upload Scanned Certifications", details: "Have your verified Aadhaar, Income certificate, and domicile records ready in PDF form." },
        { title: "Navigate to Official Nodal Ministry URL", details: "Access the secured department URL provided on the next screen." },
        { title: "File Form & Claim Tracker ID", details: "Fill out the registration, attach documents, and log the tracking number back into BharatAssist." }
      ];
    }
  };

  const stepsDetails = getWalkthroughSteps(scheme.category);

  // Submit and Redirect flow
  const handleFinalRedirectAndApply = async () => {
    setFilingStatus('submitting');
    try {
      // Register in our database
      const res = await fetch('/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schemeId: scheme.id, schemeName: scheme.name })
      });
      
      if (res.ok) {
        await fetchApplications(); // Sync client state tracker
        if (onApplySuccess) onApplySuccess();
        
        // Open the portal in new tab
        window.open(scheme.officialApplicationLink, '_blank', 'noopener,noreferrer');
        setFilingStatus('redirected');
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Filing registry registration failed.");
      }
    } catch (err: any) {
      console.error(err);
      setFilingStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 md:p-4 backdrop-blur-md" id="guided-apply-wizard-overlay">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-4 md:p-6 shadow-2xl relative max-h-[95vh] md:max-h-[92vh] flex flex-col justify-between overflow-hidden">
        
        {/* Hidden File Input for instant uploads */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileSelected} 
          className="hidden" 
          accept="image/*,.pdf"
        />

        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-sm md:text-base font-bold text-white leading-tight">Guided Welfare Apply Companion</h3>
              <p className="text-[10px] md:text-[11px] text-slate-400">Scheme Assistance for: <strong className="text-slate-300">{scheme.name}</strong></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <AlertCircle className="h-5 w-5 rotate-45" />
          </button>
        </div>

        {/* Horizontal Wizard Progress Bar - Clickable tabs for full direct access */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center" id="wizard-progress-bar">
          {steps.map((st) => {
            const isActive = currentStep === st.id;
            const isCompleted = currentStep > st.id;
            return (
              <button 
                key={st.id}
                onClick={() => setCurrentStep(st.id)}
                className="group relative text-center focus:outline-none focus:ring-0 w-full"
              >
                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500' : isActive ? 'bg-amber-500' : 'bg-slate-800 group-hover:bg-slate-700'
                }`} />
                <span className={`block text-[9px] md:text-[10px] font-bold mt-1.5 transition-colors ${
                  isActive ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                } truncate`}>
                  {st.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Step Canvas */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0" id="wizard-step-canvas">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                  <div className="flex items-start space-x-2.5">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs leading-relaxed text-slate-300">
                      We ran an automated, algorithmic check of your current profile metrics against the official requirements declared by the ministry for this scheme.
                    </div>
                  </div>
                </div>

                {!profile ? (
                  <div className="p-10 border border-slate-850 rounded-2xl text-center bg-slate-950/20 space-y-3">
                    <User className="h-10 w-10 text-slate-600 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-300">Profile Metrics Missing</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Please complete your user profile registry first so we can run automated eligibility criteria audits.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Programmatic Auditor Checklist</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        hasAuditWarnings ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      }`}>
                        Match Score: {auditPassedPercentage}%
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/20 overflow-hidden divide-y divide-slate-900">
                      {auditResults.map((audit, idx) => (
                        <div key={idx} className="p-3 flex items-start justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-300">{audit.criteria}</div>
                            <div className="text-[10px] text-slate-500">
                              Target limit: <strong className="text-slate-400">{audit.required}</strong> 
                              &nbsp;|&nbsp; Your profile: <strong className="text-slate-400">{audit.actual}</strong>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">{audit.message}</p>
                          </div>
                          <div className="shrink-0 mt-1">
                            {audit.passed ? (
                              <div className="flex items-center space-x-1 text-emerald-400 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-[10px]">Passed</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-amber-500 font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-[10px]">Warning</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {hasAuditWarnings && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-amber-400">Eligibility Warnings Detected</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Your profile does not strictly align with all targets of this welfare program. Filing with mismatched information might lead to a ministry rejection.
                          </p>
                          <label className="flex items-center space-x-2 mt-2 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={eligibilityAcknowledged}
                              onChange={(e) => setEligibilityAcknowledged(e.target.checked)}
                              className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                            />
                            <span className="text-[10px] text-slate-300 font-semibold">I acknowledge and wish to proceed anyway</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex items-start space-x-2.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="text-xs leading-relaxed text-slate-300">
                      Our system verifies if your scanned digital credentials match the required document registry parameters. Missing documents can be uploaded directly below for an instant OCR scan.
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Document Registry Compliance</h4>
                  
                  <div className="grid gap-3" id="wizard-document-list">
                    {scheme.documentsRequired.map((docName, idx) => {
                      const matchedDoc = findMatchingUserDocument(docName);
                      return (
                        <div key={idx} className="rounded-xl border border-slate-850 bg-slate-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${matchedDoc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{docName}</div>
                              <p className="text-[10px] text-slate-500">
                                {matchedDoc ? `Scanned successfully: ${matchedDoc.fileName}` : 'Verification pending'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {matchedDoc ? (
                              <div className="flex items-center space-x-1 text-emerald-400 font-medium text-xs">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Verified Ready</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleUploadMissingDoc(docName)}
                                className="w-full sm:w-auto rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition flex items-center justify-center space-x-1"
                              >
                                {uploadStatus === 'uploading' && uploadingDocType === docName ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                                    <span>Scanning File...</span>
                                  </>
                                ) : (
                                  <>
                                    <UploadCloud className="h-3.5 w-3.5" />
                                    <span>Upload & Verify</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {uploadStatus === 'done' && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center space-x-2 text-xs text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>OCR scanner successfully processed and catalogued your document in real-time!</span>
                    </div>
                  )}

                  {uploadStatus === 'error' && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center space-x-2 text-xs text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>OCR scanner encountered an error during instant verification. Please try again.</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex items-start space-x-2.5">
                    <FileCheck className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs leading-relaxed text-slate-300">
                      Before we route you to the official ministry application interface, review the step-by-step filing walkthrough we mapped out based on regional guidelines.
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Ministry Registration Walkthrough</h4>
                  
                  <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-6" id="procedure-walkthrough">
                    {stepsDetails.map((guide, idx) => (
                      <div key={idx} className="relative">
                        {/* Bullet step bubble */}
                        <div className="absolute -left-[27px] top-0.5 h-5 w-5 rounded-full bg-slate-900 border-2 border-amber-500 text-[10px] font-bold text-amber-400 flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white">{guide.title}</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{guide.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center py-4"
              >
                <div className="max-w-sm mx-auto space-y-4">
                  {filingStatus === 'redirected' ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                        <ThumbsUp className="h-8 w-8" />
                      </div>
                      <h4 className="font-display text-lg font-bold text-white">Application Successfully Filed!</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        We have opened the official ministry portal in a new tab and registered this application under "My Applications" in your Dashboard tracker.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        You can update its progress status (Draft, Applied, Approved, Rejected) from your Dashboard at any time.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                        <Lock className="h-8 w-8 animate-pulse" />
                      </div>
                      <h4 className="font-display text-base font-bold text-white">Ready for Secured Registration</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        You are fully prepared! Clicking below will register this scheme to your BharatAssist Dashboard tracking index and launch the official ministry portal.
                      </p>
                      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-[10px] text-slate-500 leading-relaxed text-left">
                        <span className="font-bold text-slate-400 uppercase">Redirection link:</span><br/>
                        <span className="font-mono truncate block text-amber-500">{scheme.officialApplicationLink}</span>
                      </div>
                    </div>
                  )}

                  {filingStatus === 'error' && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center space-x-2 text-xs text-red-400 text-left">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Filing registration failed. Please ensure you have an active network connection.</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="border-t border-slate-800/80 pt-4 mt-6 flex justify-between items-center">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1 || filingStatus === 'submitting'}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition disabled:opacity-30 disabled:hover:bg-slate-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-500 font-medium mr-2">
              Step {currentStep} of {steps.length}
            </span>

            {currentStep < steps.length ? (
              <button
                onClick={handleNextStep}
                disabled={currentStep === 1 && hasAuditWarnings && !eligibilityAcknowledged}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinalRedirectAndApply}
                disabled={filingStatus === 'submitting' || filingStatus === 'redirected'}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition disabled:opacity-50"
              >
                {filingStatus === 'submitting' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Registering Application...</span>
                  </>
                ) : filingStatus === 'redirected' ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Applied & Opened</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Ministry Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
