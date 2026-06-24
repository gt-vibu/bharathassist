import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  Loader2, 
  BadgeCheck 
} from 'lucide-react';

interface EligibilityResult {
  scheme: any;
  score: number;
  eligible: boolean;
  status: 'Highly Eligible' | 'Moderately Eligible' | 'Ineligible';
  reasons: string[];
}

export default function EligibilityCheckerPage() {
  const { token, user } = useAuth();
  const [results, setResults] = useState<EligibilityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const runEligibilityCheck = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/eligibility/check', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
      } else {
        setErrorMsg(data.error || "Eligibility checking failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to communicate with calculation service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEligibilityCheck();
  }, [token, user]);

  if (!user?.profile) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center space-y-4" id="eligibility-incomplete-state">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto animate-pulse-glow" />
        <h3 className="font-display text-base font-bold text-white">Citizen Profile Configuration Required</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          In order to compute real-time government welfare matching matrices, please configure your demographic profile details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="eligibility-loading">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
        <p className="text-xs text-slate-400">Evaluating demographic criteria limits against the welfare registry...</p>
      </div>
    );
  }

  const highlyEligible = results.filter(r => r.status === 'Highly Eligible');
  const moderatelyEligible = results.filter(r => r.status === 'Moderately Eligible');
  const ineligible = results.filter(r => r.status === 'Ineligible');

  return (
    <div className="space-y-8" id="eligibility-results-panel">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center space-x-2">
            <UserCheck className="h-5.5 w-5.5 text-amber-500" />
            <span>AI Eligibility Evaluator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Direct evaluations mapped from state domicile and household indicators</p>
        </div>
        <button
          onClick={runEligibilityCheck}
          className="mt-3 sm:mt-0 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 px-4 py-2 text-xs font-semibold text-slate-300 transition"
        >
          Re-evaluate Criteria
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-800/20 bg-red-950/10 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Citizen profile metrics summary */}
      <div className="rounded-2xl border border-slate-850 bg-slate-950/40 p-4 grid gap-4 sm:grid-cols-4 text-xs">
        <div>
          <span className="text-slate-500 font-semibold block">Domicile Territory</span>
          <span className="font-bold text-white mt-1 block">{user.profile.state}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">Annual Income</span>
          <span className="font-bold text-emerald-400 mt-1 block">₹{user.profile.annualIncome.toLocaleString('en-IN')}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">Social Category</span>
          <span className="font-bold text-white mt-1 block">{user.profile.category}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">Citizen Age</span>
          <span className="font-bold text-white mt-1 block">{user.profile.age} Years</span>
        </div>
      </div>

      {/* Evaluation Results stream */}
      <div className="space-y-6">
        
        {/* highly eligible group */}
        {highlyEligible.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <BadgeCheck className="h-4.5 w-4.5" />
              <span>Highly Eligible ({highlyEligible.length})</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {highlyEligible.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 border-glow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-display text-sm font-bold text-white max-w-[200px] truncate">{item.scheme.name}</h4>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                      Score: {item.score}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{item.scheme.category}</p>
                  
                  {/* Reasons breakdown checkmarks */}
                  <div className="mt-4 border-t border-slate-950 pt-3 space-y-1.5">
                    {item.reasons.map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* moderately eligible group */}
        {moderatelyEligible.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-900">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertCircle className="h-4.5 w-4.5" />
              <span>Moderately Eligible ({moderatelyEligible.length})</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {moderatelyEligible.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-850 bg-slate-900/10 p-5 border-glow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-display text-sm font-bold text-white max-w-[200px] truncate">{item.scheme.name}</h4>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                      Score: {item.score}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{item.scheme.category}</p>

                  <div className="mt-4 border-t border-slate-950 pt-3 space-y-1.5">
                    {item.reasons.map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ineligible group */}
        {ineligible.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-900">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
              <XCircle className="h-4.5 w-4.5" />
              <span>Ineligible ({ineligible.length})</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {ineligible.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-850 bg-slate-900/10 p-5 opacity-60">
                  <div className="flex justify-between items-start">
                    <h4 className="font-display text-sm font-bold text-slate-400 max-w-[200px] truncate">{item.scheme.name}</h4>
                    <span className="rounded bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-400">
                      Score: {item.score}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{item.scheme.category}</p>

                  <div className="mt-4 border-t border-slate-950 pt-3 space-y-1.5">
                    {item.reasons.map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-start space-x-2 text-[11px] text-red-400">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
