import { useState, useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Pencil, UserCircle, CalendarDays, Wallet } from 'lucide-react'
import { useWorkers } from '@/features/workers/hooks'
import { Button, EmptyState, PageHeader } from '@/components/shared'
import { RoleBadge, roleConfig } from '../components/RoleBadge'
import { AadhaarDisplay } from '../components/AadhaarField'
import { WorkerAvatar } from '../components/PhotoCapture'
import { AttendanceCalendar, statusConfig } from '../components/AttendanceCalendar'
import { dayNames, dailySalaryFromMonthly } from '@/features/workers/utils'
import { EditWorkerModal } from '../components/EditWorkerModal'
import { InlineField } from '../components/InlineField'

export default function WorkerDetail() {
  const { workerId } = useParams({ strict: false })
  const { workers, attendance, updateWorker, markLeft, reactivate, markAttendance } = useWorkers()
  const [tab, setTab] = useState('profile')
  const [editOpen, setEditOpen] = useState(false)
  const [calView, setCalView] = useState('calendar')
  const [attStatusFilter, setAttStatusFilter] = useState('all')

  const worker = workers.find((w) => w.id === workerId)
  if (!worker) return <EmptyState icon={UserCircle} title="Worker not found" description="This worker does not exist." />

  const workerAttendance = useMemo(
    () => attendance.filter((a) => a.workerId === workerId),
    [attendance, workerId]
  )

  // Compute pay estimate for current calendar month
  const payEstimate = useMemo(() => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthEntries = workerAttendance.filter((a) => a.date.startsWith(monthStr))
    const present = monthEntries.filter((a) => a.status === 'present').length
    const half = monthEntries.filter((a) => a.status === 'half_day').length
    const overtime = monthEntries.reduce((s, a) => s + (a.overtimeHours || 0), 0)
    const dailySalary = dailySalaryFromMonthly(worker.monthlySalary, now.getFullYear(), now.getMonth(), worker.weekOffDay)
    const otRate = worker.overtimeRates || 0
    const total = present * dailySalary + half * 0.5 * dailySalary + overtime * otRate
    return { present, half, overtime, total, dailySalary, otRate }
  }, [workerAttendance, worker])

  // Filtered attendance list (for list view)
  const filteredAttendance = useMemo(() => {
    let list = [...workerAttendance].sort((a, b) => b.date.localeCompare(a.date))
    if (attStatusFilter !== 'all') list = list.filter((a) => a.status === attStatusFilter)
    return list
  }, [workerAttendance, attStatusFilter])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/workers" className="hover:text-oven-amber">Workers</Link>
        <span>/</span>
        <span className="text-espresso">{worker.name}</span>
      </div>

      <PageHeader
        eyebrow="Workspace / Worker"
        title={worker.name}
        description={`${worker.roles.map((r) => roleConfig[r].label).join(', ')} · ${worker.status === 'active' ? 'Active' : 'Left'}`}
        actions={<>
          <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
          {worker.status === 'active'
            ? <Button variant="danger" onClick={() => markLeft(worker.id)}>Mark as Left</Button>
            : <Button onClick={() => reactivate(worker.id)}>Reactivate</Button>
          }
        </>}
      />

      {/* Header card */}
      <div className="mb-6 rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <WorkerAvatar photo={worker.photo} name={worker.name} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-espresso">{worker.name}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${worker.status === 'active' ? 'bg-matcha-glaze/15 text-matcha-glaze' : 'bg-espresso/8 text-espresso/50'}`}>
                {worker.status === 'active' ? 'Active' : 'Left'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {worker.roles.map((r) => <RoleBadge key={r} role={r} />)}
            </div>
            <div className="mt-3">
              <p className="text-xs text-espresso/40">Aadhaar</p>
              <AadhaarDisplay number={worker.aadhaarNumber} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 inline-flex rounded-full bg-crust p-0.5">
        <button onClick={() => setTab('profile')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${tab === 'profile' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>
          <UserCircle className="h-3.5 w-3.5" /> Profile
        </button>
        <button onClick={() => setTab('attendance')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${tab === 'attendance' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>
          <CalendarDays className="h-3.5 w-3.5" /> Attendance
        </button>
      </div>

      {tab === 'profile' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
            <h3 className="mb-4 font-display text-lg font-semibold text-espresso">Contact & details</h3>
            <div className="space-y-3">
              <InlineField label="Phone" value={worker.phone} onSave={(v) => updateWorker(worker.id, { phone: v })} />
              <InlineField label="Address" value={worker.address} onSave={(v) => updateWorker(worker.id, { address: v })} />
              <div>
                <p className="text-xs text-espresso/40">Joining date</p>
                <p className="text-sm font-medium text-espresso">{new Date(worker.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              {worker.leftDate && (
                <div>
                  <p className="text-xs text-espresso/40">Left date</p>
                  <p className="text-sm font-medium text-espresso">{new Date(worker.leftDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
            <h3 className="mb-4 font-display text-lg font-semibold text-espresso">Pay & shift terms</h3>
            <div className="space-y-3">
              <InlineField label="Monthly salary" value={worker.monthlySalary} onSave={(v) => updateWorker(worker.id, { monthlySalary: Number(v) || 0 })} type="number" suffix="₹" />
              <InlineField label="Overtime rate" value={worker.overtimeRates} onSave={(v) => updateWorker(worker.id, { overtimeRates: Number(v) || 0 })} type="number" suffix="₹/hr" />
              <InlineField label="Shift start" value={worker.shiftStart} onSave={(v) => updateWorker(worker.id, { shiftStart: v })} type="time" />
              <InlineField label="Shift end" value={worker.shiftEnd} onSave={(v) => updateWorker(worker.id, { shiftEnd: v })} type="time" />
              <div>
                <p className="text-xs text-espresso/40">Week off</p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {dayNames.map((d) => (
                    <button key={d} onClick={() => updateWorker(worker.id, { weekOffDay: d })} className={`rounded-lg border px-2 py-1 text-xs font-medium transition ${worker.weekOffDay === d ? 'border-oven-amber/40 bg-oven-amber/15 text-oven-amber' : 'border-espresso/10 bg-crust/20 text-espresso/50 hover:bg-crust/40'}`}>{d.slice(0, 3)}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pay estimate card */}
          <div className="rounded-bakery border border-oven-amber/20 bg-oven-amber/5 p-5 shadow-bakery lg:col-span-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-oven-amber" />
              <h3 className="font-display text-lg font-semibold text-espresso">Pay estimate — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><p className="text-xs text-espresso/50">Present days</p><p className="font-mono text-lg font-bold text-espresso">{payEstimate.present}</p><p className="text-xs text-espresso/40">{payEstimate.present} × ₹{payEstimate.dailySalary.toFixed(0)}</p></div>
              <div><p className="text-xs text-espresso/50">Half days</p><p className="font-mono text-lg font-bold text-espresso">{payEstimate.half}</p><p className="text-xs text-espresso/40">{payEstimate.half} × ₹{(payEstimate.dailySalary * 0.5).toFixed(0)}</p></div>
              <div><p className="text-xs text-espresso/50">Overtime</p><p className="font-mono text-lg font-bold text-espresso">{payEstimate.overtime}h</p><p className="text-xs text-espresso/40">{payEstimate.overtime} × ₹{payEstimate.otRate}</p></div>
              <div className="rounded-bakery bg-oven-amber/15 p-3"><p className="text-xs text-espresso/50">Estimated total</p><p className="font-mono text-2xl font-bold text-oven-amber">₹{payEstimate.total.toLocaleString('en-IN')}</p></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div>
          {/* Filter row */}
          <div className="mb-4 flex flex-col gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-full bg-crust p-0.5">
              <button onClick={() => setCalView('calendar')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${calView === 'calendar' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>Calendar</button>
              <button onClick={() => setCalView('list')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${calView === 'list' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>List</button>
            </div>
            <div className="inline-flex rounded-full bg-crust p-0.5">
              <button onClick={() => setAttStatusFilter('all')} className={`rounded-full px-3 py-1 text-xs font-medium transition ${attStatusFilter === 'all' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>All</button>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button key={key} onClick={() => setAttStatusFilter(key)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${attStatusFilter === key ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>{cfg.label}</button>
              ))}
            </div>
          </div>

          {calView === 'calendar' ? (
            <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
              <AttendanceCalendar workerId={workerId} attendance={attendance} onMark={(date, data) => markAttendance(workerId, date, data)} weekOffDay={worker.weekOffDay} />
            </div>
          ) : (
            <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
              {filteredAttendance.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No entries" description="No attendance records match this filter." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((a) => {
                      const cfg = statusConfig[a.status]
                      return (
                        <tr key={a.id} className="border-b border-espresso/8 last:border-0">
                          <td className="px-4 py-3 text-espresso/80">{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.fill.replace('bg-', 'text-').split(' ')[0]}`}><span className={`h-2 w-2 rounded-full ${cfg.dot}`} />{cfg.label}</span></td>
                          <td className="px-4 py-3 font-mono text-espresso/70">{a.overtimeHours > 0 ? `${a.overtimeHours}h` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      <EditWorkerModal open={editOpen} onClose={() => setEditOpen(false)} worker={worker} />
    </div>
  )
}
