import { Link } from 'react-router-dom'
import { Home, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Compass className="h-8 w-8" />
      </div>
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="mt-3 text-2xl font-bold text-brand">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-600">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-6 px-5 py-2.5">
        <Home className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  )
}
