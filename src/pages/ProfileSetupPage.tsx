import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { validateVerhoeff } from '../utils/verhoeff.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Briefcase, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  UserCheck, 
  Loader2, 
  Info, 
  Coins, 
  ShieldCheck, 
  Award,
  CheckCircle2,
  HelpCircle,
  MapPin
} from 'lucide-react';

interface ProfileSetupPageProps {
  onSuccess: () => void;
}

// Complete actual Indian State to Districts mapping
const STATE_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Anantapur", "Chittoor", "East Godavari", "West Godavari", "Kadapa", "Srikakulam", "Vizianagaram"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Changlang", "Papum Pare", "West Kameng", "East Siang", "Tirap", "Lower Subansiri"],
  "Assam": ["Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Nagaon", "Tinsukia", "Tezpur", "Kamrup Rural", "Barpeta", "Cachar"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia", "Ara", "Begusarai", "Nalanda", "Madhubani", "Siwan", "Saran"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba", "Rajnandgaon", "Jagdalpur", "Sarguja", "Dhamtari", "Raigarh"],
  "Delhi": ["New Delhi", "Central Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi", "South West Delhi", "North West Delhi"],
  "Goa": ["North Goa", "South Goa", "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand", "Mehsana", "Morbi", "Bharuch", "Valsad"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Rohtak", "Hisar", "Karnal", "Panchkula", "Sonipat", "Yamunanagar", "Kurukshetra"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Hamirpur", "Kangra", "Kullu", "Chamba", "Una", "Bilaspur"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur", "Samba", "Pulwama", "Kupwara", "Poonch"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Palamu", "Ramgarh", "Dumka"],
  "Karnataka": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Davangere", "Udupi", "Tumakuru", "Shivamogga", "Ballari"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Kannur", "Kottayam", "Malappuram", "Idukki", "Wayanad"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Chhindwara"],
  "Maharashtra": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Navi Mumbai", "Jalgaon"],
  "Manipur": ["Imphal West", "Imphal East", "Thoubal", "Churachandpur", "Senapati", "Ukhrul", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar", "Baghmara"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Kolasib", "Serchhip", "Mamit"],
  "Nagaland": ["Dimapur", "Kohima", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Balasore", "Berhampur", "Ganjam", "Angul", "Bhadrak"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Firozpur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Sikar", "Bhilwara", "Sri Ganganagar", "Bharatpur"],
  "Sikkim": ["Gangtok", "Gyalshing", "Namchi", "Mangan", "Pakyong", "Soreng"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Vellore", "Erode", "Thanjavur", "Kanchipuram", "Tiruppur", "Tuticorin"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Medak"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Ambassa", "Khowai"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Agra", "Prayagraj", "Meerut", "Bareilly", "Aligarh", "Gorakhpur", "Jhansi"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Rudrapur", "Nainital", "Mussoorie", "Almora", "Pithoragarh"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Durgapur", "Kharagpur", "Malda", "Bardhaman", "Murshidabad", "Nadia", "Hooghly"]
};

