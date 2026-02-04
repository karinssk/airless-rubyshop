import type { Metadata } from "next";
import { Link } from "@/lib/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { backendBaseUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Privacy Policy | RUBYSHOP",
  description: "Privacy Policy for RUBYSHOP Hotel - Learn how we collect, use, and protect your personal information.",
};

async function fetchMenu(locale: string) {
  try {
    const response = await fetch(`${backendBaseUrl}/menu?locale=${locale}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data.menu || null;
  } catch {
    return null;
  }
}

async function fetchFooter() {
  try {
    const response = await fetch(`${backendBaseUrl}/footer`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data.footer || null;
  } catch {
    return null;
  }
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const menu = await fetchMenu(locale);
  const footer = await fetchFooter();

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        items={menu?.items || []}
        cta={menu?.cta}
        logoUrl={`${backendBaseUrl}/uploads/logo/rubyshop-no-bg-250pxx100px.jpg`}
      />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: January 2025</p>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
            <p className="mt-4 text-gray-700">
              Welcome to RUBYSHOP Hotel (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at <strong>airless-spray.rubyshop.co.th</strong> and use our room reservation services.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">2. Information We Collect</h2>
            <p className="mt-4 text-gray-700">We collect information that you provide directly to us, including:</p>
            <ul className="mt-4 list-disc pl-6 text-gray-700">
              <li><strong>Personal Information:</strong> Name, email address, phone number, and identification documents when making a reservation</li>
              <li><strong>Payment Information:</strong> Credit/debit card details, bank transfer information, or PromptPay details for processing payments</li>
              <li><strong>Booking Information:</strong> Check-in/check-out dates, room preferences, number of guests, and special requests</li>
              <li><strong>Account Information:</strong> Login credentials when you create an account using email, Google, or LINE</li>
              <li><strong>Communication Data:</strong> Messages sent through our chat system or customer support channels</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
            <p className="mt-4 text-gray-700">We use the collected information for the following purposes:</p>
            <ul className="mt-4 list-disc pl-6 text-gray-700">
              <li>Process and manage your room reservations</li>
              <li>Process payments and send booking confirmations</li>
              <li>Communicate with you about your bookings, including confirmations, reminders, and updates</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send promotional offers and marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">4. Cookies and Tracking Technologies</h2>
            <p className="mt-4 text-gray-700">
              We use cookies and similar tracking technologies to enhance your browsing experience. Cookies are small data files stored on your device that help us:
            </p>
            <ul className="mt-4 list-disc pl-6 text-gray-700">
              <li>Remember your preferences and settings</li>
              <li>Keep you logged in to your account</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Personalize content and advertisements</li>
            </ul>
            <p className="mt-4 text-gray-700">
              You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our website.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">5. Information Sharing and Disclosure</h2>
            <p className="mt-4 text-gray-700">We may share your information with:</p>
            <ul className="mt-4 list-disc pl-6 text-gray-700">
              <li><strong>Payment Processors:</strong> Omise, Stripe, or bank transfer services to process your payments securely</li>
              <li><strong>Service Providers:</strong> Third-party companies that help us operate our website and services</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="mt-4 text-gray-700">
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">6. Data Security</h2>
            <p className="mt-4 text-gray-700">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="mt-4 list-disc pl-6 text-gray-700">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure storage of personal and payment information</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication measures</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">7. Data Retention</h2>
            <p className="mt-4 text-gray-700">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. Booking records are typically retained for 7 years for accounting and legal purposes.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">8. Your Rights</h2>
            <p className="mt-4 text-gray-700">Under applicable data protection laws, you have the right to:</p>
            <ul className="mt-4 list-disc pl-6 text-gray-700">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-4 text-gray-700">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">9. Third-Party Links</h2>
            <p className="mt-4 text-gray-700">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies before providing any personal information.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">10. Children&apos;s Privacy</h2>
            <p className="mt-4 text-gray-700">
              Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">11. Changes to This Policy</h2>
            <p className="mt-4 text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">12. Contact Us</h2>
            <p className="mt-4 text-gray-700">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 rounded-xl bg-gray-50 p-6">
              <p className="font-semibold text-gray-900">RUBYSHOP Hotel</p>
              <p className="mt-2 text-gray-700">Email: info@rubyshop.com</p>
              <p className="text-gray-700">Phone: 092-293-4488</p>
              <p className="text-gray-700">Website: airless-spray.rubyshop.co.th</p>
              <p className="mt-2 text-gray-700">Address: Yaowarat Road, Bangkok, Thailand</p>
            </div>
          </section>
        </article>
      </main>

      {footer && <Footer footer={footer} />}
    </div>
  );
}
