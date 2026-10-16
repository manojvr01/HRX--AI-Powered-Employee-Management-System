import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { Sparkles, Send, X, Bot, User, HelpCircle, ShieldCheck, Zap } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AiAssistantModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your HRX Neural Copilot. I have indexed your organization’s active employment policies (Leave Entitlements, Core Hours & Grace Periods, Remote Work, and Code of Conduct) and verified personal balances. How may I assist you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSend(questionText?: string) {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post<{ answer: string }>('/ai/assistant', {
        question: q,
        history: messages.slice(-6),
      });

      setMessages([
        ...newMessages,
        { role: 'assistant', content: res.data?.answer || 'No response generated.' },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: err?.message || 'Error communicating with AI Copilot. Please verify network or service status.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const quickPrompts = [
    'How many days of annual paid leave do we get?',
    'What are the core working hours and grace period?',
    'What is the company policy on workplace ethics?',
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest/95 border border-outline-variant/40 rounded-3xl max-w-xl w-full h-[640px] max-h-[88vh] flex flex-col shadow-2xl shadow-primary/10 overflow-hidden my-auto relative backdrop-blur-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-container-lowest/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-md shadow-primary/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">HRX Neural Copilot</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-mono font-semibold">
                  RAG Policy Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Grounded in published organization policies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-surface-container-high transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-primary/20">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-line text-xs ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/20 font-medium'
                    : 'bg-surface-container-low/90 text-slate-200 border border-outline-variant/30 shadow-sm'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-surface-container-high text-slate-200 border border-outline-variant/30 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="h-4 w-4 animate-spin text-primary" />
              </div>
              <div className="bg-surface-container-low/90 rounded-2xl px-4 py-3 border border-outline-variant/30 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                </span>
                <span className="text-[11px] text-slate-400 italic">Synthesizing verified HR policy knowledge...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-5 py-2.5 border-t border-outline-variant/20 bg-surface-container-lowest/80 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 font-mono text-[10px] uppercase">
            <Zap className="h-3 w-3 text-secondary" /> Suggestions:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="shrink-0 bg-surface-container-low hover:bg-surface-container-high text-slate-300 hover:text-white px-3 py-1 rounded-xl border border-outline-variant/20 transition-all text-xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask an HR policy, leave rule, or balance query..."
              className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-on-primary font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
