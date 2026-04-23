const STATS = [
  { value: "10x",  label: "Faster Applying" },
  { value: "50+",  label: "Fields Detected" },
  { value: "5k+",  label: "Active Users"    },
  { value: "100%", label: "Free (for now)"  },
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-[#0f172a] border-y border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-outline-variant/10 text-center">
        {STATS.map(({ value, label }) => (
          <div key={label} className="px-4">
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed-dim to-secondary-fixed-dim mb-2">
              {value}
            </div>
            <div className="text-on-surface-variant font-medium uppercase tracking-wider text-sm">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
