import { useState } from 'react'
import { Eye, EyeOff, UserPlus, AlertCircle, KeyRound, Trash2, ShieldUser } from 'lucide-react'
import { PageHeader, Field, inputClass, Button, ConfirmModal, EmptyState, ErrorState } from '@/components/shared'
import { useAuth } from '@/features/auth/hooks'
import { useAdmins } from '../hooks/useAdmins'
import { useCreateAdmin, useDeleteAdmin } from '../hooks/useRegisterMutations'
import { ChangeAdminPasswordModal } from '../components/ChangeAdminPasswordModal'

const emptyForm = { name: '', email: '', password: '' }

function AdminsList() {
  const { currentUser } = useAuth()
  const { data: admins = [], isLoading, isError, isFetching, refetch } = useAdmins()
  const { mutateAsync: deleteAdmin, isPending: isDeleting } = useDeleteAdmin()
  const [passwordTarget, setPasswordTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleDelete = async () => {
    await deleteAdmin(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="mt-8">
      <h2 className="mb-3 font-display text-lg font-semibold text-espresso">All Admins</h2>

      {isError ? (
        <ErrorState description="Could not load admins." onRetry={refetch} retrying={isFetching} />
      ) : isLoading ? (
        <p role="status" className="py-8 text-center text-sm text-espresso/50">Loading admins…</p>
      ) : admins.length === 0 ? (
        <EmptyState icon={ShieldUser} title="No admins yet" description="Admins you create will show up here." />
      ) : (
        <div className="max-w-2xl divide-y divide-espresso/10 rounded-bakery border border-espresso/10 bg-proof-cream shadow-bakery">
          {admins.map((admin) => {
            const isSelf = admin.id === currentUser?.id
            return (
              <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-espresso">
                    {admin.name}
                    {isSelf && <span className="ml-2 rounded-full bg-oven-amber/15 px-2 py-0.5 text-xs font-normal text-oven-amber">You</span>}
                  </p>
                  <p className="truncate text-xs text-espresso/50">{admin.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setPasswordTarget(admin)}>
                    <KeyRound className="h-3.5 w-3.5" />
                    Change password
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={isSelf}
                    title={isSelf ? "You can't delete your own account" : undefined}
                    onClick={() => setDeleteTarget(admin)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {passwordTarget && (
        <ChangeAdminPasswordModal admin={passwordTarget} onClose={() => setPasswordTarget(null)} />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Danger zone"
        confirmLabel="Delete admin"
        description={deleteTarget && `This permanently deletes ${deleteTarget.name}'s (${deleteTarget.email}) admin login and signs them out everywhere. This cannot be undone.`}
      />
    </div>
  )
}

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

      <AdminsList />
    </div>
  )
}
