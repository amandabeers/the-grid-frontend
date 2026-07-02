import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthGuard, GuestGuard } from './auth/AuthGuard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

// Placeholder screen for guarded routes until the real pages are built.
function Stub({ title }: { title: string }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const onLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col items-start gap-4 p-8">
      <h1 className="font-display text-2xl text-chalk">{title} — coming soon</h1>
      <p className="font-body text-chalk-muted">
        Signed in as <span className="text-chalk">{currentUser?.username}</span>
      </p>
      <button
        type="button"
        onClick={onLogout}
        className="h-11 rounded-md border border-border px-4 font-display text-chalk hover:border-signal"
      >
        Log out
      </button>
    </main>
  )
}

function AppRoutes() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <Routes>
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<AuthGuard />}>
        <Route path="/" element={<Stub title="Dashboard" />} />
        <Route path="/grid" element={<Stub title="My Grid" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
