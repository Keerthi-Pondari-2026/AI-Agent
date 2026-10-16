import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { InterviewProvider } from './context/InterviewContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Setup } from './pages/Setup'
import { InterviewRoom } from './pages/InterviewRoom'
import { Results } from './pages/Results'
import { Login } from './pages/Login'

export default function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="setup" element={<Setup />} />
              <Route path="interview" element={<InterviewRoom />} />
              <Route path="results" element={<Results />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </InterviewProvider>
    </AuthProvider>
  )
}
