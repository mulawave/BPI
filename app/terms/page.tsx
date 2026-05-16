import { Navbar } from "@/components/homepage/layout/Navbar";
import { Footer } from "@/components/homepage/layout/Footer";

export const metadata = {
  title: "Terms of Service | BPI",
  description: "Terms of Service for BPI.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bpi-cream">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-bpi-charcoal mb-6 tracking-tight">Terms of Service</h1>
            <p className="text-sm text-bpi-charcoal/60 mb-8">Last updated: May 16, 2026</p>

            <div className="space-y-6 text-bpi-charcoal/80 leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using BPI services, you agree to these Terms of Service. If you do not agree, do not use the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">2. Account Responsibilities</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and all activities under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">3. Platform Use</h2>
                <p>
                  You agree to use BPI only for lawful purposes and in compliance with all applicable regulations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">4. Changes to Services</h2>
                <p>
                  BPI may update, suspend, or discontinue services at any time, with or without notice, where required for operational, legal, or security reasons.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-bpi-charcoal mb-2">5. Contact</h2>
                <p>
                  For legal inquiries regarding these terms, contact <a className="text-bpi-green font-semibold" href="mailto:info@beepagro.com">info@beepagro.com</a>.
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