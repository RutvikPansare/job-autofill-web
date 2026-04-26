const LINKS_LEGAL = [
  { label: "Privacy Policy",   href: "#" },
  { label: "Terms of Service", href: "#" },
];

const LINKS_SOCIAL = [
  { label: "Twitter",  href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "GitHub",   href: "#" },
];

export default function Footer() {
  return (
    <footer className="w-full py-20 bg-[#0b1326] border-t border-indigo-500/10 font-['Inter'] text-sm tracking-wide text-indigo-500 dark:text-indigo-400">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:flex lg:justify-between items-start gap-12">

        <div className="flex flex-col">
          <span className="text-xl font-bold text-white mb-4 block">BoltApply</span>
          <p className="text-slate-500 mt-2">© {new Date().getFullYear()} BoltApply. Built on the Ethereal Conduit.</p>
        </div>

        <div className="flex flex-col gap-3">
          {LINKS_LEGAL.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-slate-500 hover:text-white transition-all duration-200 opacity-80 hover:opacity-100"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {LINKS_SOCIAL.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-slate-500 hover:text-white transition-all duration-200 opacity-80 hover:opacity-100"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
