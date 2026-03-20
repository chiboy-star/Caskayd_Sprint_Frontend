"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicyClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        
        <div className="mb-10 border-b border-gray-100 pb-8">
            {/* CHANGED: Replaced Link with a back button */}
            <button 
                onClick={() => router.back()} 
                className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm mb-6 inline-block cursor-pointer bg-transparent border-none p-0"
            >
                &larr; Go Back
            </button>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Effective Date: March 20, 2026</p>
        </div>

        <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
                <p>
                    At <strong>Caskayd</strong>, we value the trust you place in us when you share your information. This Privacy Policy explains how we collect, use, and protect your personal data in compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>. Our goal is to be as transparent as possible so you can focus on creating and growing.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                <p className="mb-4">To provide our services effectively, we collect the following types of information:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Information:</strong> Name, email address, and password.</li>
                    <li><strong>Professional Details:</strong> For Creators, this may include social media handles, portfolio links, and content performance metrics. For Brands, this includes company registration details.</li>
                    <li><strong>Financial Information:</strong> Bank account details or payment processor identifiers to facilitate the payout of campaign fees.</li>
                    <li><strong>Technical Data:</strong> IP address, device type, and app usage patterns to help us improve your experience.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Data</h2>
                <p className="mb-4">
                    We process your information based on <strong>Contractual Necessity</strong> (to run the app) and <strong>Legitimate Interest</strong> (to improve our services). Specifically, we use it to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Verify your identity and maintain a secure community.</li>
                    <li>Connect Brands with the most suitable Creators for marketing campaigns.</li>
                    <li>Process payments and deduct the 10% service commission.</li>
                    <li>Send you essential updates regarding your account or active campaigns.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Sharing and Disclosure</h2>
                <p className="mb-4">We do not sell your personal data. We only share information when necessary:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Between Users:</strong> Brands see Creator profiles to select partners; Creators see Brand campaign details.</li>
                    <li><strong>Service Providers:</strong> We share data with secure third-party payment gateways and cloud storage providers (which may involve cross-border transfers protected by standard contractual clauses).</li>
                    <li><strong>Legal Obligations:</strong> If required by Nigerian law or regulatory bodies like the Nigeria Data Protection Commission (NDPC).</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Your Rights as a Data Subject</h2>
                <p className="mb-4">Under the NDPA 2023, you have significant rights regarding your information. You may:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                    <li><strong>Correction:</strong> Ask us to update or fix inaccurate information.</li>
                    <li><strong>Deletion:</strong> Request that we delete your data (the &quot;Right to be Forgotten&quot;), subject to legal retention requirements.</li>
                    <li><strong>Withdraw Consent:</strong> Opt-out of marketing communications at any time via your settings.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Security and Retention</h2>
                <p className="mb-4">
                    We implement industry-standard technical and organizational measures (such as encryption and secure servers) to protect your data from unauthorized access.
                </p>
                <p>
                    We retain your information only as long as your account is active or as needed to fulfill our legal and accounting obligations.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Children’s Privacy</h2>
                <p>
                    Caskayd is designed for users aged 18 and older. We do not knowingly collect data from children. If we discover such data has been collected, it will be deleted immediately.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Our Data Privacy Team</h2>
                <p className="mb-4">
                    If you have questions about this policy or wish to exercise your data rights, please reach out to us. We are committed to responding to all requests within 30 days.
                </p>
                <p>
                    <strong>Email:</strong> <a href="mailto:Mary@caskayd.com" className="text-emerald-600 hover:underline">Mary@caskayd.com</a>
                </p>
            </section>
        </div>
      </div>
    </div>
  );
}