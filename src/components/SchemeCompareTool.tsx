import React from 'react';
import { Scheme } from '../types.js';
import { X, Check, ArrowRight } from 'lucide-react';

interface SchemeCompareToolProps {
  selectedSchemes: Scheme[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onApply: (id: string) => void;
}

export default function SchemeCompareTool({ selectedSchemes, onRemove, onClear, onApply }: SchemeCompareToolProps) {
  if (selectedSchemes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md" id="scheme-comparator">
      <div className="flex flex-col justify-between border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-display text-lg font-bold text-white">Scheme Comparison Matrix</h3>
          <p className="text-xs text-slate-400">Comparing details of up to 3 selected welfare options side-by-side</p>
        </div>
        <button 
          onClick={onClear} 
          className="mt-3 text-xs font-semibold text-amber-400 hover:text-amber-300 sm:mt-0"
        >
          Clear Selection
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              <th className="w-1/4 py-3 font-semibold text-slate-400">CRITERIA</th>
              {selectedSchemes.map((s) => (
                <th key={s.id} className="w-1/4 px-4 py-3 text-sm font-bold text-white relative">
                  <div className="flex items-center justify-between">
                    <span className="truncate block max-w-[150px]">{s.name}</span>
                    <button 
                      onClick={() => onRemove(s.id)}
                      className="rounded-full p-1 text-slate-500 hover:bg-slate-850 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
              {/* Fill remaining columns if less than 3 selected */}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <th key={`empty-th-${idx}`} className="w-1/4 px-4 py-3 text-slate-600 italic">
                  Select another scheme to compare...
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            <tr>
              <td className="py-4 font-semibold text-slate-400">Category</td>
              {selectedSchemes.map((s) => (
                <td key={`cat-${s.id}`} className="px-4 py-4 text-slate-200">
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-amber-400">
                    {s.category}
                  </span>
                </td>
              ))}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <td key={`empty-cat-${idx}`} className="px-4 py-4 text-slate-700">—</td>
              ))}
            </tr>
            <tr>
              <td className="py-4 font-semibold text-slate-400">Benefits & Grants</td>
              {selectedSchemes.map((s) => (
                <td key={`ben-${s.id}`} className="px-4 py-4 text-slate-200 leading-relaxed font-medium text-emerald-400">
                  {s.benefits}
                </td>
              ))}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <td key={`empty-ben-${idx}`} className="px-4 py-4 text-slate-700">—</td>
              ))}
            </tr>
            <tr>
              <td className="py-4 font-semibold text-slate-400">State Scope</td>
              {selectedSchemes.map((s) => (
                <td key={`state-${s.id}`} className="px-4 py-4 text-slate-300">
                  {s.state}
                </td>
              ))}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <td key={`empty-state-${idx}`} className="px-4 py-4 text-slate-700">—</td>
              ))}
            </tr>
            <tr>
              <td className="py-4 font-semibold text-slate-400">Description</td>
              {selectedSchemes.map((s) => (
                <td key={`desc-${s.id}`} className="px-4 py-4 text-slate-400 leading-relaxed max-w-xs truncate-lines-3">
                  {s.description}
                </td>
              ))}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <td key={`empty-desc-${idx}`} className="px-4 py-4 text-slate-700">—</td>
              ))}
            </tr>
            <tr>
              <td className="py-4 font-semibold text-slate-400">Target Eligibility</td>
              {selectedSchemes.map((s) => (
                <td key={`elig-${s.id}`} className="px-4 py-4 text-slate-300 leading-relaxed">
                  {s.eligibilityDescription}
                </td>
              ))}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <td key={`empty-elig-${idx}`} className="px-4 py-4 text-slate-700">—</td>
              ))}
            </tr>
            <tr>
              <td className="py-4 font-semibold text-slate-400">Required Documents</td>
              {selectedSchemes.map((s) => (
                <td key={`docs-${s.id}`} className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {s.documentsRequired.map((doc, dIdx) => (
                      <span key={dIdx} className="rounded bg-slate-950 px-2 py-0.5 text-[9px] text-slate-400">
                        {doc}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <td key={`empty-docs-${idx}`} className="px-4 py-4 text-slate-700">—</td>
              ))}
            </tr>
            <tr>
              <td className="py-4 font-semibold text-slate-400">Deadline</td>
              {selectedSchemes.map((s) => (
                <td key={`dead-${s.id}`} className="px-4 py-4 text-red-400 font-medium">
                  {new Date(s.deadline).toLocaleDateString()}
                </td>
              ))}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <td key={`empty-dead-${idx}`} className="px-4 py-4 text-slate-700">—</td>
              ))}
            </tr>
            <tr>
              <td className="py-4 font-semibold text-slate-400">Apply</td>
              {selectedSchemes.map((s) => (
                <td key={`apply-${s.id}`} className="px-4 py-4">
                  <button
                    onClick={() => onApply(s.id)}
                    className="flex items-center space-x-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </td>
              ))}
              {Array.from({ length: 3 - selectedSchemes.length }).map((_, idx) => (
                <td key={`empty-apply-${idx}`} className="px-4 py-4 text-slate-700">—</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
