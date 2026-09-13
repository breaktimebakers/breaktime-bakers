import { useState } from 'react'
import { Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react'
import { PageHeader, Field, inputClass, Button } from '@/components/shared'
import { useCreateAdmin } from '../hooks/useRegisterMutations'

const emptyForm = { name: '', email: '', password: '' }

export default function RegisterAdmin() {
  const { mutateAsync: createAdmin, isPending } = useCreateAdmin()
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createAdmin(form)
      setForm(emptyForm)
    } catch (err) {
      setError(err.message || 'Could not create admin. Please try again.')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Register"
        title="New Admin"
        description="Create another admin login for the bakery dashboard. They'll get the same full access you have."
      />

      <div className="max-w-md rounded-bakery border border-espresso/10 bg-proof-cream p-6 shadow-bakery">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Name" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={update('name')}
              placeholder="Full name"
              autoComplete="name"
              required
              minLength={3}
              maxLength={50}
            />
          </Field>

          <Field label="Email" required>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={update('email')}
              placeholder="admin@breaktimebakers.com"
              autoComplete="email"
              required
            />
          </Field>

          <Field label="Password" required hint="At least 8 characters">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pr-10`}
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
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

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={isPending}>
            <UserPlus className="h-4 w-4" />
            {isPending ? 'Creating…' : 'Create admin'}
          </Button>
        </form>
      </div>
    </div>
  )
}
