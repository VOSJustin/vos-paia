"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="mb-4 text-6xl">🌸</div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          Meet FELICIA
        </h1>
        <p className="text-xl text-slate-300 mb-2">
          Your Personal AI Assistant
        </p>
        <p className="text-slate-400 mb-8 max-w-md">
          Powered by the Veracity Operating System.
          Runs on YOUR computer. YOUR data stays YOURS.
        </p>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link
            href="/chat"
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started Free
          </Link>
          <p className="text-sm text-slate-500">
            No credit card required
          </p>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold mb-2">100% Private</h3>
            <p className="text-sm text-slate-400">Your data never leaves your computer. AI runs locally.</p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-semibold mb-2">Truly Personal</h3>
            <p className="text-sm text-slate-400">Learns from YOUR documents. Becomes YOUR assistant.</p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="text-3xl mb-3">🆓</div>
            <h3 className="font-semibold mb-2">Free Forever</h3>
            <p className="text-sm text-slate-400">No API costs. No subscriptions. Runs on Ollama.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-500 text-sm">
        Powered by The Veracity Operating System • theveracityos.ai
      </footer>
    </div>
  );
}
