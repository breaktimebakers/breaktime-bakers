import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks'
import { Button, Field, inputClass } from '@/components/shared'

export default function Login() {
  const { login, isLoggingIn } = useAuth()
  const navigate = useNavigate()
  const { sessionExpired } = useSearch({ strict: false })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login({ email, password })
      navigate({ to: '/inventory' })
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-crust px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="relative overflow-hidden rounded-bakery border border-espresso/10 bg-proof-cream shadow-bakery-lg">
          {/* Ticket-edge torn strip */}
          <div className="ticket-edge h-2 bg-oven-amber" />

          <div className="px-6 py-8 sm:px-8">
            {/* Brand header */}
            <div className="mb-6 flex flex-col items-center text-center">
              <img src="/breakTimeLogo.png" alt="Break Times" className="h-14 w-14 rounded-bakery object-cover" />
              <h1 className="mt-3 font-display text-2xl font-semibold text-espresso">Break Times</h1>
              <p className="text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">Bakers</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {sessionExpired && !error && (
                <div className="flex items-center gap-2 rounded-lg bg-oven-amber/15 px-3 py-2 text-sm text-espresso">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Session expired. Please log in again.</span>
                </div>
              )}

              <Field label="Email" required>
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@breaktimebakers.com"
                  autoFocus
                  autoComplete="email"
                />
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputClass} pr-10`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso/70"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={isLoggingIn}>
                <LogIn className="h-4 w-4" />
                {isLoggingIn ? 'Logging in…' : 'Log in'}
              </Button>
            </form>
          </div>

          {/* Ticket-edge torn strip */}
          <div className="ticket-edge-bottom h-2 bg-oven-amber" />
        </div>
      </div>
    </div>
  )
}
