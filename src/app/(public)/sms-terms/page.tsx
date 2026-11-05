import Link from "next/link";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "SMS Terms & Conditions | NeuroChiro",
  description: "NeuroChiro request notification texts, opt-in, and opt-out.",
};

export default function SMSTermsPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      <section className="bg-neuro-navy text-white pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">SMS Terms &amp; Conditions</h1>
          <p className="text-gray-400">Last updated: November 4, 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10 space-y-8">

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Program</h2>
            <p className="text-gray-600 leading-relaxed">
              NeuroChiro Request Notifications is operated by Aligned Ventures LLC. Texts come from (864) 754-7495.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">What we send</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Patients: a confirmation that an appointment request reached the office.</li>
              <li>Patients who join the patient list and check the text box: a short alert when a NeuroChiro doctor joins near them, with a link on neurochiro.co.</li>
              <li>Doctors and their staff: an alert when a new patient request arrives.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              These texts are transactional only. We do not send marketing texts.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">How you opt in</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Patients: check the optional text box on a request form, or on the patient list, on neurochiro.co.</li>
              <li>Doctors: add a mobile number and check the box in NeuroChiro settings, or ask us in writing.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3 font-bold">
              Consent is not a condition of any purchase or of sending a request.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Frequency and rates</h2>
            <p className="text-gray-600 leading-relaxed">
              Message frequency varies. Msg &amp; data rates may apply.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">How to opt out and get help</h2>
            <p className="text-gray-600 leading-relaxed">
              Reply STOP to opt out. Reply HELP for help. You can also email <a href="mailto:support@neurochiro.co" className="text-neuro-orange hover:underline">support@neurochiro.co</a>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Carriers</h2>
            <p className="text-gray-600 leading-relaxed">
              Carriers are not liable for delayed or undelivered messages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell or share mobile numbers or SMS consent with third parties for marketing. See the <Link href="/privacy" className="text-neuro-orange hover:underline">Privacy Policy</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Aligned Ventures LLC</strong><br />
              Email: <a href="mailto:support@neurochiro.co" className="text-neuro-orange hover:underline">support@neurochiro.co</a><br />
              Website: <a href="https://neurochiro.co" className="text-neuro-orange hover:underline">https://neurochiro.co</a>
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
