"use client";

import { useRouter } from "next/navigation";

export default function TermsOfServiceClient() {
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
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last Updated: March 20, 2026</p>
        </div>

        <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
                <p>
                    Welcome to <strong>Caskayd</strong>. We are pleased to provide a platform that connects innovative businesses with creative talent. By accessing our services, you agree to the following terms, which ensure a secure and transparent environment for all members of our community.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Our Relationship</h2>
                <p>
                    Caskayd acts as a digital intermediary. These Terms govern your access to our mobile application and website. By creating an account, you enter into a legally binding agreement with Caskayd.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Integrity</h2>
                <p className="mb-4">To maintain the quality of our marketplace, we ask that all users:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Provide Accuracy:</strong> Ensure all registration details are current and truthful.</li>
                    <li><strong>Maintain Security:</strong> You are responsible for safeguarding your login credentials. Please notify us immediately if you suspect unauthorized access to your account.</li>
                    <li><strong>Eligibility:</strong> Use of the platform is reserved for individuals aged 18 and older.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. The Caskayd Marketplace Model</h2>
                <p className="mb-4">Caskayd facilitates engagement between Brands (Businesses) and Creators (Users).</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>For Brands:</strong> You acknowledge that you are responsible for the content, legality, and fulfillment of your hosted campaigns.</li>
                    <li><strong>For Creators:</strong> Participation in a campaign constitutes an agreement to meet the specific requirements outlined by the Brand.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Transparent Fee Structure</h2>
                <p className="mb-4">We believe in a performance-based model that aligns our success with yours:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Zero Entry Cost:</strong> There is no subscription fee or cost to join the Caskayd community.</li>
                    <li><strong>Platform Commission:</strong> To support the continuous improvement and security of our services, Caskayd retains a <strong>10% service commission</strong> from the total campaign fee provided by the Brand.</li>
                    <li><strong>Payment Processing:</strong> All financial transactions are handled via secure, third-party processors. While we strive for efficiency, Caskayd is not liable for external banking delays.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Professional Conduct & Content</h2>
                <p className="mb-4">We pride ourselves on a respectful community. We kindly request that all users refrain from:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Submitting content that is defamatory, offensive, or infringing on intellectual property.</li>
                    <li>Engaging in fraudulent activity or misrepresenting campaign results.</li>
                    <li>Attempting to circumvent the platform’s payment systems.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property & Usage Rights</h2>
                <p>
                    By submitting content for a campaign, Creators grant the Brand and Caskayd a non-exclusive, royalty-free license to use that specific content for promotional and archival purposes. Ownership of the original work remains with the Creator unless otherwise specified in a separate bilateral agreement between the Brand and Creator.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Dispute Resolution & Liability</h2>
                <p className="mb-4">
                    While Caskayd is not a party to the specific contracts between Brands and Creators, we are committed to assisting in the resolution of disputes through our support channels.
                </p>
                <p>
                    <strong>Liability:</strong> Caskayd provides its platform on an &quot;as-is&quot; basis. We are not liable for any indirect or consequential losses arising from the use of the platform.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Account Conclusion</h2>
                <p>
                    Either party may terminate this agreement at any time. Caskayd reserves the right to suspend accounts that fail to adhere to these standards of professional conduct to protect the wider community.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law and Dispute Resolution</h2>
                <p className="mb-4">Caskayd is proud to be a platform founded and operated within Nigeria. To ensure consistency and fairness for all our users, the following legal framework applies:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Jurisdiction:</strong> These Terms of Service and your use of the Caskayd platform shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles.</li>
                    <li><strong>Amicable Settlement:</strong> In the spirit of professional partnership, both Caskayd and its users agree that in the event of any dispute, claim, or controversy, the parties shall first attempt to reach an informal and amicable resolution through our support channels.</li>
                    <li><strong>Formal Resolution:</strong> Should an amicable settlement not be reached within thirty (30) days, the dispute shall be referred to and finally resolved by the courts of competent jurisdiction within Nigeria.</li>
                    <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable or invalid by a court, that specific provision shall be limited or eliminated to the minimum extent necessary, while the remaining terms stay in full force and effect.</li>
                </ul>
            </section>
        </div>
      </div>
    </div>
  );
}