import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search, Pencil, Trash2, Eye, Users, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { useWorkers } from '@/features/workers/hooks'
import { Button, EmptyState, Modal, PageHeader, Pagination, inputClass } from '@/components/shared'
import { usePagination } from '@/hooks'
import { RoleBadge, roleConfig } from '../components/RoleBadge'

import { WorkerAvatar } from '../components/PhotoCapture'
import { WorkerCard } from '../components/WorkerCard'
import { AddWorkerModal } from '../components/AddWorkerModal'

const PAGE_SIZE = 8
const allRoles = ['chef', 'labour', 'delivery', 'marketer']

export default function WorkersList() {
  const { workers, deleteWorker } = useWorkers()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState([])
  const [view, setView] = useState('table')
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    let list = workers
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((w) => w.name.toLowerCase().includes(q) || w.phone.includes(q))
    }
    if (statusFilter !== 'all') list = list.filter((w) => w.status === statusFilter)
    if (roleFilter.length > 0) list = list.filter((w) => roleFilter.some((r) => w.roles.includes(r)))
    return list
  }, [workers, search, statusFilter, roleFilter])

  const { page, setPage, totalPages, start, end } = usePagination(filtered.length, PAGE_SIZE)
  const paged = filtered.slice(start, end)

  const toggleRoleFilter = (r) => setRoleFilter((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r])

  const confirmDelete = () => {
    if (deleteTarget) deleteWorker(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div>
      <PageHeader eyebrow="Workspace / Workers" title="Workers" description="Manage your bakery staff, roles, and shifts." actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add worker</Button>} />

      {/* Filter bar */}
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative flex-1 lg:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/30" />
            <input className={`${inputClass} pl-9`} placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="inline-flex rounded-full bg-crust p-0.5">
            {['all', 'active', 'left'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${statusFilter === s ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>{s}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {allRoles.map((r) => (
              <button
                key={r}
                onClick={() => toggleRoleFilter(r)}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition ${roleFilter.includes(r) ? roleConfig[r].className : 'border-espresso/15 bg-crust/30 text-espresso/50 hover:bg-crust/50'}`}
              >
                {roleConfig[r].label}
              </button>
            ))}
          </div>
          <div className="ml-auto inline-flex rounded-full bg-crust p-0.5">
            <button onClick={() => setView('table')} className={`rounded-full p-1.5 ${view === 'table' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}><TableIcon className="h-4 w-4" /></button>
            <button onClick={() => setView('cards')} className={`rounded-full p-1.5 ${view === 'cards' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>
        <p className="mt-3 text-xs text-espresso/50">{filtered.length} {filtered.length === 1 ? 'worker' : 'workers'}</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No workers found" description="Add a worker or adjust your filters." />
      ) : view === 'cards' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.map((w) => <WorkerCard key={w.id} worker={w} onDelete={setDeleteTarget} />)}
          </div>
          <div className="mt-4 rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Worker</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Roles</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Phone</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Joined</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((w) => (
                  <tr key={w.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <WorkerAvatar photo={w.photo} name={w.name} size="sm" />
                        <div>
                          <p className="font-medium text-espresso">{w.name}</p>
                          <p className="font-mono text-[10px] text-espresso/40">₹{w.monthlySalary.toLocaleString('en-IN')}/mo</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.roles.map((r) => <RoleBadge key={r} role={r} />)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-espresso/70">{w.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${w.status === 'active' ? 'text-matcha-glaze' : 'text-espresso/40'}`}>
                        {w.status === 'active' ? 'Active' : 'Left'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-espresso/60">{new Date(w.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to="/workers/$workerId" params={{ workerId: w.id }}>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/50 hover:bg-espresso/5 hover:text-espresso" title="View"><Eye className="h-4 w-4" /></button>
                        </Link>
                        <Link to="/workers/$workerId" params={{ workerId: w.id }}>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/50 hover:bg-espresso/5 hover:text-espresso" title="Edit"><Pencil className="h-4 w-4" /></button>
                        </Link>
                        <button onClick={() => setDeleteTarget(w)} className="flex h-8 w-8 items-center justify-center rounded-lg text-cherry-compote hover:bg-cherry-compote/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
        </div>
      )}

      <AddWorkerModal open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        eyebrow="Workers"
        title="Delete worker?"
        footer={<><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-sm text-espresso/70">Are you sure you want to delete <span className="font-medium text-espresso">{deleteTarget?.name}</span>? This will also remove all their attendance records. This cannot be undone.</p>
      </Modal>
    </div>
  )
}
