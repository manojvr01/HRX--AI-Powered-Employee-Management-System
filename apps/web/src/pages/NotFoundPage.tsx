import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-panel p-8 rounded-3xl max-w-md w-full space-y-4">
        <h1 className="text-6xl font-extrabold text-indigo-400 font-mono">404</h1>
        <h2 className="text-xl font-bold text-white">Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested page or route does not exist or has been relocated.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
