import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Scheme } from '../types.js';
import SchemeCompareTool from '../components/SchemeCompareTool.js';
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
}

export default function SchemesPage({ onApplySuccess }: SchemesPageProps) {
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

  // Comparison list
  const [compareList, setCompareList] = useState<Scheme[]>([]);

  // Detailed Modal view state
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
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
      alert("Please login or register to bookmark welfare schemes.");
      return;
    }
    try {
      await toggleBookmark(schemeId);
    } catch (err) {
      console.error("Bookmark fail:", err);
    }
  };

  // Compare toggles
  const handleToggleCompare = (s: Scheme) => {
    if (compareList.some(item => item.id === s.id)) {
      setCompareList(prev => prev.filter(item => item.id !== s.id));
    } else {
      if (compareList.length >= 3) {
        alert("You can compare a maximum of 3 schemes side-by-side.");
        return;
      }
      setCompareList(prev => [...prev, s]);
    }
  };

  // File an application submission
  const handleApplyScheme = async (schemeId: string, schemeName: string) => {
    if (!token) {
      alert("Authentication token expired. Please re-login.");
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
      } else {
        alert(data.error || "Filing failed");
        setFilingStatus('error');
      }
    } catch (err) {
      console.error(err);
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
          <h2 className="font-display text-xl font-bold text-white">Government Schemes Portal</h2>
          <p className="text-xs text-slate-400">Discover and compare national and state-specific welfare benefits</p>
        </div>

        {/* Toggle between Keyword and AI Semantic Search */}
        <div className="flex bg-slate-950 p-1 rounded-xl w-fit self-start md:self-auto">
          <button
            onClick={() => { setSemanticMode(false); setSearchQuery(''); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${!semanticMode ? 'bg-slate-900 text-amber-400 border border-slate-800/60' : 'text-slate-400 hover:text-white'}`}
          >
            Structured Search
          </button>
          <button
            onClick={() => { setSemanticMode(true); setSearchQuery(''); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1 ${semanticMode ? 'bg-slate-900 text-amber-400 border border-slate-800/60' : 'text-slate-400 hover:text-white'}`}
          >
            <Sparkles className="h-3 w-3" />
            <span>AI Semantic Search</span>
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
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
          <p className="text-xs text-slate-400">Querying national welfare registry database...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 space-y-2 rounded-2xl border border-slate-850 bg-slate-900/10">
          <AlertCircle className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="font-bold text-white">No Schemes Found</p>
          <p className="max-w-xs mx-auto">Try clearing search filters or disabling semantic search triggers to view standard options.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="schemes-grid-list">
          {schemes.map((scheme) => {
            const isBookmarked = user?.savedSchemes?.includes(scheme.id);
            const isComparing = compareList.some(item => item.id === scheme.id);
            return (
              <div 
                key={scheme.id} 
                className="rounded-2xl border border-slate-850 bg-slate-900/10 p-5 flex flex-col justify-between border-glow relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Category + Bookmark Controls */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-slate-900">
                      {scheme.category}
                    </span>
                    <button
                      onClick={() => handleToggleBookmark(scheme.id)}
                      className={`p-1.5 rounded-lg hover:bg-slate-950 transition ${isBookmarked ? 'text-amber-400' : 'text-slate-500'}`}
                      title="Bookmark"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-display text-sm font-bold text-white line-clamp-2 min-h-[40px]">{scheme.name}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-2 line-clamp-3 min-h-[50px]">
                      {scheme.description}
                    </p>
                  </div>

                  {/* Highlights and constraints */}
                  <div className="space-y-2 border-t border-slate-950 pt-3 text-[10px] text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      <span>State Scope: <strong className="text-slate-300 font-medium">{scheme.state}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-400 font-semibold">Benefits: {scheme.benefits}</span>
                    </div>
                  </div>
                </div>

                {/* Submitting Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-950 flex gap-2">
                  <button
                    onClick={() => setSelectedScheme(scheme)}
                    className="flex-1 rounded-xl bg-slate-950 hover:bg-slate-900 py-2.5 text-center text-xs font-semibold text-slate-300 transition border border-slate-850 flex items-center justify-center space-x-1"
                  >
                    <span>View Card</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleCompare(scheme)}
                    className={`rounded-xl px-3 py-2.5 text-xs font-semibold border transition ${
                      isComparing 
                        ? 'bg-amber-500 border-amber-500 text-slate-950' 
                        : 'border-slate-800 bg-transparent text-slate-400 hover:text-white'
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
            </button>

            <div className="space-y-6">
              <div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                  {selectedScheme.category}
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-3">{selectedScheme.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Scope Territory: {selectedScheme.state} Domicile Only</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Objective & Details</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-900">{selectedScheme.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">Qualifications Check</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedScheme.eligibilityDescription}</p>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <h4 className="text-[11px] font-bold text-emerald-500 tracking-wider uppercase mb-2">Benefits Coverage</h4>
                  <p className="text-xs text-emerald-400 font-semibold leading-relaxed">{selectedScheme.benefits}</p>
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
                  
                  {token && (
                    <button
                      onClick={() => handleApplyScheme(selectedScheme.id, selectedScheme.name)}
                      disabled={filingStatus === 'loading' || filingStatus === 'success'}
                      className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
                    >
                      {filingStatus === 'loading' ? (
                        <span>Filing...</span>
                      ) : filingStatus === 'success' ? (
                        <span>Successfully Filed!</span>
                      ) : (
                        <span>Submit Application</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
