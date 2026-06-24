import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  ChevronDown, 
  Users, 
  TrendingUp, 
  Milestone, 
  Smartphone, 
  CheckCircle2,
  Search,
  MapPin,
  Globe,
  Compass,
  Filter,
  Info,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface LandingPageProps {
  onExploreSchemes: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  setActiveTab: (tab: string) => void;
}

const ALL_STATES_DATA = [
  { name: "Andhra Pradesh", count: 24, region: "South", highlights: ["Amma Vodi Support", "YSR Rythu Bharosa", "Jagananna Vidya Deevena"] },
  { name: "Arunachal Pradesh", count: 12, region: "North-East", highlights: ["Deen Dayal Swavalamban", "CM Arogya Arunachal", "District Innovation Grants"] },
  { name: "Assam", count: 18, region: "North-East", highlights: ["Orunodoi Scheme", "Pragyan Bharti Scooty", "Apunar Apun Ghar"] },
  { name: "Bihar", count: 25, region: "East", highlights: ["Student Credit Card", "Kushal Yuva Skill Program", "Kanya Utthan Yojana"] },
  { name: "Chhattisgarh", count: 15, region: "Central", highlights: ["Rajiv Gandhi Kisaan Nyay", "Godhan Nyay Yojana", "Suposhan Abhiyan"] },
  { name: "Goa", count: 14, region: "West", highlights: ["Griha Aadhar Scheme", "Laadli Laxmi Support", "Dayanand Social Security"] },
  { name: "Gujarat", count: 27, region: "West", highlights: ["MA Yojana Healthcare", "Mukhya Mantri Amrutam", "Shramik Manpasand Pass"] },
  { name: "Haryana", count: 21, region: "North", highlights: ["Parivar Pehchan Patra", "Antyodaya Parivar Utthan", "Ladki Bahin Support"] },
  { name: "Himachal Pradesh", count: 16, region: "North", highlights: ["Himcare Health Card", "Sahara Medical Aid", "CM Swavalamban Yojana"] },
  { name: "Jharkhand", count: 17, region: "East", highlights: ["Sarjan Pension Yojana", "Marang Gomke Scholarship", "Sona Sobhran Saree Scheme"] },
  { name: "Karnataka", count: 34, region: "South", highlights: ["Gruha Lakshmi Scheme", "Yuva Nidhi Allowance", "Shakti Free Travel"] },
  { name: "Kerala", count: 29, region: "South", highlights: ["Karunya Benevolent Fund", "K-FON Free Internet", "Sarathi Student Scheme"] },
  { name: "Madhya Pradesh", count: 30, region: "Central", highlights: ["Ladli Behna Yojana", "Seekho Kamao Stipend", "Sambal Welfare Support"] },
  { name: "Maharashtra", count: 28, region: "West", highlights: ["Sanjay Gandhi Niradhar", "MahaSwayam Employment", "Lek Ladki Support"] },
  { name: "Manipur", count: 11, region: "North-East", highlights: ["CMgi Hakshelgi Tengbang", "Loktak Livelihood Project", "Chief Minister's Scholarship"] },
  { name: "Meghalaya", count: 13, region: "North-East", highlights: ["FOCUS Farmer Program", "Meghalaya Health Insurance", "Livelihood Promotion Trust"] },
  { name: "Mizoram", count: 10, region: "North-East", highlights: ["SEDP Development Policy", "State Scholarship Portal", "Mizoram Handloom Subsidy"] },
  { name: "Nagaland", count: 12, region: "North-East", highlights: ["CM Health Insurance", "Nagaland Pension Yojana", "Self-Employment Subsidy"] },
  { name: "Odisha", count: 23, region: "East", highlights: ["KALIA Farmer Support", "Biju Swasthya Kalyan (BSKY)", "Madhu Babu Pension"] },
  { name: "Punjab", count: 19, region: "North", highlights: ["Mai Bhago Vidya Scheme", "Ashirwad Marriage Grant", "Mera Ghar Mere Naam"] },
  { name: "Rajasthan", count: 26, region: "North", highlights: ["Chiranjeevi Health Insurance", "Indira Rasoi Subsidy", "Anuprati Free Coaching"] },
  { name: "Sikkim", count: 12, region: "North-East", highlights: ["Garib Awas Housing", "Aama Yojana Support", "Sikkim Organic Mission Support"] },
  { name: "Tamil Nadu", count: 32, region: "South", highlights: ["Pudhumai Penn Scheme", "Cooperative Farm Loans", "Kalaignar Magalir Urimai"] },
  { name: "Telangana", count: 26, region: "South", highlights: ["Rythu Bandhu Investment", "Dalit Bandhu Support", "Aasara Pension Scheme"] },
  { name: "Tripura", count: 14, region: "North-East", highlights: ["Mukhyamantri Yuba Jogajog", "State Merit Scholarship", "Tripura Rubber Cultivation"] },
  { name: "Uttar Pradesh", count: 32, region: "North", highlights: ["Kanya Sumangala Yojana", "Pankh Career Yojana", "UP Bhagya Laxmi Support"] },
  { name: "Uttarakhand", count: 15, region: "North", highlights: ["Gaura Devi Kanya Dhan", "Swarojgar Self-Employment", "Uttarakhand Vatsalya"] },
  { name: "West Bengal", count: 31, region: "East", highlights: ["Lakshmir Bhandar Cash", "Kanyashree Education", "Sabooj Sathi Free Cycles"] },
  { name: "Jammu & Kashmir", count: 15, region: "North", highlights: ["JK Sehat Insurance", "Mumkin Livelihood Subsidy", "Ladli Beti Trust"] },
  { name: "Delhi", count: 18, region: "North", highlights: ["Ladli Girl Scheme", "Delhi Pension Scheme", "Free Lifeline Electricity"] },
  { name: "Puducherry", count: 11, region: "South", highlights: ["Centrally Sponsored Portals", "Puducherry Student Support", "Fishermen Subsidy"] },
  { name: "Ladakh", count: 8, region: "North", highlights: ["Yountan Student Scheme", "Greenhouse Subsidy", "Ladakh Homestay Support"] }
];

