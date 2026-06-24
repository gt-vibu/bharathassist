import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Bot, Send, User, Loader2, Globe, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function ChatBot() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Namaste! I am BharatAssist AI, your intelligent Welfare Scheme assistant. 
      
How can I help you today? I can:
- Assist in discovering relevant government programs
- Analyze your profile details to evaluate eligibility matching
- Explain document credentials required for applications

Please choose your preferred language below to begin.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prefLang, setPrefLang] = useState('English');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const languages = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input;
    setInput('');
    
    // Add user message to UI
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: userQuery,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Structure previous conversation history (excluding the welcome message)
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userQuery,
          chatHistory,
          preferredLanguage: prefLang
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat failed");

      // Add model response to UI
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        text: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error: any) {
      console.error("Chat error:", error);
      const botErr: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        role: 'model',
        text: `Sorry, I encountered an issue while communicating with the AI gateway. Error details: ${error.message || "Unknown offline error"}. Please check your connection or secrets.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botErr]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden" id="ai-chat-module">
      
      {/* Header and Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-sm">
            <Bot className="h-5 w-5 text-slate-950" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-950"></span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-display text-sm font-bold text-white">BharatAssist AI Companion</h3>
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse-glow" />
            </div>
            <p className="text-[10px] text-emerald-400 font-medium">Equipped with RAG Semantic Knowledge</p>
          </div>
        </div>

        {/* Language Selection bar */}
        <div className="flex items-center space-x-2">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={prefLang}
            onChange={(e) => setPrefLang(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 focus:outline-none focus:border-amber-500"
            id="pref-lang-select"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Stream View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20" id="chat-messages-stream">
        {messages.map((m) => {
          const isBot = m.role === 'model';
          return (
            <div 
              key={m.id} 
              className={`flex space-x-3 max-w-[85%] ${isBot ? 'mr-auto text-left' : 'ml-auto text-right flex-row-reverse space-x-reverse'}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                isBot 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-slate-800 text-slate-200 border-slate-700'
              }`}>
                {isBot ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
              </div>
              <div className="space-y-1">
                <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  isBot 
                    ? 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-sm' 
                    : 'bg-amber-500 text-slate-950 font-medium rounded-tr-sm'
                }`}>
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
                <p className="text-[9px] text-slate-500">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex space-x-3 max-w-[80%] mr-auto text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl p-4 text-xs text-slate-400 bg-slate-900 border border-slate-850 rounded-tl-sm">
              <span className="animate-pulse">AI is searching welfare database...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/40" id="chat-input-controls">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask BharatAssist in ${prefLang} (e.g. "What scholarships can I get?")`}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            id="chat-query-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 transition"
            id="chat-send-submit"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