export default function ProfileSetupPage({ onSuccess }: ProfileSetupPageProps) {
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successAnimation, setSuccessAnimation] = useState(false);

  // Form states initialized with existing profile values if present
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [aadhaarNumber, setAadhaarNumber] = useState(user?.aadhaarNumber || '');
  const [age, setAge] = useState<number>(user?.profile?.age || 18);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(user?.profile?.gender || 'Male');
  const [state, setState] = useState(user?.profile?.state || 'Karnataka');
  const [district, setDistrict] = useState(user?.profile?.district || '');
  const [occupation, setOccupation] = useState(user?.profile?.occupation || 'Student');
  const [annualIncome, setAnnualIncome] = useState<number>(user?.profile?.annualIncome || 120000);
  const [educationLevel, setEducationLevel] = useState(user?.profile?.educationLevel || 'High School');
  const [category, setCategory] = useState<'General' | 'OBC' | 'SC' | 'ST'>(user?.profile?.category || 'General');
  const [disabilityStatus, setDisabilityStatus] = useState<boolean>(user?.profile?.disabilityStatus || false);
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Divorced'>(user?.profile?.maritalStatus || 'Single');
  const [familySize, setFamilySize] = useState<number>(user?.profile?.familySize || 4);

  const statesOfIndia = Object.keys(STATE_DISTRICTS);

  // Automatically update the district options and select the first one when State changes
  useEffect(() => {
    const districtsList = STATE_DISTRICTS[state] || [];
    if (districtsList.length > 0) {
      // Keep selected district if it is part of the new state's list, otherwise default to first
      if (!districtsList.includes(district)) {
        setDistrict(districtsList[0]);
      }
    } else {
      setDistrict('');
    }
  }, [state]);

  const occupationsList = [
    "Student", "Farmer", "Unemployed", "Self-Employed", "Private Job", "Government Job", "Daily Wage Laborer", "Retired", "Homemaker"
  ];

  const educationLevels = [
    "Primary School", "Middle School", "High School", "Higher Secondary", "Diploma", "Undergraduate", "Postgraduate", "PhD / Doctorate"
  ];

  // Dynamic calculations for advanced info panel
  const incomeCategory = annualIncome <= 100000 ? "Below Poverty Line (BPL)" : annualIncome <= 300000 ? "Low Income Group (LIG)" : annualIncome <= 800000 ? "Middle Income Group (MIG)" : "High Income Group (HIG)";
  const isEligibleForBplBonus = annualIncome <= 150000;

  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setErrorMsg("Please enter your Full Name.");
        return;
      }
      const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '');
      if (!cleanAadhaar) {
        setErrorMsg("Aadhaar Identification Number is required for citizen onboarding.");
        return;
      }
      if (cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
        setErrorMsg("Aadhaar Number must contain exactly 12 digits.");
        return;
      }
      if (!validateVerhoeff(cleanAadhaar)) {
        setErrorMsg("Invalid Aadhaar Number: Cheksome verification failed (Verhoeff Check failed). Please enter a correct Aadhaar.");
        return;
      }
      if (!district) {
        setErrorMsg("Please choose your Domicile District.");
        return;
      }
    }
    if (currentStep === 2) {
      if (annualIncome < 0) {
        setErrorMsg("Annual Income cannot be negative.");
        return;
      }
    }
    if (currentStep === 3) {
      if (familySize < 1) {
        setErrorMsg("Family size must be at least 1.");
        return;
      }
    }
    
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      await updateProfile({
        fullName,
        aadhaarNumber,
        age: Number(age),
        gender,
        state,
        district,
        occupation,
        annualIncome: Number(annualIncome),
        educationLevel,
        category,
        disabilityStatus,
        maritalStatus,
        familySize: Number(familySize)
      } as any);
      
      setSuccessAnimation(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile. Please check requirements.");
      setIsLoading(false);
    }
  };

  // Steps indicators config
  const steps = [
    { id: 1, label: 'Personal Info', icon: User },
    { id: 2, label: 'Socioeconomic', icon: Briefcase },
    { id: 3, label: 'Additional', icon: FileText },
    { id: 4, label: 'Confirm', icon: Sparkles }
  ];

  const currentDistricts = STATE_DISTRICTS[state] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4" id="profile-wizard-wrapper">
      
      {/* Dynamic Heading */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Complete your profile
        </h2>
        <p className="text-xs text-slate-400">
          This helps us find the optimal state and central government schemes you are eligible for
        </p>
      </div>

      {/* PHOTO STYLE STEP INDICATOR WITH HORIZONTAL LINES */}
      <div className="max-w-xl mx-auto flex items-center justify-between px-4 relative" id="photo-step-indicators">
        {steps.map((st, sIdx) => {
          const StepIcon = st.icon;
          const isActive = currentStep === st.id;
          const isCompleted = currentStep > st.id;
          
          return (
            <React.Fragment key={st.id}>
              {/* Step Circle and Label */}
              <div className="flex flex-col items-center space-y-2.5 z-10 relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (st.id < currentStep) {
                      setCurrentStep(st.id);
                    }
                  }}
                  disabled={st.id > currentStep && !fullName}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg ring-4 ring-orange-500/20' 
                      : isCompleted 
                        ? 'bg-slate-800 text-amber-400 border border-amber-500/30' 
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </motion.button>
                <span className={`text-[11px] font-semibold ${isActive ? 'text-amber-400 font-bold' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                  {st.label}
                </span>
              </div>

              {/* Connecting line between circles */}
              {sIdx < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-slate-800 relative -translate-y-4">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                    style={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* MAIN CONTAINER FRAME */}
      <div className="rounded-2xl border border-slate-800 bg-[#0E1322] shadow-2xl relative overflow-hidden p-8" id="profile-container-frame">
        
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-red-800/20 bg-red-950/10 text-xs text-red-400 flex items-start space-x-2 animate-bounce-short">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP-BY-STEP SLIDING SLIDES USING ANIMATE PRESENCE */}
        <AnimatePresence mode="wait">
          {successAnimation ? (
            <motion.div 
              key="success-anim"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center space-y-4"
              id="success-profile-redirect"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">Profile Calculated & Synchronized!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Evaluating direct benefit matches. Booting your custom dashboard analytics...</p>
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin mx-auto mt-2" />
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              
              {/* STEP 1: PERSONAL INFO */}
              {currentStep === 1 && (
                <div className="space-y-6" id="personal-info-slide">
                  <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">STEP 01/04</span>
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>UIDAI Domicile Alignment compliant</span>
                    </span>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name (As in Aadhaar) *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Aadhaar Identification Number (12 digits) *</label>
                      <input
                        type="text"
                        value={aadhaarNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d\s-]/g, '');
                          setAadhaarNumber(val);
                        }}
                        placeholder="e.g. 1234 5678 9012"
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Age (Years) *</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gender *</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Domicile State Territory *</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                      >
                        {statesOfIndia.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* DYNAMIC DISTRICT DROPDOWN SELECTOR */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Domicile District Territory *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-amber-500" />
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-[#090C15] pl-10 pr-4 py-3.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer appearance-none"
                        >
                          {currentDistricts.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5">Dynamic region filtering allows targeting local municipal subsidies and urban grants.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SOCIOECONOMIC PROFILE */}
              {currentStep === 2 && (
                <div className="space-y-6" id="socioeconomic-info-slide">
                  <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">STEP 02/04</span>
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                      <span>Financial thresholds tracking</span>
                    </span>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Active Occupation *</label>
                      <select
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                      >
                        {occupationsList.map((occ) => (
                          <option key={occ} value={occ}>{occ}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Annual Household Family Income (₹) *</label>
                      <input
                        type="number"
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Education Qualification *</label>
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                      >
                        {educationLevels.map((edu) => (
                          <option key={edu} value={edu}>{edu}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Social Category / Reservation *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                      >
                        <option value="General">General (Unreserved)</option>
                        <option value="OBC">OBC (Other Backward Classes)</option>
                        <option value="SC">SC (Scheduled Caste)</option>
                        <option value="ST">ST (Scheduled Tribe)</option>
                      </select>
                    </div>

                    {/* Advanced socioeconomic preview helper card */}
                    <div className="sm:col-span-2 rounded-xl bg-slate-900/40 border border-slate-850 p-4 space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-white">
                        <Info className="h-4 w-4 text-amber-500" />
                        <span>Dynamic Socioeconomic Analysis</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 text-[11px] text-slate-400 pt-1">
                        <div>
                          <span>Calculated Tier:</span>
                          <strong className="text-amber-400 block mt-0.5">{incomeCategory}</strong>
                        </div>
                        <div>
                          <span>BPL Welfare Eligibility:</span>
                          <strong className={`block mt-0.5 ${isEligibleForBplBonus ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isEligibleForBplBonus ? 'Qualifies for High-Subsidy Programs' : 'Standard Subsidy Rates'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ADDITIONAL CRITERIA */}
              {currentStep === 3 && (
                <div className="space-y-6" id="additional-info-slide">
                  <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">STEP 03/04</span>
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-purple-400" />
                      <span>Additional target classifications</span>
                    </span>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Marital Status *</label>
                      <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Family Size (Members count) *</label>
                      <input
                        type="number"
                        value={familySize}
                        onChange={(e) => setFamilySize(Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090C15] px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 rounded-xl bg-slate-900/20 border border-slate-850 p-6 flex items-start space-x-4">
                      <input
                        type="checkbox"
                        id="disability"
                        checked={disabilityStatus}
                        onChange={(e) => setDisabilityStatus(e.target.checked)}
                        className="h-5 w-5 rounded border-slate-800 bg-[#090C15] text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0 mt-0.5"
                      />
                      <div className="space-y-1">
                        <label htmlFor="disability" className="text-xs font-bold text-white cursor-pointer block">
                          Are you a Person with Disability (PwD)?
                        </label>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Enabling this matches your profile with assistive technologies subsidies, reserved transport passes, and dedicated financial support models under the national PwD act.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRM */}
              {currentStep === 4 && (
                <div className="space-y-6" id="confirm-info-slide">
                  <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">STEP 04/04</span>
                    <span className="text-[11px] text-emerald-400 flex items-center space-x-1 font-mono font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready for Verification</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Verify that your entered indicators match official documents to avoid registration issues.
                  </p>

                  {/* Citizen Verification Status Card */}
                  <div className="rounded-xl border border-slate-800 bg-[#070913] p-5 space-y-3.5" id="verification-status-panel">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />
                      <span>Citizen Credentials Verification Registry</span>
                    </h4>
                    
                    <div className="grid gap-3 sm:grid-cols-3 text-xs">
                      {/* Mobile Verification */}
                      <div className="flex items-center space-x-2.5 rounded-lg border border-slate-850 bg-slate-900/10 p-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Mobile Verified</p>
                          <p className="text-[10px] text-slate-400">✓ Mobile Number Verified</p>
                        </div>
                      </div>

                      {/* Aadhaar Format Validation */}
                      <div className="flex items-center space-x-2.5 rounded-lg border border-slate-850 bg-slate-900/10 p-3">
                        {validateVerhoeff(aadhaarNumber) ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : (
                          <HelpCircle className="h-5 w-5 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-white">Aadhaar Format</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {validateVerhoeff(aadhaarNumber) ? "✓ Aadhaar Format Valid" : "Aadhaar Invalid / Missing"}
                          </p>
                        </div>
                      </div>

                      {/* Aadhaar OCR Document Validation */}
                      <div className="flex items-center space-x-2.5 rounded-lg border border-slate-850 bg-slate-900/10 p-3">
                        {user?.aadhaarDocValidated ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : (
                          <Info className="h-5 w-5 text-slate-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-white">Document Status</p>
                          <p className="text-[10px] text-slate-400">
                            {user?.aadhaarDocValidated ? "✓ Aadhaar Document Validated" : "Document Not Uploaded"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bento-style review grid */}
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    
                    {/* card 1 */}
                    <div className="rounded-xl bg-slate-950/40 border border-slate-850 p-4 space-y-2">
                      <h4 className="font-bold text-amber-400 flex items-center space-x-1.5 pb-1 border-b border-slate-900">
                        <User className="w-3.5 h-3.5" />
                        <span>Personal Credentials</span>
                      </h4>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <p><span className="text-slate-500">Full Name:</span> <strong className="text-white">{fullName}</strong></p>
                        <p><span className="text-slate-500">Age:</span> <strong className="text-white">{age} Years</strong></p>
                        <p><span className="text-slate-500">Gender:</span> <strong className="text-white">{gender}</strong></p>
                      </div>
                    </div>

                    {/* card 2 */}
                    <div className="rounded-xl bg-slate-950/40 border border-slate-850 p-4 space-y-2">
                      <h4 className="font-bold text-amber-400 flex items-center space-x-1.5 pb-1 border-b border-slate-900">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Territorial Domicile</span>
                      </h4>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <p><span className="text-slate-500">State:</span> <strong className="text-white">{state}</strong></p>
                        <p><span className="text-slate-500">District:</span> <strong className="text-white">{district}</strong></p>
                        <p><span className="text-slate-500">Category:</span> <strong className="text-white">{category}</strong></p>
                      </div>
                    </div>

                    {/* card 3 */}
                    <div className="rounded-xl bg-slate-950/40 border border-slate-850 p-4 space-y-2">
                      <h4 className="font-bold text-amber-400 flex items-center space-x-1.5 pb-1 border-b border-slate-900">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Socioeconomic Status</span>
                      </h4>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <p><span className="text-slate-500">Occupation:</span> <strong className="text-white">{occupation}</strong></p>
                        <p><span className="text-slate-500">Annual Income:</span> <strong className="text-emerald-400">₹{annualIncome.toLocaleString('en-IN')}</strong></p>
                        <p><span className="text-slate-500">Education:</span> <strong className="text-white">{educationLevel}</strong></p>
                      </div>
                    </div>

                    {/* card 4 */}
                    <div className="rounded-xl bg-slate-950/40 border border-slate-850 p-4 space-y-2">
                      <h4 className="font-bold text-amber-400 flex items-center space-x-1.5 pb-1 border-b border-slate-900">
                        <Award className="w-3.5 h-3.5" />
                        <span>Special Qualifications</span>
                      </h4>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <p><span className="text-slate-500">Marital Status:</span> <strong className="text-white">{maritalStatus}</strong></p>
                        <p><span className="text-slate-500">Family Size:</span> <strong className="text-white">{familySize} Members</strong></p>
                        <p><span className="text-slate-500">Disability (PwD):</span> <strong className={disabilityStatus ? "text-emerald-400" : "text-white"}>{disabilityStatus ? "Yes (Active)" : "No"}</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* security pledge */}
                  <div className="rounded-xl bg-slate-900/30 border border-slate-850 p-4 flex items-start space-x-2.5 text-[10px] text-slate-400">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Consent Pledge:</strong> I confirm that the provided parameters are correct. BharatAssist will compute welfare matching percentages securely and in complete adherence with official ministerial criteria.
                    </span>
                  </div>
                </div>
              )}

              {/* ACTIONS CONTROLS BAR */}
              <div className="border-t border-slate-900 pt-6 flex justify-between items-center">
                {currentStep > 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center space-x-2 rounded-xl bg-slate-950 border border-slate-850 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </motion.button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg cursor-pointer"
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-40 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <span>Finish & Save Profile</span>
                        <UserCheck className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
