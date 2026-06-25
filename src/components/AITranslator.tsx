import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Globe, Loader2, Sparkles } from 'lucide-react';

interface AITranslatorProps {
  textToTranslate: string;
  targetLanguage: string;
  fallbackText?: string;
  variant?: 'inline' | 'block';
}

export default function AITranslator({ textToTranslate, targetLanguage, fallbackText, variant = 'block' }: AITranslatorProps) {
  const { token } = useAuth();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset translation if language or original text changes
  useEffect(() => {
    setTranslatedText(null);
    setError(null);
  }, [textToTranslate, targetLanguage]);

  if (!targetLanguage || targetLanguage === 'English') {
    return <p className={variant === 'block' ? "leading-relaxed" : "inline"}>{fallbackText || textToTranslate}</p>;
  }

  const handleTranslate = async () => {
    if (!textToTranslate.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: textToTranslate,
          targetLanguage
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Translation failed");
      setTranslatedText(data.translatedText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Translation error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={variant === 'block' ? "space-y-2 mt-2" : "inline-block"}>
      {translatedText ? (
        <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 relative transition-all">
          <div className="absolute top-2 right-2 flex items-center space-x-1 bg-amber-500/20 text-amber-400 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
            <Sparkles className="h-2.5 w-2.5 animate-pulse" />
            <span>AI Translated ({targetLanguage})</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{translatedText}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {fallbackText && variant === 'block' && (
            <p className="text-xs text-slate-400 leading-relaxed">{fallbackText}</p>
          )}
          <button
            type="button"
            onClick={handleTranslate}
            disabled={loading}
            className="flex items-center space-x-1 rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-400 transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>AI Translating...</span>
              </>
            ) : (
              <>
                <Globe className="h-3 w-3" />
                <span>AI Translate to {targetLanguage} ✨</span>
              </>
            )}
          </button>
          {error && <span className="text-[10px] text-rose-500 font-medium">⚠️ {error}</span>}
        </div>
      )}
    </div>
  );
}
