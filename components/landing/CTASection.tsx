export default function CTASection() {
  return (
    <section className="py-32 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-primary-container/10 to-surface-container-lowest pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
          Ready to apply smarter?
        </h2>
        <p className="text-xl text-on-surface-variant mb-10 max-w-2xl mx-auto">
          Stop wasting time copy-pasting your resume into forms. Let BoltApply handle the tedious work so
          you can focus on interview prep.
        </p>
        <a
          href="/options"
          className="inline-flex bg-gradient-to-r from-primary-container to-secondary-container text-white px-10 py-5 rounded-full font-bold text-xl hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_30px_rgba(79,70,229,0.3)] border-t border-primary-fixed-dim/20 items-center gap-3"
        >
          Get Started — It&apos;s Free
          <span className="material-symbols-outlined">rocket_launch</span>
        </a>
      </div>
    </section>
  );
}
