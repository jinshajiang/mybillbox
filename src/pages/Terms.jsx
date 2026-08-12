import { Mail } from 'lucide-react'
import LegalShell from '../components/LegalShell'

export default function Terms() {
  return (
    <LegalShell
      title="Terms of Service"
      subtitle="The terms under which you may use BillBox."
      lastUpdated="August 5, 2026"
    >
      <section>
        <h2 className="text-xl font-semibold text-brand">1. Acceptance of terms</h2>
        <p>
          By creating an account or using the BillBox service (&ldquo;the Service&rdquo;), you agree
          to be bound by these Terms of Service. If you do not agree with any part of these terms,
          please do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">2. Description of service</h2>
        <p>
          BillBox is a web-based application that allows freelancers and small businesses to create
          VAT-compliant PDF invoices for supported European countries. The Service includes invoice
          generation, branding, and PDF export.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">3. No professional advice</h2>
        <p>
          BillBox is a productivity tool, not a tax, legal, or accounting service. The VAT rates,
          invoice templates, and calculations provided by the Service are for general informational
          purposes only and do not constitute professional tax, legal, or accounting advice. You are
          solely responsible for verifying the correctness of every invoice you issue and for
          complying with the tax rules that apply to you.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">4. Refund policy</h2>
        <p>
          We offer a 30-day money-back guarantee on paid subscriptions. If you are not satisfied
          with a paid plan, you may request a full refund within 30 days of the original purchase by
          contacting us. Refunds are issued to the original payment method.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>use the Service for any unlawful purpose or to generate fraudulent invoices;</li>
          <li>upload content that infringes the intellectual property rights of others;</li>
          <li>attempt to disrupt, reverse-engineer, or gain unauthorized access to the Service;</li>
          <li>resell or sublicense access to the Service without our written consent.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">6. Limitation of liability</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the maximum
          extent permitted by law, BillBox shall not be liable for any indirect, incidental, or
          consequential damages arising from your use of the Service. Our total aggregate liability
          for any claim arising out of or relating to these Terms is capped at the fees you paid to
          us in the 12 months preceding the event giving rise to the claim.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">7. Account termination</h2>
        <p>
          You may delete your account at any time from the application settings. We may suspend or
          terminate your access to the Service if you breach these Terms or if we are required to do
          so by law. Upon termination, your right to use the Service ends immediately.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">8. Governing law</h2>
        <p>
          These Terms are governed by the laws of the Federal Republic of Germany, excluding its
          conflict-of-laws rules. Any disputes arising from these Terms shall be subject to the
          exclusive jurisdiction of the courts of Germany.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">9. Changes to these terms</h2>
        <p>
          We may update these Terms from time to time. If we make material changes, we will notify
          you through the Service or by email. Continued use of the Service after changes take
          effect constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">10. Contact</h2>
        <p>If you have any questions about these Terms, please contact us at:</p>
        <p className="flex items-center gap-2 font-medium text-brand">
          <Mail className="h-4 w-4" />
          privacy@mybillbox.co
        </p>
      </section>
    </LegalShell>
  )
}
