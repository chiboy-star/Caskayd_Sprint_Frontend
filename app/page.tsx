import Link from "next/link";
import { Inter } from "next/font/google";
import LandingNavigationPill from "@/components/LandingNavigationPill"; 

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    // h-screen + overflow-hidden prevents scrolling. flex-col organizes vertical spacing.
    <div className={`h-screen w-full flex flex-col relative overflow-hidden bg-[#F8F9FA] ${inter.className}`}>
      
      {/* --- BACKGROUND GRADIENT MESH --- */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        {/* Top Right Purple Glow */}
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-purple-200/40 rounded-full blur-[80px] animate-pulse"></div>
        {/* Bottom Left Green Glow */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-emerald-100/60 rounded-full blur-[100px]"></div>
      </div>

      {/* --- NAVIGATION --- */}
      <LandingNavigationPill />

      {/* --- MAIN CONTENT (Centered) --- */}
      {/* pt-20 accounts for the header. flex-1 + justify-center centers it vertically. */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 w-full pt-20">
        
        {/* White Glassmorphism Card */}
        {/* Max-height helps prevent it from getting too tall on large screens */}
        <div className="w-full max-w-4xl bg-white/40 backdrop-blur-lg border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-8 md:p-14 text-center mx-auto transition-transform duration-700 flex flex-col items-center justify-center gap-6">
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-3xl">
            Connect Brands With Top <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
                Content Creators
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Scale your ROI with data-driven creator partnerships. Our platform
            helps you find, manage, and track high-performing content at scale.
          </p>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link 
              href="/business/signup"
              className="min-w-[200px] px-8 py-3.5 bg-[#6366F1] text-white font-bold text-base md:text-lg rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1"
            >
              Hire a Creator
            </Link>
            
            <Link 
              href="/creator/signup"
              className="min-w-[200px] px-8 py-3.5 bg-[#10B981] text-white font-bold text-base md:text-lg rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:shadow-emerald-300 transition-all transform hover:-translate-y-1"
            >
              Join as a Creator
            </Link>
          </div>

        </div>
      </main>

      {/* --- FOOTER --- */}
      {/* pb-6 ensures it sits nicely at the bottom */}
      <footer className="w-full py-6 text-center text-xs sm:text-sm font-medium text-slate-400 relative z-10 shrink-0">
        <p>© 2026 Caskayd Enterprises. All rights reserved.</p>
      </footer>

    </div>
  );
}