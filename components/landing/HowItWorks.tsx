const STEPS = [
  {
    number: "1",
    title:  "Setup Your Profile",
    body:   "Add your details once: name, experience, skills, and upload your resume via the secure options page.",
  },
  {
    number: "2",
    title:  "Open Any Job Page",
    body:   "Navigate to any application on Greenhouse, Lever, Workday, LinkedIn, or hundreds of other ATS platforms.",
  },
  {
    number: "3",
    title:  "Click Autofill",
    body:   "Click the extension icon and hit Autofill. Watch BoltApply intelligently populate every field in seconds.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-surface px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16 tracking-tight">
          How BoltApply Works
        </h2>

        <div className="flex flex-col md:flex-row gap-12 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-gradient-to-r from-primary-container/0 via-primary-container to-secondary-container/0" />

          {STEPS.map(({ number, title, body }) => (
            <div key={number} className="flex-1 relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container border-2 border-primary-container flex items-center justify-center text-2xl font-bold text-white mb-6 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                {number}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-on-surface-variant">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
