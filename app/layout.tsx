import './globals.css';
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'AI Solution Finder',
  description: 'Analyse business processes with AI to evaluate compliance, business value and automation potential.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <div className="min-h-screen flex flex-col bg-gray-100">
          {/* Site header styled after the reference application. The header is
              surrounded by a thick black border and contains the logo,
              title, subtitle and placeholder icons on the right. */}
          <header className="mx-4 my-4 border-4 border-black rounded-md shadow-lg bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-gradient-to-r from-purple-600 to-purple-500 text-white border-2 border-black">
                  {/* You can replace this emoji with an actual icon component if desired */}
                  🤖
                </div>
                <div>
                  <h1 className="font-bold text-xl leading-none text-gray-900">AI Solution Finder</h1>
                  <p className="text-sm text-gray-600">Prozessoptimierung mit KI‑Analyse</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xl">
                {/* Search/history icon – links to the home page so users can
                   start a new evaluation. The reference site uses a
                   magnifying glass to represent history/search. */}
                <Link
                  href="/"
                  className="p-2 border-2 border-black rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none"
                  aria-label="Neue Analyse"
                >
                  🔍
                </Link>
                {/* User profile icon – links to the profile page showing
                   past evaluations and account details. */}
                <Link
                  href="/profile"
                  className="p-2 border-2 border-black rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none"
                  aria-label="Mein Profil"
                >
                  👤
                </Link>
                {/* Logout link. Navigates to the logout route which clears
                   the Supabase session and redirects to the login page. */}
                <Link
                  href="/logout"
                  className="p-2 border-2 border-black rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none"
                  aria-label="Abmelden"
                >
                  ↗️
                </Link>
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}