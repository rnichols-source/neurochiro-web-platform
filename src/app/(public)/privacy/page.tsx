import React from 'react';
import Footer from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h1 className="text-4xl font-heading font-black text-neuro-navy">Privacy Policy</h1>
            <p className="text-neuro-orange font-bold text-sm uppercase tracking-widest pb-2">Last Updated: April 8, 2026</p>
          </div>

          <div className="prose prose-slate max-w-none bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 space-y-8">
            <p className="text-lg text-gray-600">
              Your privacy is important to us. This policy explains what data we collect, how we use it, and your rights. NeuroChiro is committed to protecting the personal and health-related information of all users.
            </p>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">1. Information We Collect</h2>
              <p className="text-gray-600 mb-3">We collect information you provide directly:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li><strong>Account information:</strong> Name, email, password, phone number, role (doctor/student/patient)</li>
                <li><strong>Doctor profiles:</strong> Clinic name, address, specialties, bio, license information, photos</li>
                <li><strong>Health tracking data:</strong> Daily log entries (energy, pain, sleep levels) submitted by patients</li>
                <li><strong>Contact form submissions:</strong> Name, email, and message content</li>
                <li><strong>Payment information:</strong> Processed securely through Stripe. We do not store credit card numbers.</li>
              </ul>
              <p className="text-gray-600 mt-3">We automatically collect:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li>Browser type, IP address, and device information</li>
                <li>Pages visited and actions taken on the platform</li>
                <li>Location data (timezone-based region detection only, not GPS)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">2. How We Use Your Data</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li>To operate the directory and connect patients with doctors</li>
                <li>To display doctor profiles publicly in search results</li>
                <li>To process payments and manage subscriptions</li>
                <li>To send account-related notifications (email, SMS with consent)</li>
                <li>To improve the platform based on usage patterns</li>
                <li>To respond to support requests and contact form submissions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">3. Health Data Protection</h2>
              <p className="text-gray-600 mb-3">
                NeuroChiro takes the protection of health-related data seriously. Patient daily log data (energy, pain, and sleep tracking) is:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li><strong>Encrypted in transit</strong> using TLS/SSL encryption</li>
                <li><strong>Stored securely</strong> in our database with row-level security policies</li>
                <li><strong>Visible only to the patient</strong> who created it &mdash; no doctors, admins, or third parties can access individual patient health logs</li>
                <li><strong>Never sold</strong> to advertisers, data brokers, or any third party</li>
                <li><strong>Deletable</strong> at any time by the patient through their account settings</li>
              </ul>
              <p className="text-gray-600 mt-3">
                <strong>HIPAA Compliance Note:</strong> NeuroChiro is a directory and wellness tracking platform, not a healthcare provider. We do not create, receive, or maintain protected health information (PHI) as defined by HIPAA. However, we apply HIPAA-aligned security practices to all health-related data as a matter of principle, including encryption, access controls, and audit logging.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">4. Third-Party Services</h2>
              <p className="text-gray-600 mb-3">We use the following third-party services:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li><strong>Supabase:</strong> Database hosting and authentication (data stored in US data centers)</li>
                <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                <li><strong>Vercel:</strong> Website hosting and deployment</li>
                <li><strong>Resend:</strong> Transactional email delivery</li>
                <li><strong>Google Maps:</strong> Map display and review integration</li>
              </ul>
              <p className="text-gray-600 mt-3">We do not sell, rent, or share your personal data with any other third parties.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">5. Data Retention</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li><strong>Active accounts:</strong> Data is retained for as long as your account is active</li>
                <li><strong>Deleted accounts:</strong> Personal data is removed within 30 days of account deletion</li>
                <li><strong>Doctor profiles:</strong> Removed from the public directory immediately upon cancellation</li>
                <li><strong>Health logs:</strong> Deleted when the patient deletes their account or requests deletion</li>
                <li><strong>Email leads:</strong> Retained for up to 12 months, then automatically purged</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">6. Cookies</h2>
              <p className="text-gray-600">
                We use essential cookies for authentication and session management. We use analytics cookies to understand how users interact with the platform. You can disable non-essential cookies through our consent banner or your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">7. Your Rights</h2>
              <p className="text-gray-600 mb-3">You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of marketing communications at any time</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-gray-600 mt-3">
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@neurochiro.com" className="text-neuro-orange font-bold hover:underline">privacy@neurochiro.com</a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">8. International Users</h2>
              <p className="text-gray-600 mb-3">NeuroChiro serves users globally. If you are located outside the United States:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                <li><strong>European Union (GDPR):</strong> You have the right to access, rectify, erase, restrict processing, and port your data. You may also object to processing and lodge a complaint with your local data protection authority. We process your data based on consent and legitimate interest.</li>
                <li><strong>Australia (Privacy Act 1988):</strong> We comply with the Australian Privacy Principles (APPs). You have the right to access and correct your personal information. We do not transfer personal data outside Australia without appropriate safeguards. Complaints can be directed to the Office of the Australian Information Commissioner (OAIC).</li>
                <li><strong>Canada (PIPEDA):</strong> We collect, use, and disclose your personal information only with your consent and for identified purposes. You may withdraw consent at any time.</li>
                <li><strong>United Kingdom (UK GDPR):</strong> Your rights mirror those under EU GDPR. Contact us to exercise them.</li>
                <li><strong>New Zealand (Privacy Act 2020):</strong> You have the right to access and correct your personal information held by us.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-neuro-navy mb-3">9. Contact</h2>
              <p className="text-gray-600">
                For privacy-related questions or concerns, email{" "}
                <a href="mailto:privacy@neurochiro.com" className="text-neuro-orange font-bold hover:underline">privacy@neurochiro.com</a>.
                We will respond within 5 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
