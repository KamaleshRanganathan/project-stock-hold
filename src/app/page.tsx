"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-xl font-bold text-gray-900">StockHold</span>

        <a
          href="https://github.com/kamaleshRanganathan"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 flex flex-col lg:flex-row items-center gap-16">
        {/* Left Side */}
        <div className="flex-1">
          <span className="inline-block text-xs font-semibold tracking-widest text-indigo-600 uppercase mb-4">
            Allo Health — Take Home Exercise
          </span>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Inventory &<br />Reservation<br />Platform
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
            A full-stack inventory management system built for multi-warehouse
            retail. Reserve stock, prevent overselling, and manage fulfillment
            — all in real time.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gray-900 text-white px-8 py-4 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Proceed to Dashboard →
          </button>
        </div>

        {/* Right Side - Feature Cards */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
          {[
            {
              icon: "🔒",
              title: "Race-condition safe",
              desc: "Redis locking ensures exactly one reservation per unit under high concurrency.",
            },
            {
              icon: "⏱️",
              title: "Auto expiry",
              desc: "Reservations expire in 10 minutes. Stock is returned automatically.",
            },
            {
              icon: "🏭",
              title: "Multi-warehouse",
              desc: "Track stock levels independently across multiple warehouse locations.",
            },
            {
              icon: "⚡",
              title: "Real-time UI",
              desc: "Live countdown timers and instant state updates without page refresh.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-5"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1">
                {f.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="border-t border-gray-100 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-12">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-3xl font-bold text-indigo-600 shrink-0">
            KR
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest text-indigo-600 uppercase mb-2">
              Built by
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Kamalesh R
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              VIT Chennai · Applying for Full Stack Developer @ Allo Health
            </p>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
              This project demonstrates end-to-end full stack development —
              from database schema design and concurrent API logic to a clean,
              responsive frontend. Built with Next.js, Prisma, PostgreSQL,
              Redis, and TypeScript.
            </p>

            <div className="flex gap-3 mt-5">
              <a
                href="https://github.com/kamaleshRanganathan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                GitHub Profile
              </a>
              <a
                href="https://github.com/kamaleshRanganathan/project-stock-hold"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Source
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        StockHold · Built for Allo Health Take Home Exercise · 2025
      </footer>
    </div>
  );
}