import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizX | Instant AI Quiz Platform",
  description: "Create user-friendly interactive quizzes from ChatGPT pastes, share links with students, set durations, and download grades.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <header className="header">
            <div className="header-content">
              <a href="/admin" className="logo">
                Quiz<span>X</span>
              </a>
              <nav className="flex-center gap-2">
                <a href="/admin" className="btn btn-outline btn-sm">Admin Panel</a>
              </nav>
            </div>
          </header>
          <main className="main-content">
            {children}
          </main>
          <footer className="footer">
            <p>&copy; {new Date().getFullYear()} QuizX. Powered by AI and Antigravity.</p>
          </footer>
        </div>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      </body>
    </html>
  );
}
