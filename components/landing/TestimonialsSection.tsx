interface Testimonial {
  quote:  string;
  name:   string;
  role:   string;
  initials: string;
  avatarClass: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "This extension is literal magic. It accurately fills out Workday forms which used to take me 10 minutes per application. I've applied to 3x more jobs this week.",
    name:  "Jordan D.",
    role:  "Software Engineer",
    initials: "JD",
    avatarClass: "bg-primary-container/20 text-primary-fixed-dim",
  },
  {
    quote: "The AI answer generation feature in the beta is incredible. It actually read my resume and the job description and wrote a better cover letter snippet than I could.",
    name:  "Sarah T.",
    role:  "Product Manager",
    initials: "ST",
    avatarClass: "bg-secondary-container/20 text-secondary-fixed-dim",
  },
  {
    quote: "I love that all my data stays local on my machine. I was hesitant to use other autofillers because they require accounts, but JobFill respects privacy.",
    name:  "Michael K.",
    role:  "Data Scientist",
    initials: "MK",
    avatarClass: "bg-primary-container/20 text-primary-fixed-dim",
  },
];

function StarRow() {
  return (
    <div className="flex text-yellow-500 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="material-symbols-outlined">star</span>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-surface px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16 tracking-tight">
          Loved by job seekers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map(({ quote, name, role, initials, avatarClass }) => (
            <div key={name} className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10">
              <StarRow />
              <p className="text-on-surface-variant text-lg mb-6 leading-relaxed">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${avatarClass}`}>
                  {initials}
                </div>
                <div>
                  <div className="text-white font-medium">{name}</div>
                  <div className="text-sm text-on-surface-variant">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
