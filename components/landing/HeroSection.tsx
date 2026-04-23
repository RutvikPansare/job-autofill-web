"use client";

import Image from "next/image";
import Link from "next/link";

const AVATARS = [
  {
    src:  "https://lh3.googleusercontent.com/aida-public/AB6AXuDWgWYUn0b-QrMjDNJQEeRC_rKLzA7iS1AiJfFCDlpRWnqr22U3rz0_yAti181Qd7bIfC1-etzHiN7TGPJyfmIvmV9-4ILkdXSRZE7xH-6C8QAAjO0KygI3DE1_p0RZURU8WY8Y-mFfaWaSskq_Q0Cfk-PQvM-_yRLmz3ej2-E1ZlIn3xpeeAYzvhCpi0m3vaF9yxsuXHFlnxe_UIOWOiObYbNKqIoPZBoMf8i3Mgjo_tsHObrScAoAVyHzb7GltvlzpTh9Soh9_A",
    alt: "User avatar 1",
  },
  {
    src:  "https://lh3.googleusercontent.com/aida-public/AB6AXuAXTo8pRccK__7zaWrj9kK9vVQ_lI84Ft9tgq66GKQoUO-5LOOMaGnUWGRbBmQ0j6pLyhwKWAjn_GqCruhkYeVhH8DCUSDPax3praRUflXxMhKwWsTgNfzc6li0NKRc7NupHclvt7qjtziGwfw-uz_Z5Eo0u4JxLI-mH-LX3Rw0cDI-U4S_sQbZVRP4lYsCuMnnCU35txMVjXUGIcXu-bQi1JeMr3XrRoeqPMFnMRwf4u31vd8AJO-TzjqyvOnlFJ6FThVt6ouarQ",
    alt: "User avatar 2",
  },
  {
    src:  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOMOexwbXmjFC33rGUA6OPdZHAVTDO91g1jPJiYGMUSPjWDZaCTSE6Xx1eGm0e5hwP17LwEqpAx9pBVaNcgst_4v7QAxzxHzfuULHDMBIz-1OkLl5GpKp_oNCoFoD_0POrs52hShUQxqiVUQidS7ILbaNwpg2JfgNZa55GOnoOQdzzorasaG7wt84UDm2OQdgDru7_mctHlpty1ELqVoBrPOI0oJVdvn5txBKj4nNe8c7Bo2-5HrjmdtcsVqOZZdoa3uc0N-rvZg",
    alt: "User avatar 3",
  },
];

export default function HeroSection() {
  return (
    <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6 overflow-hidden">

      {/* Decorative glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-container/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-container/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

        {/* Left column */}
        <div className="flex flex-col gap-8 text-left">
          <h1 className="font-headline text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] text-white">
            Apply to Jobs <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-secondary-container">
              10x Faster
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-on-surface-variant font-body leading-relaxed max-w-xl">
            JobFill auto-fills your job applications in seconds. Just click, fill, apply — powered by AI.
            Experience the Ethereal Conduit.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/profile"
              className="bg-gradient-to-r from-primary-container to-secondary-container text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-[1.02] transition-transform duration-300 shadow-xl shadow-primary-container/25 border-t border-primary-fixed-dim/20 flex justify-center items-center gap-2"
            >
              Get Started Free
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-full font-bold text-primary-fixed bg-transparent border border-outline-variant/30 hover:bg-surface-container-highest/40 transition-colors duration-300 flex justify-center items-center gap-2"
            >
              See How It Works
            </a>
          </div>

          {/* Social proof avatars */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex -space-x-3">
              {AVATARS.map(({ src, alt }) => (
                <div
                  key={alt}
                  className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-surface flex items-center justify-center overflow-hidden"
                >
                  <Image src={src} alt={alt} width={40} height={40} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm text-on-surface-variant font-medium">
              Join 5,000+ job seekers saving hours every week.
            </p>
          </div>
        </div>

        {/* Right column – glassmorphism browser mockup */}
        <div className="relative w-full aspect-square max-w-lg mx-auto">
          <div className="absolute inset-0 bg-surface-container-highest/30 backdrop-blur-2xl rounded-2xl border border-outline-variant/15 shadow-[0_24px_48px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden border-t-primary-fixed-dim/10">

            {/* Fake browser chrome */}
            <div className="h-12 bg-surface-container-lowest/50 border-b border-outline-variant/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-outline-variant/50" />
              <div className="w-3 h-3 rounded-full bg-outline-variant/50" />
              <div className="w-3 h-3 rounded-full bg-outline-variant/50" />
              <div className="flex-1 ml-4 bg-surface-container/50 h-6 rounded-md flex items-center px-3">
                <span className="text-[10px] text-on-surface-variant/50 font-mono">https://careers.company.com</span>
              </div>
            </div>

            {/* Mockup content */}
            <div className="flex-1 p-6 flex flex-col gap-4 relative">
              <div className="w-1/3 h-6 bg-surface-container-low rounded" />
              <div className="w-2/3 h-4 bg-surface-container-low/50 rounded" />

              <div className="mt-4 flex flex-col gap-3">
                {[
                  { label: "First Name", value: "Alex" },
                  { label: "Last Name",  value: "Smith" },
                  { label: "Email",      value: "alex@example.com" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="w-full h-10 bg-surface-container-low rounded border border-outline-variant/10 flex items-center px-3 justify-between"
                  >
                    <span className="text-xs text-on-surface-variant">{label}</span>
                    <span className="text-xs text-secondary-fixed-dim font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Floating fill bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] bg-surface-container-highest/80 backdrop-blur-md p-3 rounded-xl border border-outline-variant/20 shadow-2xl flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed-dim">auto_awesome</span>
                <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-secondary rounded-full shadow-[0_0_10px_rgba(210,187,255,0.5)] animate-pulse" />
                </div>
                <span className="text-[10px] text-secondary font-bold tracking-widest uppercase">Filling…</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
