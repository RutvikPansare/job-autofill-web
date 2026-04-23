const FREE_FEATURES = [
  "Smart Autofill Engine",
  "Secure Local Profile Storage",
  "Keyword Scanner",
  "Basic Resume Matching",
  "Text Shortcuts (Up to 10)",
];

const PREMIUM_FEATURES = [
  "AI Subjective Answer Generation",
  "Multiple Resumes & Profiles",
  "Unlimited Custom Shortcuts",
  "Priority Early Access Features",
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-surface-container-lowest px-6 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-container/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16 tracking-tight">
          Simple, transparent pricing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Free plan */}
          <div className="bg-surface-container/50 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/30 flex flex-col">
            <h3 className="text-2xl font-bold text-white mb-2">Free Plan</h3>
            <div className="text-4xl font-black text-white mb-6">
              $0{" "}
              <span className="text-lg text-on-surface-variant font-normal">/ forever</span>
            </div>

            <ul className="flex-col gap-4 mb-8 flex-1">
              {FREE_FEATURES.map(feat => (
                <li key={feat} className="flex items-center gap-3 text-on-surface-variant mb-3">
                  <span className="material-symbols-outlined text-green-400 text-xl">check_circle</span>
                  {feat}
                </li>
              ))}
            </ul>

            <a
              href="/profile"
              className="w-full text-center py-4 rounded-xl font-bold text-primary-fixed bg-surface-container-high border border-outline-variant/30 hover:bg-surface-container-highest transition-colors duration-300 block"
            >
              Get Started Free
            </a>
          </div>

          {/* Premium plan */}
          <div className="bg-gradient-to-br from-surface-container-highest to-surface-container relative p-8 rounded-3xl border border-primary-container/50 shadow-[0_0_40px_rgba(79,70,229,0.15)] flex flex-col">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-gradient-to-r from-primary-container to-secondary-container text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
              Coming Soon
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed-dim to-secondary-fixed-dim mb-6">
              TBD Pricing
            </div>

            <ul className="flex-col gap-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-white mb-3 font-medium">
                <span className="material-symbols-outlined text-primary-fixed-dim text-xl">add_circle</span>
                Everything in Free, plus:
              </li>
              {PREMIUM_FEATURES.map(feat => (
                <li key={feat} className="flex items-center gap-3 text-on-surface-variant mb-3">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-xl">check_circle</span>
                  {feat}
                </li>
              ))}
            </ul>

            <button className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary-container to-secondary-container hover:scale-[1.02] transition-transform duration-300 shadow-lg shadow-primary-container/25 border-t border-primary-fixed-dim/20">
              Join Waitlist
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
