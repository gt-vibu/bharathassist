import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Translate } from '../context/LanguageContext.js';
import { Scheme } from '../types.js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  Award, 
  Bookmark, 
  CheckCircle, 
  Clock, 
  User, 
  ArrowRight, 
  Edit3, 
  HelpCircle,
  FileText,
  BadgeAlert,
  Loader2
} from 'lucide-react';

interface DashboardProps {
  onExplore: () => void;
  onEditProfile: () => void;
  onViewEligibility: () => void;
  currentLanguage?: string;
}

export default function Dashboard({ onExplore, onEditProfile, onViewEligibility, currentLanguage = 'English' }: DashboardProps) {
  const { user, token, applications, documents } = useAuth();
  const [eligSchemes, setEligSchemes] = useState<any[]>([]);
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user || !user.profile) return 0;
    const fields = [
      'fullName', 'age', 'gender', 'state', 'district', 'occupation', 
      'annualIncome', 'educationLevel', 'category', 'maritalStatus', 'familySize'
    ];
    const filled = fields.filter(f => (user.profile as any)[f] !== undefined && (user.profile as any)[f] !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercent = calculateProfileCompletion();

  // Load dashboard data
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!token) return;
      setLoading(true);
      try {
        // Fetch eligible matching counts
        if (user?.profile) {
          const elRes = await fetch('/api/eligibility/check', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (elRes.ok) {
            const data = await elRes.json();
            setEligSchemes(data.results.slice(0, 5)); // top 5
          }
        }

        // Fetch bookmarked schemes
        const scRes = await fetch('/api/schemes');
        if (scRes.ok) {
          const data = await scRes.json();
          const list: Scheme[] = data.schemes;
          if (user?.savedSchemes) {
            setSavedSchemes(list.filter(s => user.savedSchemes.includes(s.id)));
          }
        }
      } catch (err) {
        console.error("Dashboard data fetching failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Assembling citizen metrics scoreboard...</p>
      </div>
    );
  }

  // Recharts Chart Data representing user progress & benefits unlocked
  const chartsData = [
    { name: 'Eligibility', score: eligSchemes.length > 0 ? 88 : 0, fill: '#F59E0B' },
    { name: 'Applications', score: applications.length * 20 || 0, fill: '#3B82F6' },
    { name: 'Credentials Validated', score: documents.filter(d => d.status === 'Verified').length * 25 || 0, fill: '#10B981' }
  ];

  const submittedApps = applications.filter(a => a.status === 'Applied' || a.status === 'Pending' || a.status === 'Approved');

  return (
    <div className="space-y-8" id="citizen-dashboard">
      
      {/* Title greeting section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-white"><Translate>Welcome back</Translate>, {user?.fullName}!</h2>
          <p className="text-xs text-slate-400"><Translate>Your personalized welfare match, credential readiness, and active applications.</Translate></p>
        </div>
        <button
          onClick={onEditProfile}
          className="mt-3 sm:mt-0 flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition"
        >
          <Edit3 className="h-3.5 w-3.5 text-amber-400" />
          <span><Translate>Profile Setup</Translate></span>
        </button>
      </div>

      {/* Profile Completion Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md grid gap-6 md:grid-cols-3 items-center">
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300"><Translate>Welfare Eligibility Scanner</Translate></span>
            <span className="font-bold text-amber-400">{completionPercent}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-900">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {completionPercent === 100 
              ? <Translate>Excellent! Your credential profile is 100% complete. BharatAssist AI is actively calculating matching welfare programs with maximum precision.</Translate>
              : <Translate>Discover matching welfare options, verify required documents securely using AI OCR, and chat in native regional languages.</Translate>}
          </p>
        </div>
        
        <div className="flex justify-center border-t border-slate-800 md:border-t-0 md:border-l border-slate-800/60 pt-4 md:pt-0 pl-0 md:pl-6">
          {completionPercent < 100 ? (
            <button
              onClick={onEditProfile}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-orange-400 transition shadow-md"
            >
              <Translate>Complete setup (Unlock Matches)</Translate>
            </button>
          ) : (
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-white"><Translate>Qualifications Check</Translate></p>
              <p className="text-[10px] text-emerald-400 font-medium"><Translate>Automatic Matching Engine Active</Translate></p>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Statistics Graphs, Matched list, applications tracker */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left column: Analytics and applications list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recharts Analytics scoreboard */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Platform Utilization Metrics</h3>
            
            <div className="grid gap-4 sm:grid-cols-3 text-center mb-6">
              <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Eligibility Rating</p>
                <h4 className="text-lg font-bold text-amber-400 mt-1">{eligSchemes.length > 0 ? "88/100" : "—"}</h4>
              </div>
              <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Applications Filed</p>
                <h4 className="text-lg font-bold text-blue-400 mt-1">{applications.length} Submitted</h4>
              </div>
              <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Documents Verified</p>
                <h4 className="text-lg font-bold text-emerald-400 mt-1">{documents.filter(d => d.status === 'Verified').length} Verified</h4>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="30%" 
                  outerRadius="100%" 
                  barSize={15} 
                  data={chartsData}
                >
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                    background
                    dataKey="score"
                  />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11, color: '#fff' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Submitted Applications Track logs */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-display text-sm font-bold text-white">Active Application Tracker</h3>
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400">{submittedApps.length} File Logs</span>
            </div>

            {submittedApps.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-3">
                <Clock className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="italic">No active application logs found. Browse schemes and apply.</p>
                <button
                  onClick={onExplore}
                  className="rounded-lg bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                >
                  Explore Schemes catalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {submittedApps.map((app) => (
                  <div key={app.id} className="rounded-xl bg-slate-950 p-4 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">{app.schemeName}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-mono">
                        <span>Filing ID: {app.id}</span>
                        <span>Date: {app.appliedDate}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        app.status === 'Approved' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        ● {app.status}
                      </span>
                      <a
                        href="https://pmkisan.gov.in/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1 hover:underline"
                      >
                        <span>Portal Log</span>
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: matching suggestions, saved bookmarks */}
        <div className="space-y-6">
          
          {/* Matching eligible schemes slider */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <h3 className="font-display text-sm font-bold text-white mb-4">Top AI Scheme Matches</h3>

            {!user?.profile ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-3">
                <BadgeAlert className="h-8 w-8 text-slate-650 mx-auto" />
                <p>Profile incomplete. Enter state/income details to verify matched parameters.</p>
                <button
                  onClick={onEditProfile}
                  className="w-full py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                >
                  Configure Profile
                </button>
              </div>
            ) : eligSchemes.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No matching eligible options. Revise income filters in profile.</p>
            ) : (
              <div className="space-y-3">
                {eligSchemes.map((res, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-950 p-3.5 border border-slate-850 border-glow">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white max-w-[150px] truncate">{res.scheme.name}</h4>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                        {res.score}% Match
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{res.scheme.category}</p>
                    <div className="mt-3.5 border-t border-slate-900 pt-2 flex justify-between items-center text-[10px]">
                      <span className="text-emerald-400 font-semibold">{res.status}</span>
                      <button 
                        onClick={onViewEligibility}
                        className="text-amber-400 hover:underline flex items-center space-x-0.5"
                      >
                        <span>Check eligibility</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarked saved list */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <h3 className="font-display text-sm font-bold text-white mb-4">Saved Welfare Schemes</h3>

            {savedSchemes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <Bookmark className="h-6 w-6 text-slate-650 mx-auto mb-2" />
                <p className="italic">Bookmarks folder empty</p>
                <p className="text-[10px] text-slate-600">Save schemes from explore portal</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedSchemes.map((s) => (
                  <div key={s.id} className="rounded-xl bg-slate-950 p-3 border border-slate-850 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{s.name}</h4>
                      <span className="text-[9px] text-slate-500 font-medium">{s.category}</span>
                    </div>
                    <button
                      onClick={onExplore}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      View Card
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
