export default function Home() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center min-h-screen bg-bg-base text-text-primary relative p-6">
      {/* Atmospheric glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="z-10 text-center max-w-md w-full glass-panel p-8 rounded-xl border border-border-default glow-effect flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-on-primary-container text-2xl fill">directions_car</span>
        </div>
        
        <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-2">
          Rangel &amp; Serrano CRM
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary mb-8">
          Automotive Financing Portal — Phase 0 Setup Complete
        </p>

        <div className="w-full bg-surface-container rounded-lg p-4 mb-6 border border-border-subtle text-left space-y-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
            <span className="font-body-sm text-[13px] text-text-primary">Next.js 15 App Router</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
            <span className="font-body-sm text-[13px] text-text-primary">Tailwind CSS Custom Tokens</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
            <span className="font-body-sm text-[13px] text-text-primary">Google Fonts &amp; Material Symbols</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
            <span className="font-body-sm text-[13px] text-text-primary">Supabase Config Prepared</span>
          </div>
        </div>

        <div className="w-full text-center">
          <span className="font-label-xs text-[11px] text-text-disabled uppercase tracking-widest">
            Ready for Phase 1 - Authentication
          </span>
        </div>
      </div>
    </main>
  );
}
