import { Navbar } from "@/components/homepage/layout/Navbar";
import { Footer } from "@/components/homepage/layout/Footer";

export const metadata = {
  title: "Privacy Policy | BPI",
  description: "Privacy Policy for BPI.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bpi-cream">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-bpi-charcoal mb-6 tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-bpi-charcoal/60 mb-8">Last updated: May 16, 2026</p>

            <div className="space-y-6 text-bpi-charcoal/80 leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">1. Information We Collect</h2>
                <p>
                  We collect information necessary to operate BPI services, including account information, transaction-related data, and support communications.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">2. How We Use Information</h2>
                <p>
                  We use your information to provide and improve services, maintain security, process requests, and comply with legal obligations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">3. Data Security</h2>
                <p>
                  We apply administrative and technical safeguards to protect personal information. No method of transmission or storage is fully risk-free.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">4. Your Choices</h2>
                <p>
                  You may request updates or corrections to your account information through support channels, subject to verification and applicable law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">5. Contact</h2>
                <p>
                  For privacy-related questions, contact <a className="text-bpi-green font-semibold" href="mailto:info@beepagro.com">info@beepagro.com</a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}