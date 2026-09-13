import { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Modal, Field, inputClass, Button } from '@/components/shared'
import { useChangeAdminPassword } from '../hooks/useRegisterMutations'

export function ChangeAdminPasswordModal({ admin, onClose }) {
  const { mutateAsync: changePassword, isPending } = useChangeAdminPassword()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await changePassword({ id: admin.id, password })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not update password. Please try again.')
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Register / Admins"
      title={`Change password — ${admin.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" form="change-admin-password-form" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save password'}
          </Button>
        </>
      }
    >
      <form id="change-admin-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="New password" required hint="At least 8 characters">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`${inputClass} pr-10`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              autoFocus
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

        <p className="text-xs text-espresso/45">
          This signs {admin.name} out everywhere — they&apos;ll need to log in again with the new password.
        </p>
      </form>
    </Modal>
  )
}
