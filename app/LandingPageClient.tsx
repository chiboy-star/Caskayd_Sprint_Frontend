"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
    ChevronDownIcon, 
    ArrowTrendingUpIcon,
    WalletIcon
} from "@heroicons/react/24/outline";

// --- Scroll Reveal Animation Wrapper ---
const ScrollReveal = ({ children }: { children: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target); 
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" } 
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out transform ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
        >
            {children}
        </div>
    );
};

// --- Smooth Switch Animation Wrapper for Toggles ---
const SmoothSwitch = ({ activeKey, children }: { activeKey: string, children: React.ReactNode }) => {
    const [currentChild, setCurrentChild] = useState(children);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        setIsTransitioning(true);
        const timeout = setTimeout(() => {
            setCurrentChild(children);
            setIsTransitioning(false);
        }, 200); // 200ms halfway point for the swap

        return () => clearTimeout(timeout);
    }, [activeKey, children]);

    return (
        <div className={`w-full transition-all duration-300 ease-in-out transform ${isTransitioning ? "opacity-0 scale-[0.98] translate-y-2" : "opacity-100 scale-100 translate-y-0"}`}>
            {currentChild}
        </div>
    );
};

export default function LandingPageClient() {
    // State for interactive toggles
    const [mainRole, setMainRole] = useState<"brands" | "creators">("creators");
    const [faqRole, setFaqRole] = useState<"brands" | "creators">("brands");
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    
    // State specifically for the 3-column feature section
    const [focusRole, setFocusRole] = useState<"brands" | "creators">("creators");

    // Replaced string arrays with actual Q&A objects from your document
    const brandFaqs = [
        {
            question: "How do we know which creators are right for our brand?",
            answer: "Caskayd provides deep-dive analytics that go beyond vanity metrics. You can filter creators by audience demographic and engagement rates to ensure their 'vibe' and 'data' both match your marketing goals."
        },
        {
            question: "How does Caskayd simplify the campaign management process?",
            answer: "We eliminate 'tab-fatigue.' From discovery and outreach to contract signing and content approval, the entire workflow lives inside one dashboard. This reduces the time spent on manual coordination by up to 60%."
        },
        {
            question: "Is there a subscription fee to use Caskayd?",
            answer: "No, there are no upfront subscription costs or 'paywalls' to join Caskayd. We operate on a success-based model: it’s free to sign up and browse creators. We only collect a 10% service fee on the final campaign amount once a deal is struck, ensuring our interests are perfectly aligned with your success."
        },
        {
            question: "What happens if a creator doesn't deliver the content?",
            answer: "Caskayd acts as a neutral third party. We hold the campaign funds securely and only release them once the agreed-upon content is uploaded and approved by the business. If there’s an issue, our support team steps in to mediate."
        }
    ];

    const creatorFaqs = [
        {
            question: "How does Caskayd help me get more brand deals?",
            answer: "Caskayd acts as a curated bridge between your content and the brands that need it. Instead of sending 'cold' DMs, our platform showcases your audience metrics and creative style to businesses actively looking for your specific niche, making you more discoverable to the right partners."
        },
        {
            question: "Do I need a massive following to join Caskayd?",
            answer: "Not at all. We believe in the power of engagement over follower count. Whether you are a nano-creator with a hyper-niche community or a macro-influencer, Caskayd values your unique voice and the quality of your connection with your audience."
        },
        {
            question: "How are payments handled? Is it secure?",
            answer: "Yes. Caskayd provides a secure payment infrastructure. Once a project is agreed upon, funds are often held in a secure milestone-based system, ensuring you get paid on time for the work you deliver without the hassle of chasing invoices."
        },
        {
            question: "Does Caskayd take a cut from my earnings?",
            answer: "No. Our service fee is charged to the business, not the creator. You receive the full amount you negotiate for your work (minus any standard bank or third-party processing fees if applicable). We believe creators should keep what they earn."
        },
        {
            question: "Can I choose which brands I work with?",
            answer: "Absolutely. You have full creative autonomy."
        }
    ];

    // SEO: Dynamic generation of FAQ Schema Markup based on the active role tab
    const activeFaqs = faqRole === "brands" ? brandFaqs : creatorFaqs;
    
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "name": "caskayd",
                "url": "https://www.caskayd.com",
                "logo": "https://www.caskayd.com/images/LandingLogo.webp",
                "description": "The all-in-one platform connecting brands with top content creators."
            },
            {
                "@type": "FAQPage",
                "mainEntity": activeFaqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.answer
                    }
                }))
            }
        ]
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] relative overflow-hidden font-sans text-gray-900">
            {/* Inject Structured Data into the DOM */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Ambient Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-200/30 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[10%] w-[60%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full"></div>
            </div>

            {/* HEADER */}
            <header className="fixed w-full top-0 z-50 backdrop-blur-md bg-white/95 border-b border-gray-100/50 shadow-sm transition-all">
                <div className="max-w-[90rem] mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/">
                        <Image 
                            src="/images/LandingLogo.webp" 
                            alt="Caskayd Logo" 
                            width={160} 
                            height={40} 
                            className="object-contain"
                            priority
                        />
                    </Link>
                    <div className="flex items-center gap-10">
                        <Link 
                            href="/business/login" 
                            className="font-bold text-lg bg-gradient-to-b from-[#7D7FF3] to-[#212250] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                        >
                            Business    
                        </Link>
                        <Link 
                            href="/creator/login" 
                            className="font-bold text-lg bg-gradient-to-b from-[#37C496] to-[#053D2B] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                        >
                            Creator
                        </Link>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-[90rem] mx-auto px-6 relative z-10 pt-24">
                
                {/* 1. HERO SECTION */}
                <ScrollReveal>
                    <section className="pt-12 pb-12 md:pt-16 md:pb-16 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="flex-1 max-w-2xl">
                            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                                Connect Brands With Top <br />
                                <span className="text-[#5B4DFF]">Content Creators</span>
                            </h1>
                            <p className="text-lg text-gray-600 mb-8 max-w-lg">
                                Build and scale your influencer marketing campaigns with the all-in-one platform for discovery, relationship management, and secure payouts.
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <Link 
                                    href="/business/signup" 
                                    className="flex items-center gap-2 bg-gradient-to-b from-[#7D7FF3] to-[#212250] hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-full transition-all shadow-xl shadow-[#212250]/30"
                                >
                                    <ArrowTrendingUpIcon className="w-5 h-5 stroke-2" />
                                    Boost your ROI
                                </Link>
                                <Link 
                                    href="/creator/signup" 
                                    className="flex items-center gap-2 bg-gradient-to-b from-[#37C496] to-[#053D2B] hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-full transition-all shadow-xl shadow-[#053D2B]/30"
                                >
                                    <WalletIcon className="w-5 h-5 stroke-2" />
                                    Monetize your Audience
                                </Link>
                            </div>
                        </div>
                        
                        <div className="hidden lg:flex flex-1 justify-center lg:justify-end gap-4 relative h-[450px] w-full max-w-md">
                            <div className="w-24 h-64 rounded-full absolute left-0 bottom-10 overflow-hidden shadow-2xl border-[6px] border-[#F8F9FA] bg-indigo-100"></div>
                            <div className="w-32 h-80 rounded-full absolute left-28 top-0 overflow-hidden shadow-2xl border-[6px] border-[#F8F9FA] bg-purple-200"></div>
                            <div className="w-24 h-48 rounded-full absolute right-10 top-20 overflow-hidden shadow-2xl border-[6px] border-[#F8F9FA] bg-emerald-100"></div>
                        </div>
                    </section>
                </ScrollReveal>

                {/* 2. MAIN TOGGLE SECTION */}
                <ScrollReveal>
                    <section className="py-12 md:py-16 flex flex-col items-center">
                        <div className="bg-white p-1 rounded-full border border-gray-200 inline-flex mb-10 shadow-sm">
                            <button 
                                onClick={() => setMainRole("brands")}
                                className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${mainRole === "brands" ? "bg-gradient-to-b from-[#7D7FF3] to-[#212250] text-white shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                For Brands
                            </button>
                            <button 
                                onClick={() => setMainRole("creators")}
                                className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${mainRole === "creators" ? "bg-gradient-to-b from-[#37C496] to-[#053D2B] text-white shadow-md shadow-emerald-200" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                For Creators
                            </button>
                        </div>

                        <h2 className="text-3xl font-bold mb-12 text-center">
                            {mainRole === "creators" ? "Your Creativity. Your Terms." : "Stop Guessing. Start Scaling with Data."}
                        </h2>

                        <SmoothSwitch activeKey={mainRole}>
                            {mainRole === "creators" ? (
                                <div className="w-full flex flex-col items-center">
                                    <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl gap-8 md:gap-12 mb-12 md:mb-16">
                                        <div className="flex-1 max-w-sm">
                                            <h3 className="text-xl font-bold mb-4">Guaranteed, On-Time Payouts.</h3>
                                            <p className="text-gray-600">Your creative work is valuable. Say goodbye to chasing invoices and ghosting clients. When you deliver, you get paid. Period.</p>
                                        </div>
                                        <div className="flex-1 w-full relative aspect-video bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                            <Image src="/images/LandingImage1.webp" alt="Payouts Mockup" fill className="object-cover" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row-reverse items-center justify-between w-full max-w-5xl gap-8 md:gap-12 mb-12 md:mb-16">
                                        <div className="flex-1 max-w-sm">
                                            <h3 className="text-xl font-bold mb-4">Crystal Clear Expectations.</h3>
                                            <p className="text-gray-600">No more scope creep or confusing feedback. Every deliverable is tied to an actionable brief and milestone so you always know your tasks.</p>
                                        </div>
                                        <div className="flex-1 w-full relative aspect-video bg-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                            <Image src="/images/LandingImage1.webp" alt="Briefing UI Mockup" fill className="object-cover" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl gap-8 md:gap-12">
                                        <div className="flex-1 max-w-sm">
                                            <h3 className="text-xl font-bold mb-4">Professional Independence.</h3>
                                            <p className="text-gray-600">Treat your content like a business. Connect with premium brands that respect your niche and value your specific audience.</p>
                                        </div>
                                        <div className="flex-1 w-full relative aspect-video bg-indigo-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                            <Image src="/images/Creator-Sub.webp" alt="Creator Collaboration Mockup" fill className="object-cover" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full flex flex-col items-center">
                                    <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl gap-8 md:gap-12 mb-12 md:mb-16">
                                        <div className="flex-1 max-w-sm">
                                            <h3 className="text-xl font-bold mb-4">Predictable ROI, Not Vanity Metrics.</h3>
                                            <p className="text-gray-600">Stop paying for empty likes. Make data-backed hiring decisions that align with your actual revenue goals and target demographics.</p>
                                        </div>
                                        <div className="flex-1 w-full relative aspect-video bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                            <Image src="/images/LandingCardCreator4.webp" alt="Predictable ROI" fill className="object-cover" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row-reverse items-center justify-between w-full max-w-5xl gap-8 md:gap-12 mb-12 md:mb-16">
                                        <div className="flex-1 max-w-sm">
                                            <h3 className="text-xl font-bold mb-4">Accelerated Campaign Velocity.</h3>
                                            <p className="text-gray-600">Launch faster. By centralizing your communication and deliverables, you eliminate the friction of scattered emails and disjointed feedback loops.</p>
                                        </div>
                                        <div className="flex-1 w-full relative aspect-video bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                            <Image src="/images/LandingCardCreator5.webp" alt="Accelerated Campaign Velocity" fill className="object-cover" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl gap-8 md:gap-12">
                                        <div className="flex-1 max-w-sm">
                                            <h3 className="text-xl font-bold mb-4">Absolute Financial Security.</h3>
                                            <p className="text-gray-600">Never pay for undelivered work again. Your budget is protected from the moment you initiate a partnership to the final asset approval.</p>
                                        </div>
                                        <div className="flex-1 w-full relative aspect-video bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                            <Image src="/images/LandingCardCreator6.webp" alt="Absolute Financial Security" fill className="object-cover" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </SmoothSwitch>
                    </section>
                </ScrollReveal>

                {/* 3. THREE COLUMN SECTION */}
                <ScrollReveal>
                    <section className="py-12 md:py-16 text-center w-full max-w-6xl mx-auto">
                        <div className="flex justify-center items-center gap-4 md:gap-8 mb-8">
                            <button 
                                onClick={() => setFocusRole("brands")}
                                className={`font-semibold transition-all px-6 py-2.5 rounded-full ${focusRole === "brands" ? "flex items-center gap-2 bg-gradient-to-b from-[#7D7FF3] to-[#212250] hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-full transition-all shadow-xl shadow-[#212250]/30" : "text-[#5B4DFF] hover:opacity-80"}`}
                            >
                                For Brands
                            </button>
                            <button 
                                onClick={() => setFocusRole("creators")}
                                className={`font-semibold transition-all px-6 py-2.5 rounded-full ${focusRole === "creators" ? "flex items-center gap-2 bg-gradient-to-b from-[#37C496] to-[#053D2B] hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-full transition-all shadow-xl shadow-[#053D2B]/30" : "text-[#00D68F] hover:opacity-80"}`}
                            >
                                For Creators
                            </button>
                        </div>

                        <SmoothSwitch activeKey={focusRole}>
                            <h2 className="text-3xl font-bold mb-10 md:mb-12">
                                {focusRole === "creators" 
                                    ? "Focus on portfolio building, receiving work, and getting paid." 
                                    : "Focus on discovery, initiation, and security."}
                            </h2>
                            
                            {focusRole === "creators" ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-left">
                                    <div className="flex flex-col">
                                        <div className="h-32 w-full md:max-w-full lg:max-w-[280px] relative rounded-[3rem] shadow-lg flex items-center justify-center mb-8 overflow-hidden mx-auto bg-white">
                                            <Image src="/images/LandingCardCreator1.webp" alt="Sync Analytics" fill className="object-contain" />
                                        </div>
                                        <h3 className="font-bold text-xl mb-3 flex items-baseline gap-2">
                                            <span className="text-gray-300 font-light text-2xl">1</span> Sync Your Analytics.
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Build your portfolio instantly. Connect your Instagram and TikTok profiles to automatically pull your engagement stats, proving your value to premium brands.
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="h-32 w-32 relative rounded-[2rem] shadow-lg flex items-center justify-center mb-8 overflow-hidden mx-auto bg-white">
                                            <Image src="/images/LandingCardCreator2.webp" alt="Review Brand Offers" fill className="object-contain" />
                                        </div>
                                        <h3 className="font-bold text-xl mb-3 flex items-baseline gap-2">
                                            <span className="text-gray-300 font-light text-2xl">2</span> Review Brand Offers.
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Skip the cold outreach. Receive direct messages and clear, structured campaign briefs right in your dashboard from brands looking for your specific audience.
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="h-32 w-full md:max-w-full lg:max-w-[280px] relative rounded-[3rem] shadow-lg flex items-center justify-center mb-8 overflow-hidden mx-auto bg-white">
                                            <Image src="/images/LandingCardCreator3.webp" alt="Deliver & Withdraw" fill className="object-contain" />
                                        </div>
                                        <h3 className="font-bold text-xl mb-3 flex items-baseline gap-2">
                                            <span className="text-gray-300 font-light text-2xl">3</span> Deliver & Withdraw.
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Submit your approved content and watch your Wallet tab update. Track your Escrow balance and withdraw your guaranteed funds directly to your bank account with one click.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-left">
                                    <div className="flex flex-col">
                                        <div className="h-32 w-full md:max-w-full lg:max-w-[280px] relative mb-8 mx-auto flex items-center justify-center">
                                            <div className="absolute left-4 bottom-2 w-36 h-21 rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-10">
                                                <Image src="/images/LandingCardBusiness1.webp" alt="Brand Identity 1" fill className="object-cover" />
                                            </div>
                                            <div className="absolute right-8 top-0 w-24 h-27 rounded-full shadow-lg border border-gray-100 overflow-hidden z-0">
                                                <Image src="/images/LandingCardBusiness2.webp" alt="Brand Identity 2" fill className="object-cover" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-xl mb-3 flex items-baseline gap-2">
                                            <span className="text-gray-300 font-light text-2xl">1</span> Define Your Identity.
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Create your brand profile in seconds. Upload your logo, define your industry, and set the stage for top-tier creators to understand your mission.
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="h-32 w-32 relative rounded-[2rem] shadow-lg flex items-center justify-center mb-8 overflow-hidden mx-auto ">
                                            <Image src="/images/Brand-sub.webp" alt="Discover Data" fill className="object-contain" />
                                        </div>
                                        <h3 className="font-bold text-xl mb-3 flex items-baseline gap-2">
                                            <span className="text-gray-300 font-light text-2xl">2</span> Discover & Filter Data.
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Access the Explore feed. Filter verified creators by niche, budget, and real-time performance metrics across TikTok and Instagram to find your exact match.
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="h-32 w-full md:max-w-full lg:max-w-[280px] relative rounded-[3rem] shadow-lg flex items-center justify-center mb-8 overflow-hidden mx-auto ">
                                            <Image src="/images/LandingCardBusiness4.webp" alt="Fund Securely" fill className="object-contain" />
                                        </div>
                                        <h3 className="font-bold text-xl mb-3 flex items-baseline gap-2">
                                            <span className="text-gray-300 font-light text-2xl">3</span> Connect & Fund Securely.
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Initiate a direct chat, share your campaign brief, and fund the project via Escrow. Your money is locked and safe until the final asset is approved.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </SmoothSwitch>
                    </section>
                </ScrollReveal>

                {/* 4. BRAND FEATURES SECTION */}
                <ScrollReveal>
                    <section className="py-12 md:py-16">
                        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mx-auto gap-8 md:gap-12 mb-12 md:mb-16">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold mb-6">Stop Guessing, Start Scaling with Data.</h2>
                                <p className="text-gray-600 mb-6">Don&apos;t rely on follower counts. Discover vetted creators across TikTok and Instagram using real metrics that actually impact your bottom line.</p>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Filter search by audience demographics and average views.</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Easily calculate engagement rates before you send an offer.</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Compare multiple creators side-by-side to find the perfect fit.</li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative bg-indigo-50/50 rounded-2xl shadow-xl aspect-[4/3] overflow-hidden">
                                <Image src="/images/LandingImage3.webp" alt="Dashboard Data" fill className="object-contain" />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row-reverse items-center justify-between w-full max-w-5xl mx-auto gap-8 md:gap-12 mb-12 md:mb-16">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold mb-6">Context Meets Collaboration.</h2>
                                <p className="text-gray-600 mb-6">Say goodbye to scattered email chains. Manage your entire partnership in one seamless workspace where the brief is always front and center.</p>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Real-time, direct messaging built right into the platform.</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Persistent sidebars hold all milestone details so you never lose track.</li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative rounded-2xl shadow-xl aspect-[4/3] overflow-hidden">
                                <Image src="/images/LandingImage4.webp" alt="Messaging UI" fill className="object-contain" />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mx-auto gap-8 md:gap-12">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold mb-6">Bulletproof Payments. Zero Anxiety.</h2>
                                <p className="text-gray-600 mb-6">We handle the complete scope of work. Our secure escrow infrastructure protects both parties, from the first pitch to the final payout.</p>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Custom milestone payments to match any project size.</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Funds are held in escrow so creators know they will get paid.</li>
                                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Dispute resolution system for complete peace of mind.</li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative rounded-2xl shadow-xl aspect-[4/3] overflow-hidden p-6">
                                <Image src="/images/LandingImage5.webp" alt="Escrow Graphic" fill className="object-contain" />
                            </div>
                        </div>
                    </section>
                </ScrollReveal>

                {/* 5. FAQ SECTION */}
                <ScrollReveal>
                    <section className="py-12 md:py-16 border-t border-gray-200/60 max-w-4xl mx-auto w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
                            
                            <div className="bg-gray-100 p-1 rounded-full inline-flex self-start">
                                <button 
                                    onClick={() => setFaqRole("brands")}
                                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${faqRole === "brands" ? "bg-gradient-to-b from-[#7D7FF3] to-[#212250] text-white shadow-sm" : "text-gray-500"}`}
                                >
                                    For Brands
                                </button>
                                <button 
                                    onClick={() => setFaqRole("creators")}
                                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${faqRole === "creators" ? "bg-gradient-to-b from-[#37C496] to-[#053D2B] text-white shadow-sm" : "text-gray-500"}`}
                                >
                                    For Creators
                                </button>
                            </div>
                        </div>

                        <SmoothSwitch activeKey={faqRole}>
                            <div className="space-y-4 w-full">
                                {/* Map over the new object arrays to display actual answers */}
                                {(faqRole === "brands" ? brandFaqs : creatorFaqs).map((faq, index) => (
                                    <div key={index} className="border-b border-gray-200 pb-4">
                                        <button 
                                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                            className="w-full flex justify-between items-center py-2 text-left font-semibold text-gray-900 hover:text-[#5B4DFF] transition-colors cursor-pointer"
                                        >
                                            {faq.question}
                                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${openFaq === index ? "rotate-180 text-[#5B4DFF]" : "text-gray-400"}`} />
                                        </button>
                                        {openFaq === index && (
                                            <p className="text-sm text-gray-600 mt-2 mb-4 pr-8 animate-in fade-in duration-300">
                                                {faq.answer}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </SmoothSwitch>
                    </section>
                </ScrollReveal>

                {/* 6. BOTTOM CTA SECTION */}
                <ScrollReveal>
                    <section className="py-12 md:py-16 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex-1">
                            <h2 className="text-4xl font-extrabold mb-4">The New Standard for Creative Partnerships.</h2>
                            <p className="text-gray-600 mb-8 max-w-md">Join thousands of brands and creators utilizing streamlined workflows, secure escrow, and real-time analytics. Choose your path below.</p>
                            <div className="flex flex-wrap items-center gap-4">
                                <Link 
                                    href="/business/signup" 
                                    className="flex items-center gap-2 bg-gradient-to-b from-[#7D7FF3] to-[#212250] hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-full transition-all shadow-xl shadow-[#212250]/30"
                                >
                                    <ArrowTrendingUpIcon className="w-5 h-5 stroke-2" />
                                    Boost your ROI
                                </Link>
                                <Link 
                                    href="/creator/signup" 
                                    className="flex items-center gap-2 bg-gradient-to-b from-[#37C496] to-[#053D2B] hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-full transition-all shadow-xl shadow-[#053D2B]/30"
                                >
                                    <WalletIcon className="w-5 h-5 stroke-2" />
                                    Monetize your Audience
                                </Link>
                            </div>
                        </div>
                        <div className="flex-shrink-0 hidden md:block">
                            <div className="w-64 h-64 relative flex items-center justify-center">
                                <Image 
                                    src="/images/LandingPageLogo.webp" 
                                    alt="Caskayd Emblem" 
                                    fill 
                                    className="object-contain" 
                                />
                            </div>
                        </div>
                    </section>
                </ScrollReveal>
            </main>

            {/* 7. FOOTER */}
            <footer className="border-t border-gray-200/60 mt-8 py-12">
                <div className="max-w-[90rem] mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <span className="text-gray-500 text-sm font-medium mr-2">Follow us on :</span>
                            <a href="https://x.com/CaskaydApp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-900 transition-colors group">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current group-hover:text-black transition-colors" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                                <span className="text-sm font-semibold group-hover:text-black transition-colors">Twitter</span>
                            </a>
                            <a href="https://www.instagram.com/caskaydapp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-pink-600 transition-colors group ml-2">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current group-hover:text-pink-600 transition-colors" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 4.326c-3.148 0-3.519.012-4.755.068-2.316.106-3.486 1.488-3.592 3.805-.057 1.236-.069 1.607-.069 4.755 0 3.148.012 3.519.069 4.755.106 2.315 1.275 3.698 3.592 3.804 1.236.057 1.607.069 4.755.069 3.148 0 3.519-.012 4.755-.069 2.317-.106 3.486-1.489 3.592-3.804.057-1.236.069-1.607.069-4.755 0-3.148-.012-3.519-.069-4.755-.106-2.316-1.275-3.698-3.592-3.805-1.236-.056-1.607-.068-4.755-.068zm0 3.854a3.82 3.82 0 100 7.639 3.82 3.82 0 000-7.639zm0 5.476a1.656 1.656 0 110-3.311 1.656 1.656 0 010 3.311zm2.844-5.314a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" /></svg>
                                <span className="text-sm font-semibold group-hover:text-pink-600 transition-colors">Instagram</span>
                            </a>
                            <a href="https://www.tiktok.com/@caskaydapp?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-black transition-colors group ml-2">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current group-hover:text-black transition-colors" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                                <span className="text-sm font-semibold group-hover:text-black transition-colors">TikTok</span>
                            </a>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-gray-500 font-medium">
                            {/* Updated Footer Links to point to dedicated pages */}
                            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
                            <a href="mailto:Mary@caskayd.com" className="hover:text-gray-900 transition-colors">Contact</a>
                        </div>
                    </div>
                    <div className="text-center text-gray-400 text-xs mt-12">
                        © 2026 Copyright Caskayd. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}