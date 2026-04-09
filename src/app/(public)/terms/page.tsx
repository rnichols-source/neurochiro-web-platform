import React from 'react';
import Footer from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h1 className="text-4xl font-heading font-black text-neuro-navy">Terms of Service</h1>
            <p className="text-neuro-orange font-bold text-sm uppercase tracking-widest pb-2">Last Updated: April 8, 2026</p>
          </div>

          <div className="prose prose-slate max-w-none bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 space-y-8">
            <p className="text-lg text-gray-600">
              By using the NeuroChiro platform, you agree to the following terms and conditions. Please read them carefully.
            </p>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing or using NeuroChiro, you agree to be bound by these terms. If you do not agree, you may not access the platform. These terms apply to all users: doctors, students, patients, and vendors.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">2. What NeuroChiro Is (and Isn&apos;t)</h2>
              <p className="text-gray-600">
                NeuroChiro is a directory and professional networking platform. We connect patients with chiropractic practitioners who specialize in nervous system care. <strong>We are not a healthcare provider.</strong> We do not provide medical advice, diagnoses, or treatment. The presence of a doctor on our platform is not an endorsement of their clinical abilities. Always consult directly with a healthcare provider before making medical decisions.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">3. Doctor Verification &amp; Credentials</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                <li>Doctors must provide accurate information when joining, including their real name, clinic details, and license information.</li>
                <li>NeuroChiro reviews each doctor application before approving their profile for the public directory.</li>
                <li>The &ldquo;Verified Clinician&rdquo; badge indicates that our team has reviewed the doctor&apos;s application and confirmed their identity and practice. It does not constitute a guarantee of clinical outcomes.</li>
                <li>If a doctor&apos;s license is suspended, revoked, or subject to disciplinary action, they must notify NeuroChiro immediately. Failure to do so will result in permanent removal from the platform.</li>
                <li>NeuroChiro reserves the right to remove any doctor profile at any time for any reason, including but not limited to: patient complaints, credential concerns, or violation of these terms.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">4. User Conduct</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                <li>You are responsible for the security of your account and all activity under it.</li>
                <li>You may not impersonate another person, use false credentials, or create fraudulent profiles.</li>
                <li>Harassment, spam, or abusive behavior toward any user will result in immediate account termination.</li>
                <li>Patient reviews and transformation stories must be truthful. Fabricated reviews are grounds for removal.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">5. Payments &amp; Subscriptions</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                <li>Doctor and student memberships are billed monthly or annually through Stripe.</li>
                <li>You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period.</li>
                <li>We do not offer refunds for partial billing periods.</li>
                <li>If your payment fails, your profile will be hidden from the directory until payment is resolved.</li>
                <li>Pricing may change with 30 days&apos; advance notice via email.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">6. Reporting Concerns</h2>
              <p className="text-gray-600">
                If you have a concern about a doctor listed on NeuroChiro &mdash; including suspected fraud, credential issues, or patient safety concerns &mdash; please contact us immediately at{" "}
                <a href="mailto:safety@neurochiro.com" className="text-neuro-orange font-bold hover:underline">safety@neurochiro.com</a>.
                We investigate all reports and will take action including profile suspension or removal where warranted.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-600">
                NeuroChiro provides a directory service and is not responsible for the quality of care provided by any doctor listed on the platform. We make no warranties about clinical outcomes. Our liability is limited to the amount you have paid us in the 12 months preceding any claim. We are not liable for any indirect, incidental, or consequential damages.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">8. Doctor Referrals</h2>
              <p className="text-gray-600">
                NeuroChiro facilitates doctor-to-doctor referrals as a convenience feature. NeuroChiro does not evaluate, endorse, or guarantee the quality of care provided by any referred doctor. Referring doctors and receiving doctors are independently responsible for their own clinical decisions. NeuroChiro bears no liability for outcomes arising from referrals made through the platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">9. Job Board &amp; Career Listings</h2>
              <p className="text-gray-600">
                Job postings on NeuroChiro are submitted by employers (clinics, practices, or individual doctors). NeuroChiro does not verify the accuracy of job postings, vet employers, or guarantee employment outcomes. Employers are solely responsible for the content of their listings, hiring practices, and compliance with applicable labor laws. NeuroChiro is not liable for disputes between employers and applicants.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">10. Intellectual Property</h2>
              <p className="text-gray-600">
                All content on the NeuroChiro platform (design, code, branding, course materials) is owned by NeuroChiro. Doctor-submitted content (bios, photos, stories) remains the property of the submitting doctor but is licensed to NeuroChiro for display on the platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">11. Dispute Resolution</h2>
              <p className="text-gray-600">
                Any disputes arising from your use of NeuroChiro will first be addressed through good-faith negotiation. If we cannot resolve the issue informally, disputes will be settled through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to resolve disputes individually and waive any right to participate in class action proceedings.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">12. Changes to These Terms</h2>
              <p className="text-gray-600">
                We may update these terms from time to time. We will notify you of material changes via email or a notice on the platform. Continued use after changes constitutes acceptance.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">13. Contact</h2>
              <p className="text-gray-600">
                Questions about these terms? Contact us at{" "}
                <a href="mailto:legal@neurochiro.com" className="text-neuro-orange font-bold hover:underline">legal@neurochiro.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
