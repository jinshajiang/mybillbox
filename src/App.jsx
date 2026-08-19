import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import NewInvoice from './pages/NewInvoice'
import InvoiceHistory from './pages/InvoiceHistory'
import Settings from './pages/Settings'
import ReceiptBox from './pages/ReceiptBox'
import ReceiptNew from './pages/ReceiptNew'
import ReceiptDetail from './pages/ReceiptDetail'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Disclaimer from './pages/Disclaimer'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/disclaimer" element={<Disclaimer />} />

      {/* Protected dashboard */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invoice/new" element={<NewInvoice />} />
        <Route path="/invoices" element={<InvoiceHistory />} />
        <Route path="/receipts" element={<ReceiptBox />} />
        <Route path="/receipts/new" element={<ReceiptNew />} />
        <Route path="/receipts/:id" element={<ReceiptDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Fallbacks */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
