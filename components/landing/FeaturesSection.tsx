const FEATURES = [
  {
    icon:  "bolt",
    title: "Smart Autofill",
    body:  "Fill 50+ form fields in one click across all major job boards including Greenhouse, Lever, and Workday.",
  },
  {
    icon:  "smart_toy",
    title: "AI Answers",
    body:  "AI-powered answers to tough application questions, automatically tailored to your unique profile and experience.",
  },
  {
    icon:  "description",
    title: "Resume Matching",
    body:  "Upload your resume and get instant keyword match scores against any job description to ensure you pass the ATS.",
  },
  {
    icon:  "radar",
    title: "Keyword Scanner",
    body:  "Scan job descriptions directly on the page to see exactly which critical skills you match and which you're missing.",
  },
  {
    icon:  "keyboard",
    title: "Text Shortcuts",
    body:  "Create custom snippets for your most repeated phrases and links. Just type your shortcut and hit space to expand.",
  },
  {
    icon:  "lock",
    title: "100% Private",
    body:  "Your data never leaves your device. Everything is stored locally in your browser. Zero servers, zero tracking.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-surface-container-low px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16 tracking-tight">
          Everything you need to land your dream job
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map(({ icon, title, body }) => (
            <div
              key={title}
              className="bg-surface-container-high/40 backdrop-blur-xl p-8 rounded-2xl border border-outline-variant/20 hover:bg-surface-container-highest/60 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary-fixed-dim">{icon}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
