import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 glass-card p-10 sm:p-12 rounded-3xl max-w-md w-full border border-outline-variant/30 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mx-auto shadow-lg shadow-primary/20">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase bg-surface-container-high/80 text-primary border border-primary/20">
            HTTP 404 • Resource Relocated
          </div>
          <h1 className="text-5xl font-black text-white font-mono tracking-tight">404</h1>
          <h2 className="text-lg font-bold text-slate-200">System Endpoint Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            The requested module, asset, or routing coordinate does not exist or requires higher administrative clearance.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link to="/dashboard">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Command Center
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <ShieldAlert className="w-3 h-3 text-slate-600" />
          <span>HRX Enterprise Mesh • Route Resolver</span>
        </div>
      </div>
    </div>
  );
};
