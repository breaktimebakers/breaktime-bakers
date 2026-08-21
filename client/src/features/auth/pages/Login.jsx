import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks'
import { Button, Field, inputClass } from '@/components/shared'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const success = login(username, password)
    if (success) {
      navigate({ to: '/inventory' })
    } else {
      setError('Invalid username or password. Please try again.')
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
              <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Bakery admin</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Username" required>
                <input
                  type="text"
                  className={inputClass}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  autoComplete="username"
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

              <Button type="submit" size="lg" className="mt-2 w-full">
                <LogIn className="h-4 w-4" />
                Log in
              </Button>
            </form>
          </div>

          {/* Ticket-edge torn strip */}
          <div className="ticket-edge-bottom h-2 bg-oven-amber" />
        </div>

        <p className="mt-4 text-center text-xs text-espresso/40">
          Demo credentials: admin / breaktimes123
        </p>
      </div>
    </div>
  )
}
