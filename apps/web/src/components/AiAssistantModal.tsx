import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { Sparkles, Send, X, Bot, User, HelpCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AiAssistantModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am HRX AI Assistant. I can answer questions about published company policies (Leave, Attendance, Working Hours, Code of Conduct) and your authorized personal balances. How may I assist you today?',
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
          content: err?.message || 'Error communicating with AI Assistant. Please try again.',
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full h-[620px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                HRX AI Assistant
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  Policy Expert
                </span>
              </h3>
              <p className="text-xs text-slate-400">Strictly answers from company policies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="h-7 w-7 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/60'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="h-7 w-7 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs italic">
              <Bot className="h-4 w-4 text-indigo-400 animate-spin" />
              Checking company policies...
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 flex items-center gap-1 shrink-0">
            <HelpCircle className="h-3 w-3" /> Prompts:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900">
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
              placeholder="Ask an HR policy or balance question..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20"
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
