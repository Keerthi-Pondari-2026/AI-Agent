import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { DemoModeBanner } from './DemoModeBanner'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { isDemoMode } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-lavender-50/40 to-white">
      <div className="lg:flex">
        <Sidebar />
        <main className="flex-1 lg:pl-64">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            {isDemoMode && <DemoModeBanner />}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
