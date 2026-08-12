import { Mail } from 'lucide-react'
import LegalShell from '../components/LegalShell'

export default function Privacy() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="How BillBox collects, uses, and protects your data."
      lastUpdated="August 5, 2026"
    >
      <section>
        <h2 className="text-xl font-semibold text-brand">1. Overview</h2>
        <p>
          BillBox (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a SaaS application that helps
          European freelancers create VAT-compliant PDF invoices. This Privacy Policy explains
          what personal data we collect, why we collect it, and the rights you have over your data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">2. Data storage location</h2>
        <p>
          All data you submit to BillBox is stored within the European Union. Our backend
          infrastructure is hosted on Supabase in the Frankfurt (Germany) region, ensuring your
          data is processed and stored in compliance with EU data protection law, including the GDPR.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">3. Information we collect</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Account data:</strong> your email address and authentication credentials.</li>
          <li><strong>Company information:</strong> the business name, address, VAT ID, and contact details you enter in your profile.</li>
          <li><strong>Invoice data:</strong> client details, line items, pricing, VAT rates, and invoice numbers you create.</li>
          <li><strong>Uploaded logos:</strong> image files you upload to brand your invoices.</li>
          <li><strong>Usage data:</strong> basic technical logs required to operate and secure the service.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">4. How we use your data</h2>
        <p>We use the information you provide solely to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>operate the BillBox service and generate your invoices;</li>
          <li>authenticate you and keep your account secure;</li>
          <li>display your branding on the documents you produce;</li>
          <li>provide support and respond to your requests;</li>
          <li>meet our legal and tax-record obligations.</li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">5. Third parties</h2>
        <p>
          We rely on <strong>Supabase</strong> as our database, authentication, and file-storage
          provider. Supabase processes data on our behalf as a processor and stores it in the EU
          (Frankfurt region). We share only the data strictly necessary to run the service and do
          not use your data for advertising purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">6. Your rights</h2>
        <p>Under the GDPR you have the following rights regarding your personal data:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Access:</strong> request a copy of the data we hold about you.</li>
          <li><strong>Rectification:</strong> correct inaccurate or incomplete data.</li>
          <li><strong>Erasure:</strong> request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
          <li><strong>Portability:</strong> receive your data in a structured, machine-readable format.</li>
          <li><strong>Objection &amp; restriction:</strong> object to or limit certain processing.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at privacy@mybillbox.co. You may also lodge a
          complaint with your local data protection authority.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">7. Cookies</h2>
        <p>
          BillBox uses only essential cookies required for authentication and to keep you signed in.
          We do not use tracking, advertising, or third-party analytics cookies.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">8. Data retention</h2>
        <p>
          We retain your data for as long as your account is active. When you delete your account,
          we remove your personal data and uploaded files from our systems within a reasonable
          period, except where we are required to keep records for legal or tax purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">9. Contact</h2>
        <p>
          If you have any questions about this Privacy Policy or your data, please contact us at:
        </p>
        <p className="flex items-center gap-2 font-medium text-brand">
          <Mail className="h-4 w-4" />
          privacy@mybillbox.co
        </p>
      </section>
    </LegalShell>
  )
}
