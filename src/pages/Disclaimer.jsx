import { AlertTriangle } from 'lucide-react'
import LegalShell from '../components/LegalShell'

export default function Disclaimer() {
  return (
    <LegalShell
      title="Disclaimer"
      subtitle="Important information about the use of BillBox."
      lastUpdated="August 5, 2026"
    >
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm">
          The VAT rates and calculations provided by BillBox are for reference only. Always verify
          all figures with your local tax authority before issuing an invoice.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-brand">1. Reference VAT rates</h2>
        <p>
          The VAT rates displayed in BillBox are intended as a general reference and may change at
          any time as national tax authorities update their legislation. We make every effort to
          keep the displayed rates current, but we cannot guarantee their accuracy at the moment you
          generate an invoice.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">2. Your responsibility to verify</h2>
        <p>
          You are solely responsible for verifying all VAT rates, tax calculations, invoice numbers,
          and any other figures produced by the Service. Before issuing an invoice to a client, you
          must confirm the applicable rate with your local tax authority or a qualified professional.
          BillBox does not validate whether a particular rate applies to your specific situation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">3. No tax, legal, or accounting advice</h2>
        <p>
          Nothing provided by BillBox &mdash; including rates, templates, tooltips, and support
          responses &mdash; constitutes tax, legal, or accounting advice. BillBox is a productivity
          tool and is not a substitute for professional tax advice. You should consult a qualified
          advisor regarding your individual tax obligations.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">4. No liability for generated invoices</h2>
        <p>
          BillBox generates documents based solely on the information you enter. We accept no
          liability for the content, accuracy, or legal validity of any invoice produced through the
          Service. You remain fully responsible for ensuring your invoices comply with applicable
          law and for any consequences arising from their use.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-brand">5. Service availability</h2>
        <p>
          The Service is provided on an &ldquo;as is&rdquo; basis. We do not warrant that the
          Service will be uninterrupted or error-free. We may update, modify, or discontinue
          features at any time without prior notice.
        </p>
      </section>
    </LegalShell>
  )
}
