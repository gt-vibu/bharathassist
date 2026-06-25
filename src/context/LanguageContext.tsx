import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStaticTranslation } from '../utils/translationDictionary.js';
import { useAuth } from './AuthContext.js';

interface LanguageContextProps {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bharatassist_lang') || 'English';
    }
    return 'English';
  });

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bharatassist_lang', lang);
    }
  };

  // Immediate synchronous translator for known static text
  const t = (text: string): string => {
    if (currentLanguage === 'English') return text;
    return getStaticTranslation(text, currentLanguage);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

// Stateful React Translate component for dynamic or static text
interface TranslateProps {
  children: string;
  className?: string;
  inline?: boolean;
}

export function Translate({ children, className = '', inline = false }: TranslateProps) {
  const { currentLanguage, t } = useTranslation();
  const { token } = useAuth();
  const [translated, setTranslated] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!children) return;

    // 1. If English, display original
    if (currentLanguage === 'English') {
      setTranslated(children);
      return;
    }

    // 2. Check if there is a static translation
    const staticTrans = getStaticTranslation(children, currentLanguage);
    if (staticTrans !== children) {
      setTranslated(staticTrans);
      return;
    }

    // 3. Check client-side persistent cache for dynamic translations
    const cacheKey = `tr_cache_${currentLanguage}`;
    let cache: Record<string, string> = {};
    try {
      cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
    } catch (e) {
      // ignore
    }

    if (cache[children]) {
      setTranslated(cache[children]);
      return;
    }

    // 4. If not static or cached, fetch dynamic AI translation
    let isMounted = true;
    const fetchTranslation = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            text: children,
            targetLanguage: currentLanguage
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.translatedText && isMounted) {
            // Update cache
            cache[children] = data.translatedText;
            localStorage.setItem(cacheKey, JSON.stringify(cache));
            setTranslated(data.translatedText);
          }
        } else {
          if (isMounted) setTranslated(children); // Fallback to English
        }
      } catch (err) {
        console.error("Translate component dynamic error:", err);
        if (isMounted) setTranslated(children);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTranslation();

    return () => {
      isMounted = false;
    };
  }, [children, currentLanguage, token]);

  if (inline) {
    return (
      <span className={`${className} ${loading ? 'opacity-70 animate-pulse' : ''}`}>
        {translated || children}
      </span>
    );
  }

  return (
    <span className={`${className} block ${loading ? 'opacity-70 animate-pulse' : ''}`}>
      {translated || children}
    </span>
  );
}
