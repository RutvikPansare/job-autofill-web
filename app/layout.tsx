import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "BoltApply – Apply to Jobs 10x Faster",
  description: "BoltApply auto-fills your job applications in seconds. Just click, fill, apply — powered by AI.",
  icons: {
    icon:  [
      { url: "/favicon.ico",  sizes: "16x16" },
      { url: "/icon48.png",   sizes: "48x48" },
      { url: "/icon128.png",  sizes: "128x128" },
    ],
    apple: "/icon128.png",
  },
  openGraph: {
    title:       "BoltApply – Apply to Jobs 10x Faster",
    description: "Auto-fill job applications in seconds across Greenhouse, Lever, Workday, and 100+ ATS platforms.",
    type:        "website",
    images:      [{ url: "/icon128.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
