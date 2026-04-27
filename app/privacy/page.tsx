import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – BoltApply",
  description: "How BoltApply handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0b1326] text-slate-300 font-['Inter']">

      {/* Nav */}
      <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tighter text-white hover:text-indigo-400 transition-colors">
          BoltApply
        </Link>
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to home
        </Link>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-12">Last updated: April 26, 2026</p>

        <div className="flex flex-col gap-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Overview</h2>
            <p>
              BoltApply is a Chrome extension and web application that helps you autofill job application
              forms. We are committed to protecting your privacy. This policy explains what data we collect,
              how it is stored, and how it is used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Data We Collect</h2>
            <p className="mb-4">BoltApply collects only the data you explicitly provide:</p>
            <ul className="list-disc list-inside flex flex-col gap-2 text-slate-400">
              <li><span className="text-slate-300 font-medium">Profile data</span> — your name, email, phone, address, work experience, education, and skills that you enter on the Profile page.</li>
              <li><span className="text-slate-300 font-medium">Resume text</span> — extracted from PDFs you upload, used locally for autofill and AI answer generation.</li>
              <li><span className="text-slate-300 font-medium">Cover letters</span> — templates you write and store for reuse.</li>
              <li><span className="text-slate-300 font-medium">Job applications</span> — jobs you save or track in the Job Tracker.</li>
              <li><span className="text-slate-300 font-medium">API keys</span> — optional OpenAI or Claude API keys you provide for AI features. Stored locally only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Where Your Data Is Stored</h2>
            <p className="mb-4">
              <span className="text-white font-semibold">Your data stays on your device.</span> All profile
              information, resume text, and job tracking data is stored in Chrome&apos;s local storage
              (<code className="text-indigo-400 text-sm">chrome.storage.local</code>) on your machine.
              We do not upload your personal data to any BoltApply server.
            </p>
            <p>
              If you choose to sign in with Google and enable Google Sheets sync, your job application
              rows are written to <span className="text-white font-semibold">your own Google Sheet</span> using
              your own Google account credentials. BoltApply does not store or access your Google Sheet data
              on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Third-Party Services</h2>
            <ul className="list-disc list-inside flex flex-col gap-3 text-slate-400">
              <li>
                <span className="text-slate-300 font-medium">OpenAI / Anthropic (Claude)</span> — if you
                enable AI answer generation and provide your own API key, your resume text and job questions
                are sent directly from your browser to OpenAI or Anthropic&apos;s API. This is governed by
                their respective privacy policies. BoltApply does not proxy or store these requests.
              </li>
              <li>
                <span className="text-slate-300 font-medium">Google OAuth & Sheets</span> — if you sign in
                with Google, we receive your Google account email and an access token to write rows to your
                chosen Google Sheet. We do not store your Google access token on our servers beyond your
                browser session.
              </li>
              <li>
                <span className="text-slate-300 font-medium">Supabase</span> — used for authentication only
                (storing your login session). We do not store profile or resume data in Supabase.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Permissions Used by the Extension</h2>
            <ul className="list-disc list-inside flex flex-col gap-3 text-slate-400">
              <li><span className="text-slate-300 font-medium">storage</span> — to save your profile, resume, and settings locally on your device.</li>
              <li><span className="text-slate-300 font-medium">activeTab</span> — to read form fields on the job application page you are currently viewing, so they can be filled in.</li>
              <li><span className="text-slate-300 font-medium">scripting</span> — to inject the autofill widget into job application pages.</li>
              <li><span className="text-slate-300 font-medium">host_permissions (&lt;all_urls&gt;)</span> — job applications exist across thousands of different company domains. This permission allows BoltApply to operate on any job site without requiring you to manually allowlist each one.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Data We Do NOT Collect</h2>
            <ul className="list-disc list-inside flex flex-col gap-2 text-slate-400">
              <li>We do not track your browsing history.</li>
              <li>We do not sell your data to any third party.</li>
              <li>We do not display ads.</li>
              <li>We do not send your profile data to BoltApply servers.</li>
              <li>We do not access pages you visit unless you have opened a job application form.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Google API User Data Policy</h2>
            <p>
              BoltApply&apos;s use of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. The &quot;Last updated&quot; date at the
              top of this page will reflect any changes. Continued use of BoltApply after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>
              If you have any questions about this privacy policy, please contact us at{" "}
              <a href="mailto:rutvik.pansare@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">
                rutvik.pansare@gmail.com
              </a>.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-6 py-12 border-t border-white/5 mt-12">
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} BoltApply. All rights reserved.</p>
      </div>
    </div>
  );
}
