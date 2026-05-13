import Link from "next/link";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "SMS Terms & Conditions | NeuroChiro",
  description: "NeuroChiro SMS messaging terms, opt-in policy, and consent information.",
};

export default function SMSTermsPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      <section className="bg-neuro-navy text-white pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">SMS Terms &amp; Conditions</h1>
          <p className="text-gray-400">Last updated: May 12, 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10 space-y-8">

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">SMS Messaging Program</h2>
            <p className="text-gray-600 leading-relaxed">
              NeuroChiro, operated by Aligned Ventures LLC, offers an optional SMS messaging program to keep our members informed about their account, platform updates, and relevant opportunities. By opting in to our SMS program, you agree to receive text messages from NeuroChiro at the phone number you provide.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">How to Opt In</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              You may opt in to receive SMS messages from NeuroChiro by:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Providing your phone number during account registration and checking the optional SMS consent checkbox</li>
              <li>Enabling SMS notifications in your account settings</li>
              <li>Texting JOIN to our toll-free number</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3 font-bold">
              Opting in to SMS messages is entirely voluntary and is NOT a condition of purchasing any product, service, or membership from NeuroChiro. You may use all features of the platform without opting in to text messages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Types of Messages</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              If you opt in, you may receive text messages related to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Account notifications (profile updates, new patient leads)</li>
              <li>Platform updates and new feature announcements</li>
              <li>Seminar and event reminders</li>
              <li>ChiroMatch cycle notifications</li>
              <li>Job posting and application updates</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Message Frequency</h2>
            <p className="text-gray-600 leading-relaxed">
              Message frequency varies based on your account activity. You may receive up to 10 messages per month. Message and data rates may apply depending on your mobile carrier and plan.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">How to Opt Out</h2>
            <p className="text-gray-600 leading-relaxed">
              You can opt out of receiving SMS messages at any time by:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>Replying <strong>STOP</strong> to any message you receive from us</li>
              <li>Updating your notification preferences in your account settings</li>
              <li>Contacting us at <a href="mailto:support@neurochirodirectory.com" className="text-neuro-orange hover:underline">support@neurochirodirectory.com</a></li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              After opting out, you will receive one final confirmation message. You will not receive any further SMS messages unless you opt in again.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Help</h2>
            <p className="text-gray-600 leading-relaxed">
              For help or questions about our SMS program, reply <strong>HELP</strong> to any message or contact us at <a href="mailto:support@neurochirodirectory.com" className="text-neuro-orange hover:underline">support@neurochirodirectory.com</a>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Carriers</h2>
            <p className="text-gray-600 leading-relaxed">
              Supported carriers include but are not limited to AT&amp;T, T-Mobile, Verizon, Sprint, and all major US carriers. Carriers are not liable for delayed or undelivered messages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Your phone number and opt-in data will not be shared with third parties for marketing purposes. For more information, see our <Link href="/privacy" className="text-neuro-orange hover:underline">Privacy Policy</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-3">Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Aligned Ventures LLC</strong> (d/b/a NeuroChiro)<br />
              Email: <a href="mailto:support@neurochirodirectory.com" className="text-neuro-orange hover:underline">support@neurochirodirectory.com</a><br />
              Website: <a href="https://neurochiro.co" className="text-neuro-orange hover:underline">neurochiro.co</a>
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