const REGIONS = ["All", "North", "South", "East", "West", "Central", "North-East"];

export default function LandingPage({ onExploreSchemes, onOpenAuth, setActiveTab }: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Filtered states memoized computation
  const filteredStates = useMemo(() => {
    return ALL_STATES_DATA.filter(state => {
      const matchesSearch = state.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            state.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRegion = selectedRegion === "All" || state.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const faqs = [
    {
      q: "How does BharatAssist AI identify eligible schemes for me?",
      a: "By mapping your profile details (age, income, location, occupation) against hundreds of eligibility parameters, our matching engine calculates a custom score for each scheme, categorization ranges from Highly Eligible to Potentially Eligible."
    },
    {
      q: "Is my Aadhaar Card data secure on this platform?",
      a: "Yes. All uploads are processed server-side. Tesseract OCR parses demographic information to validate parameters and doesn't store permanent copies of files, mimicking premium compliance vaults."
    },
    {
      q: "Can I apply directly for government schemes through this platform?",
      a: "BharatAssist AI evaluates your document readiness, provides precise step-by-step guides, and routes you directly to the official ministry/nodal application URLs linked with each policy."
    },
    {
      q: "Which Indian languages are supported by the AI Assistant chatbot?",
      a: "Our conversational companion supports seamless interactions in English, Hindi (हिन्दी), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), and Telugu (తెలుగు)."
    }
  ];

  return (
    <div className="space-y-24 pb-16" id="bharat-assist-landing-page">
      
      {/* 1. HERO SECTION WITH STAGGERED ENTRANCES */}
      <section className="relative overflow-hidden py-24 px-4 text-center sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
        
        <div className="relative mx-auto max-w-4xl space-y-8">
          
          {/* Animated Logo Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center space-x-2 rounded-full bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400 border border-amber-500/20 shadow-sm animate-pulse-glow">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>India's Premium Digital Welfare Platform</span>
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-5xl font-extrabold tracking-tight text-white sm:text-7xl"
          >
            Bharat<span className="text-glow bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">Assist AI</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto max-w-2xl font-display text-lg text-amber-100/90 font-medium tracking-wide"
          >
            "Empowering Every Citizen Through Intelligent Access To Government Welfare."
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto max-w-xl text-xs text-slate-400 leading-relaxed"
          >
            Discover matching welfare options, verify required documents securely using AI OCR, and chat in native regional languages with our RAG-enhanced AI assistant.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: 'spring' }}
            className="flex flex-wrap justify-center gap-4 pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={onExploreSchemes}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-xs font-bold text-slate-950 shadow-lg cursor-pointer"
              id="hero-cta-explore"
            >
              <span>Explore Government Schemes</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(15, 23, 42, 0.8)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenAuth('signup')}
              className="rounded-xl border border-slate-800 bg-slate-950 px-6 py-3.5 text-xs font-semibold text-white cursor-pointer"
              id="hero-cta-signup"
            >
              Register Citizen Profile
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* 2. INTERACTIVE ALL-INDIA STATE WELFARE DOMICILE HUB */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="state-benefits-explorer">
        <div className="text-center space-y-3 mb-10">
          <h2 className="font-display text-3xl font-extrabold text-white flex items-center justify-center space-x-2">
            <Globe className="h-7 w-7 text-amber-500 animate-spin-slow" />
            <span>All-India Domicile Welfare Coverage Center</span>
          </h2>
          <p className="mx-auto max-w-xl text-xs text-slate-400">
            Select, search, or filter across all Indian states and Union Territories to find localized state initiatives.
          </p>
        </div>

        {/* Search and Filters Bento Section */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-sm mb-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search your state or a scheme highlight (e.g. Karnataka, Amma Vodi, Pension...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Region Select indicator */}
            <div className="flex items-center space-x-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Region Filter:</span>
            </div>
          </div>

          {/* region tabs slider */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedRegion === region 
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                    : 'bg-slate-950/60 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {region === "All" ? "All Territories" : `${region} India`}
              </button>
            ))}
          </div>

          {/* statistics strip */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-900 pt-4">
            <span className="flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Showing <strong>{filteredStates.length}</strong> of {ALL_STATES_DATA.length} territories</span>
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">
              Total pre-seeded local guidelines: 618+
            </span>
          </div>
        </div>

        {/* States dynamic Grid with Motion animations */}
        <motion.div 
          layout
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredStates.map((st) => {
              const isExpanded = expandedState === st.name;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={st.name}
                  whileHover={{ y: isExpanded ? 0 : -4, borderColor: "rgba(245, 158, 11, 0.4)" }}
                  className={`rounded-2xl border border-slate-850 bg-slate-900/10 p-5 transition-all flex flex-col justify-between ${
                    isExpanded 
                      ? 'ring-1 ring-amber-500 border-amber-500 bg-slate-900/30 col-span-1 sm:col-span-2' 
                      : 'hover:bg-slate-900/20'
                  }`}
                >
                  <div>
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <h3 className="font-display text-xs font-bold text-white tracking-wide">{st.name}</h3>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block">{st.region} Region</span>
                      </div>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-mono font-bold text-amber-400">
                        {st.count} Schemes
                      </span>
                    </div>

                    {/* Active highlights list */}
                    <div className="mt-4 space-y-2.5">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Active Programs</p>
                      {st.highlights.slice(0, isExpanded ? undefined : 2).map((hl, hIdx) => (
                        <div key={hIdx} className="flex items-start space-x-2 text-xs text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </div>
                      ))}
                      
                      {!isExpanded && st.highlights.length > 2 && (
                        <button 
                          onClick={() => setExpandedState(st.name)}
                          className="text-[10px] text-amber-400 hover:underline flex items-center space-x-1 mt-1 font-semibold"
                        >
                          <span>+ {st.highlights.length - 2} more programs</span>
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-slate-900/60 text-xs text-slate-400 space-y-2"
                      >
                        <p className="leading-relaxed">
                          Resident domiciles of <strong>{st.name}</strong> qualify for customized direct benefit transfer programs, financial assistance, and education support structures managed under regional minsteries.
                        </p>
                        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 flex items-center space-x-2 text-[10px] text-slate-400">
                          <Info className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                          <span>Complete your demographic profile and select "{st.name}" as your Domicile State to calculate your precise eligibility score for these programs.</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-5 pt-3 border-t border-slate-900/60 flex items-center gap-2">
                    {isExpanded ? (
                      <button 
                        onClick={() => setExpandedState(null)}
                        className="flex-1 rounded-xl bg-slate-950 border border-slate-850 py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                      >
                        Collapse Details
                      </button>
                    ) : (
                      <button 
                        onClick={() => setExpandedState(st.name)}
                        className="rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-center text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                        title="View details"
                      >
                        Details
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        onOpenAuth('signup');
                      }}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 py-2.5 text-center text-xs font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
                    >
                      Apply Domicile
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredStates.length === 0 && (
            <div className="col-span-full py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10">
              <Compass className="h-10 w-10 text-slate-600 mx-auto animate-bounce" />
              <h3 className="font-display text-sm font-bold text-white">No State Territories Match Search Criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Try selecting "All Territories" or clearing search terms to inspect the general schemes.</p>
              <button 
                onClick={() => { setSearchQuery(""); setSelectedRegion("All"); }}
                className="mt-3 px-4 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* 3. HOW IT WORKS SECTION WITH STAGGERED ROTATIONS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="platform-how-it-works">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-display text-3xl font-extrabold text-white">How BharatAssist Empowers You</h2>
          <p className="mx-auto max-w-md text-xs text-slate-400">Four seamless digital steps to unlock your rightful welfare support</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { step: "01", title: "Complete Profile", desc: "Specify age, state, category, and household income to compute personalized matches.", icon: Users },
            { step: "02", title: "AI Filtering Match", desc: "Our RAG systems identify policies and rank programs according to your qualifications.", icon: Sparkles },
            { step: "03", title: "OCR Doc Scan", desc: "Drag and drop Aadhaar, PAN, and credentials to verify name alignment in real-time.", icon: Smartphone },
            { step: "04", title: "Apply Directly", desc: "Receive immediate tracking links and route to official ministry application sites.", icon: CheckCircle }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div 
                whileHover={{ y: -8, borderColor: '#F59E0B', boxShadow: "0 10px 30px -10px rgba(245, 158, 11, 0.15)" }}
                transition={{ duration: 0.3 }}
                key={idx} 
                className="relative rounded-2xl border border-slate-850 bg-slate-900/10 p-6 transition-all"
              >
                <span className="absolute top-4 right-4 text-3xl font-mono font-bold text-slate-800">{item.step}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. SUCCESS STORIES & TIMELINE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="success-stories">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-display text-3xl font-extrabold text-white">Citizen Success Highlights</h2>
          <p className="mx-auto max-w-md text-xs text-slate-400">Real impacts made through simplified welfare discovery</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Ramesh Mandloi", occupation: "Marginal Farmer (Madhya Pradesh)", quote: "I received ₹6,000 via PM-KISAN within weeks. The eligibility checker confirmed my qualification instantly, showing me exactly which land records were needed.", scheme: "PM-KISAN" },
            { name: "Priyanka Adiga", occupation: "Degree Student (Karnataka)", quote: "BharatAssist suggested Gruha Lakshmi and Post-Graduate Scholarships based on my profile. The AI chatbot answered my questions in Kannada instantly.", scheme: "Gruha Lakshmi" },
            { name: "Amit Sahni", occupation: "Micro-Entrepreneur (Rajasthan)", quote: "Got ₹2 Lakhs Mudra loan approval. Being able to compare Mudra specs with other MSME benefits side-by-side saved me from bank rounds.", scheme: "PM Mudra Yojana" }
          ].map((story, idx) => (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              key={idx} 
              className="rounded-2xl border border-slate-850 bg-slate-900/20 p-6 border-glow flex flex-col justify-between"
            >
              <p className="text-xs text-slate-400 italic leading-relaxed">"{story.quote}"</p>
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">{story.name}</h4>
                  <p className="text-[10px] text-slate-500">{story.occupation}</p>
                </div>
                <span className="rounded bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                  {story.scheme}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. FAQ ACCORDION SECTION WITH COLLAPSIBLE MOTION HEIGHTS */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6" id="faq-accordion-section">
        <div className="text-center space-y-3 mb-10">
          <h2 className="font-display text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400">Everything you need to know about the platform guidelines and AI services</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-slate-850 bg-slate-900/10 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center px-5 py-4 text-left text-xs font-bold text-white hover:bg-slate-900/40 transition-all cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-amber-400' : ''}`} />
              </button>
              
              <AnimatePresence initial={false}>
                {openFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-3 bg-slate-950/20">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mx-auto max-w-7xl px-4 border-t border-slate-900 pt-10" id="landing-footer">
        <div className="grid gap-6 sm:grid-cols-3 text-xs text-slate-400 pb-10">
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-white">BharatAssist AI</h4>
            <p className="text-[11px] leading-relaxed">Our unified AI portal brings security, ease, and absolute clarity to finding national and state-specific citizen benefit schemes.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-display text-xs font-bold text-white">Quick Portals</h4>
            <ul className="space-y-1 text-[11px]">
              <li><a href="https://india.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-all">National Portal of India</a></li>
              <li><a href="https://mygov.in" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-all">MyGov Innovation Hub</a></li>
              <li><a href="https://digilocker.gov.in" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-all">DigiLocker Digital Vault</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-display text-xs font-bold text-white">Contact Helplines</h4>
            <p className="text-[11px]">National Support: 1800-111-400</p>
            <p className="text-[11px]">Technical Email: support@bharatassist.gov.in</p>
          </div>
        </div>
        <div className="text-center border-t border-slate-950 py-6 text-[10px] text-slate-600">
          © {new Date().getFullYear()} BharatAssist AI Welfare Portal. National Informatics Simulated Center. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
