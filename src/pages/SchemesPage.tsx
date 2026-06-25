import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Translate } from '../context/LanguageContext.js';
import { Scheme } from '../types.js';
import SchemeCompareTool from '../components/SchemeCompareTool.js';
import GuidedApplyWizard from '../components/GuidedApplyWizard.js';
import AITranslator from '../components/AITranslator.js';
import { 
  Search, 
  Filter, 
  Bookmark, 
  MapPin, 
  Layers, 
  ArrowRight, 
  FileText, 
  Check, 
  AlertCircle,
  Loader2,
  BookmarkCheck,
  ChevronDown,
  Globe,
  Sparkles
} from 'lucide-react';

interface SchemesPageProps {
  onApplySuccess?: () => void;
  currentLanguage?: string;
}

export default function SchemesPage({ onApplySuccess, currentLanguage = 'English' }: SchemesPageProps) {
  const { user, token, toggleBookmark, fetchApplications } = useAuth();
  
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filtering & Query states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [semanticMode, setSemanticMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Modern Toast system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Visual category badges color system
  const getCategoryColor = (cat: string) => {
    const normalized = cat.toLowerCase();
    if (normalized.includes('scholarship') || normalized.includes('education')) {
      return {
        badge: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
      };
    }
    if (normalized.includes('farmer') || normalized.includes('agriculture') || normalized.includes('rural')) {
      return {
        badge: 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
      };
    }
    if (normalized.includes('women')) {
      return {
        badge: 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
      };
    }
    if (normalized.includes('startup') || normalized.includes('msme') || normalized.includes('business')) {
      return {
        badge: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
      };
    }
    if (normalized.includes('senior') || normalized.includes('pension')) {
      return {
        badge: 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
      };
    }
    return {
      badge: 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
    };
  };

  // Programmatic profile matching compatibility rating
  const checkCompatibility = (scheme: Scheme) => {
    if (!user || !user.profile) return null;
    const profile = user.profile;
    
    let matches = 0;
    let checks = 0;

    // Domicile state check
    if (scheme.state && scheme.state !== 'All' && scheme.state !== 'National') {
      checks++;
      if (scheme.state.toLowerCase() === profile.state.toLowerCase()) {
        matches++;
      }
    }
    
    // Gender check
    const genders = scheme.eligibilityCriteria?.genders;
    if (genders && genders.length > 0 && !genders.includes('All')) {
      checks++;
      if (genders.some(g => g.toLowerCase() === profile.gender.toLowerCase())) {
        matches++;
      }
    }

    // Income check
    const incomeMax = scheme.eligibilityCriteria?.incomeMax;
    if (incomeMax && incomeMax > 0) {
      checks++;
      if (profile.annualIncome <= incomeMax) {
        matches++;
      }
    }

    if (checks === 0) return { label: 'Compatible', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' };
    if (matches === checks) return { label: 'Highly Compatible', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 font-bold' };
    if (matches > 0) return { label: 'Partial Match', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' };
    return { label: 'Incompatible Criteria', color: 'text-red-400 border-red-500/10 bg-red-500/5' };
  };

  // Comparison list
  const [compareList, setCompareList] = useState<Scheme[]>([]);

  // Detailed Modal view state
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [applyingScheme, setApplyingScheme] = useState<Scheme | null>(null);
  const [filingStatus, setFilingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Load Schemes
  const fetchSchemes = async (aiQuery?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      let url = '/api/schemes';
      if (aiQuery && semanticMode) {
        url = `/api/schemes/search?q=${encodeURIComponent(aiQuery)}`;
      } else {
        const params = new URLSearchParams();
        if (selectedState !== 'All') params.append('state', selectedState);
        if (selectedCategory !== 'All') params.append('category', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not load schemes.");
      const data = await res.json();
      setSchemes(data.schemes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to retrieve schemes catalogue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Standard debounce of non-semantic filtering
    if (!semanticMode) {
      const timer = setTimeout(() => {
        fetchSchemes();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedState, selectedCategory, semanticMode]);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setAiLoading(true);
    await fetchSchemes(searchQuery);
    setAiLoading(false);
  };

  // Bookmark Toggle
  const handleToggleBookmark = async (schemeId: string) => {
    if (!user) {
      showToast("Please login or register to bookmark welfare schemes.", "warning");
      return;
    }
    try {
      await toggleBookmark(schemeId);
      const isBookmarked = user?.savedSchemes?.includes(schemeId);
      showToast(isBookmarked ? "Scheme removed from bookmarks." : "Scheme bookmarked successfully!", "success");
    } catch (err) {
      console.error("Bookmark fail:", err);
      showToast("Failed to update bookmark status.", "error");
    }
  };

  // Compare toggles
  const handleToggleCompare = (s: Scheme) => {
    if (compareList.some(item => item.id === s.id)) {
      setCompareList(prev => prev.filter(item => item.id !== s.id));
      showToast("Scheme removed from compare list.", "info");
    } else {
      if (compareList.length >= 3) {
        showToast("You can compare a maximum of 3 schemes side-by-side.", "warning");
        return;
      }
      setCompareList(prev => [...prev, s]);
      showToast(`Added "${s.name}" to comparison matrix.`, "success");
    }
  };

  // File an application submission
  const handleApplyScheme = async (schemeId: string, schemeName: string) => {
    if (!token) {
      showToast("Authentication token expired. Please re-login.", "error");
      return;
    }
    setFilingStatus('loading');
    try {
      const res = await fetch('/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schemeId, schemeName })
      });
      const data = await res.json();
      if (res.ok) {
        setFilingStatus('success');
        await fetchApplications(); // Refresh trackers
        if (onApplySuccess) onApplySuccess();
        showToast("Application successfully filed in your dashboard tracker!", "success");
      } else {
        showToast(data.error || "Filing failed", "error");
        setFilingStatus('error');
      }
    } catch (err) {
      console.error(err);
      showToast("Network error encountered during application.", "error");
      setFilingStatus('error');
    }
  };

  const states = ["All", "National", "Karnataka", "Tamil Nadu", "Maharashtra", "Uttar Pradesh", "Bihar", "Gujarat", "Rajasthan", "Delhi", "Kerala"];
  const categories = [
    "All", "Scholarships", "Farmer Schemes", "Women Welfare", "Startup Support", "MSME Benefits",
    "Senior Citizen Schemes", "Pension Programs", "Healthcare Schemes", "Housing Schemes",
    "Employment Schemes", "Skill Development", "Education Support", "Rural Development", "State Welfare Programs"
  ];

  return (
    <div className="space-y-8" id="schemes-catalog-portal">
      
      {/* Search Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-white"><Translate>Citizen Welfare Schemes Engine</Translate></h2>
          <p className="text-xs text-slate-400"><Translate>Compare central and state initiatives, filter by criteria, and apply using secure digital guides.</Translate></p>
        </div>

        {/* Toggle between Keyword and AI Semantic Search */}
        <div className="flex bg-slate-950 p-1 rounded-xl w-fit self-start md:self-auto">
          <button
            onClick={() => { setSemanticMode(false); setSearchQuery(''); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${!semanticMode ? 'bg-slate-900 text-amber-400 border border-slate-800/60' : 'text-slate-400 hover:text-white'}`}
          >
            <Translate>Structured Search</Translate>
          </button>
          <button
            onClick={() => { setSemanticMode(true); setSearchQuery(''); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1 ${semanticMode ? 'bg-slate-900 text-amber-400 border border-slate-800/60' : 'text-slate-400 hover:text-white'}`}
          >
            <Sparkles className="h-3 w-3" />
            <span><Translate>AI Semantic Search</Translate></span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERING BAR CONTROL */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
        {semanticMode ? (
          <form onSubmit={handleSemanticSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask anything (e.g., 'What schemes offer scholarships for girls with low household income?')"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 transition shrink-0 flex items-center justify-center space-x-1.5"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Searching AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            
            {/* Search Input field */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keywords..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Domicile geographic filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 appearance-none"
              >
                {states.map((st) => (
                  <option key={st} value={st}>{st === 'All' ? 'All States (National)' : st}</option>
                ))}
              </select>
            </div>

            {/* Category selection */}
            <div className="relative">
              <Layers className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>

          </div>
        )}
      </div>

      {/* COMPARISON TOOL DRAWER BOX */}
      <SchemeCompareTool 
        selectedSchemes={compareList} 
        onRemove={(id) => setCompareList(prev => prev.filter(item => item.id !== id))} 
        onClear={() => setCompareList([])}
        onApply={(id) => {
          const s = schemes.find(item => item.id === id);
          if (s) setSelectedScheme(s);
        }}
      />

      {/* CATALOG INDEX STREAMS */}
      <div className="flex items-center justify-between mt-6 mb-2">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
          {loading ? "Searching registry..." : `Welfare Schemes (${schemes.length})`}
        </span>
        {!loading && schemes.length > 0 && (
          <span className="text-[11px] text-amber-400/90 font-medium bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-lg">
            ⚡ Matches computed automatically based on your demographic profile
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
          <p className="text-xs text-slate-400">Querying national welfare registry database...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-500 space-y-3 rounded-2xl border border-slate-850 bg-slate-900/10">
          <AlertCircle className="h-9 w-9 text-slate-600 mx-auto" />
          <p className="font-bold text-white text-sm">No Schemes Match Your Filters</p>
          <p className="max-w-xs mx-auto text-slate-400 leading-relaxed">Try clearing search inputs or toggle AI semantic search off to explore generic benefit categories.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="schemes-grid-list">
          {schemes.map((scheme) => {
            const isBookmarked = user?.savedSchemes?.includes(scheme.id);
            const isComparing = compareList.some(item => item.id === scheme.id);
            const categoryColors = getCategoryColor(scheme.category);
            const compatibility = checkCompatibility(scheme);

            return (
              <div 
                key={scheme.id} 
                className="rounded-2xl border border-slate-850 bg-slate-900/10 p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300 relative group"
              >
                {/* Background decorative category tint on hover */}
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                
                <div className="space-y-4 relative z-10">
                  {/* Category + Bookmark + Compatibility Controls */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${categoryColors.badge}`}>
                        {scheme.category}
                      </span>
                      {compatibility && (
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold border ${compatibility.color}`}>
                          {compatibility.label}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleBookmark(scheme.id)}
                      className={`p-1.5 rounded-lg hover:bg-slate-950 transition-all shrink-0 ${isBookmarked ? 'text-amber-400 bg-amber-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                      title="Bookmark"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
 
                  {/* Title & Description */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 min-h-[40px] leading-snug">
                      {scheme.name}
                    </h3>
                    {currentLanguage && currentLanguage !== 'English' ? (
                      <div className="mt-2 min-h-[50px]">
                        <AITranslator 
                          textToTranslate={`Welfare Program Name: ${scheme.name}\nDescription: ${scheme.description}`} 
                          targetLanguage={currentLanguage} 
                          fallbackText={scheme.description} 
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-2 line-clamp-3 min-h-[50px]">
                        {scheme.description}
                      </p>
                    )}
                  </div>
 
                  {/* Highlights and constraints */}
                  <div className="space-y-2 border-t border-slate-950 pt-3.5 text-[10px] text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">State Scope: <strong className="text-slate-300 font-medium">{scheme.state}</strong></span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <FileText className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-emerald-400/90 font-semibold leading-normal">
                        Benefits: {scheme.benefits}
                      </span>
                    </div>
                  </div>
                </div>
 
                {/* Submitting Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-950 flex gap-2 relative z-10">
                  <button
                    onClick={() => setSelectedScheme(scheme)}
                    className="flex-1 rounded-xl bg-slate-950 hover:bg-slate-900 py-2.5 text-center text-xs font-semibold text-slate-300 transition border border-slate-850 flex items-center justify-center space-x-1"
                  >
                    <span>View Card</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleCompare(scheme)}
                    className={`rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all duration-200 ${
                      isComparing 
                        ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' 
                        : 'border-slate-800 bg-transparent text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                    title="Compare side-by-side"
                  >
                    Compare
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL DRAWER / MODAL POPUP */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" id="scheme-details-modal">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => { setSelectedScheme(null); setFilingStatus('idle'); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-full p-1.5 hover:bg-slate-850"
            >
              <AlertCircle className="h-5 w-5 rotate-45" />
            </button>             <div className="space-y-6">
              <div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                  {selectedScheme.category}
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-3">
                  {currentLanguage && currentLanguage !== 'English' ? (
                    <AITranslator textToTranslate={selectedScheme.name} targetLanguage={currentLanguage} variant="inline" />
                  ) : (
                    selectedScheme.name
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Scope Territory: {selectedScheme.state} Domicile Only</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Objective & Details</h4>
                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-900">
                  {currentLanguage && currentLanguage !== 'English' ? (
                    <AITranslator textToTranslate={selectedScheme.description} targetLanguage={currentLanguage} fallbackText={selectedScheme.description} />
                  ) : (
                    selectedScheme.description
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">Qualifications Check</h4>
                  {currentLanguage && currentLanguage !== 'English' ? (
                    <AITranslator textToTranslate={selectedScheme.eligibilityDescription} targetLanguage={currentLanguage} fallbackText={selectedScheme.eligibilityDescription} />
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedScheme.eligibilityDescription}</p>
                  )}
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <h4 className="text-[11px] font-bold text-emerald-500 tracking-wider uppercase mb-2">Benefits Coverage</h4>
                  {currentLanguage && currentLanguage !== 'English' ? (
                    <AITranslator textToTranslate={selectedScheme.benefits} targetLanguage={currentLanguage} fallbackText={selectedScheme.benefits} />
                  ) : (
                    <p className="text-xs text-emerald-400 font-semibold leading-relaxed">{selectedScheme.benefits}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">Required Credentials Checklist</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedScheme.documentsRequired.map((doc, idx) => (
                    <span key={idx} className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs text-slate-300 border border-slate-900">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 flex flex-col sm:flex-row gap-2 justify-between items-center">
                <div className="text-xs text-slate-500">
                  Filing Deadline: <span className="text-red-400 font-semibold">{new Date(selectedScheme.deadline).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <a 
                    href={selectedScheme.officialApplicationLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 sm:flex-none text-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    Visit Ministry Site
                  </a>
                  
                  {token ? (
                    <button
                      onClick={() => {
                        setApplyingScheme(selectedScheme);
                        setSelectedScheme(null); // Smooth transition: close static details modal
                      }}
                      className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 transition"
                    >
                      Begin Guided Application
                    </button>
                  ) : (
                    <button
                      onClick={() => showToast("Please login or register to start the guided application assistant.", "warning")}
                      className="flex-1 sm:flex-none rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
                    >
                      Login to Apply
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GUIDED APPLICATION COMPANION WIZARD */}
      {applyingScheme && (
        <GuidedApplyWizard 
          scheme={applyingScheme} 
          onClose={() => setApplyingScheme(null)} 
          onApplySuccess={() => {
            if (onApplySuccess) onApplySuccess();
          }}
        />
      )}

      {/* PREMIUM FLOATING TOAST CONTAINER */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in-up">
          <div className={`flex items-center space-x-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md max-w-sm ${
            toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
            toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-300' :
            toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-300' :
            'bg-slate-950/90 border-slate-800 text-slate-200'
          }`}>
            <AlertCircle className={`h-5 w-5 shrink-0 ${
              toast.type === 'success' ? 'text-emerald-400' :
              toast.type === 'error' ? 'text-red-400' :
              toast.type === 'warning' ? 'text-amber-400' :
              'text-blue-400'
            }`} />
            <span className="text-xs font-semibold leading-relaxed">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
