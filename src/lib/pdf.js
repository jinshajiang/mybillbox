import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generateInvoiceNumber } from '../data/vatRates'
import { PDF_DISCLAIMER } from '../components/InvoicePreview'

// Generate an A4 PDF from a DOM node and trigger a download.
// Filename format: INV-YYYYMMDD-XXX.pdf
export async function generateInvoicePDF(element) {
  if (!element) throw new Error('Invoice element not found')

  // Render the DOM node to a high-resolution canvas.
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')

  // A4 in millimetres
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10

  // Fit the canvas image into the printable width while preserving aspect ratio.
  const imgWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
  heightLeft -= pageHeight - margin * 2

  // If the invoice is taller than one page, add extra pages.
  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft)
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  // Footer disclaimer on every page
  const totalPages = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(7)
    pdf.setTextColor(150, 150, 150)
    const footerY = pageHeight - 8
    const wrapped = pdf.splitTextToSize(PDF_DISCLAIMER, pageWidth - margin * 2)
    pdf.text(wrapped, margin, footerY)
  }

  // Build the filename from the invoice number.
  const invoiceNumber = element.getAttribute('data-invoice-number') || generateInvoiceNumber()
  const filename = `${invoiceNumber}.pdf`

  pdf.save(filename)
  return filename
}
