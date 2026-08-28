import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarCheck, Search, Check, X, Clock } from 'lucide-react'
import { useWorkers, useAttendanceByDate, useAllAttendance, useMarkAttendance, useClearAttendance } from '@/features/workers/hooks'
import { dayNames, weekStartOf } from '@/features/workers/utils'
import { Button, EmptyState, Field, PageHeader, inputClass } from '@/components/shared'
import { RoleBadge } from '../components/RoleBadge'
import { WorkerAvatar } from '../components/PhotoCapture'

const statusConfig = {
  present: { label: 'Present', dot: 'bg-matcha-glaze', text: 'text-matcha-glaze', bg: 'bg-matcha-glaze/15' },
  absent: { label: 'Absent', dot: 'bg-cherry-compote', text: 'text-cherry-compote', bg: 'bg-cherry-compote/15' },
  half_day: { label: 'Half-day', dot: 'bg-toasted-sesame', text: 'text-toasted-sesame', bg: 'bg-toasted-sesame/15' },
  // A worker's week-off swapped onto today (set from their attendance
  // calendar - see AttendanceCalendar.jsx, where the actual swap is made).
  week_off: { label: 'Week off', dot: 'bg-espresso/40', text: 'text-espresso/60', bg: 'bg-espresso/10' },
}

export default function WorkerAttendance() {
  const todayStr = new Date().toISOString().slice(0, 10)
  const { data: workers = [] } = useWorkers()
  const { data: attendance = [] } = useAttendanceByDate(todayStr)
  const { data: allAttendance = [] } = useAllAttendance()
  const markAttendanceMutation = useMarkAttendance()
  const clearAttendanceMutation = useClearAttendance()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [overtimeModal, setOvertimeModal] = useState(null)

  const todayDow = dayNames[new Date().getDay()]

  const filtered = useMemo(() => {
    let list = workers.filter((w) => w.status === 'active')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((w) => w.name.toLowerCase().includes(q) || (w.phone || '').includes(q))
    }
    if (roleFilter !== 'all') list = list.filter((w) => w.roles.includes(roleFilter))
    return list
  }, [workers, search, roleFilter])

  // attendance is already scoped to today by useAttendanceByDate.
  const getTodayEntry = (workerId) => attendance.find((a) => a.workerId === workerId)

  // Whether today is this worker's day off - respects a "week_off" swap
  // for the week today falls in (see AttendanceCalendar.jsx), not just
  // their default weekOffDay. Needs allAttendance (not just today's
  // snapshot) since a swap is only visible by looking at the rest of the
  // week.
  const isOffToday = (worker) => {
    const overrideEntry = allAttendance.find(
      (a) => a.workerId === worker.id && a.status === 'week_off' && weekStartOf(a.date) === weekStartOf(todayStr),
    )
    return overrideEntry ? overrideEntry.date === todayStr : worker.weekOffDay === todayDow
  }

  // Workers who actually need marking today - off-today workers are
  // dropped from the list entirely. An explicit "week_off" entry for
  // today always hides them; any other recorded entry (present/absent/
  // half_day - e.g. called in on their day off) always keeps them
  // visible/editable rather than hiding a real record; with no entry yet,
  // fall back to isOffToday's default-or-swap computation.
  const workingToday = useMemo(
    () =>
      filtered.filter((w) => {
        const entry = getTodayEntry(w.id)
        if (entry) return entry.status !== 'week_off'
        return !isOffToday(w)
      }),
    [filtered, allAttendance, attendance, todayStr, todayDow],
  )

  const filteredWithStatus = useMemo(() => {
    if (statusFilter === 'all') return workingToday
    return workingToday.filter((w) => {
      const entry = getTodayEntry(w.id)
      if (statusFilter === 'unmarked') return !entry
      return entry?.status === statusFilter
    })
  }, [workingToday, statusFilter, attendance])

  const markPresent = (workerId) => {
    markAttendanceMutation.mutate({ workerId, date: todayStr, status: 'present', overtimeHours: 0 })
  }

  const markAbsent = (workerId) => {
    markAttendanceMutation.mutate({ workerId, date: todayStr, status: 'absent', overtimeHours: 0 })
  }

  const clearAttendance = (workerId) => {
    clearAttendanceMutation.mutate({ workerId, date: todayStr })
  }

  const openOvertime = (worker) => {
    const entry = getTodayEntry(worker.id)
    setOvertimeModal({ worker, overtimeHours: entry?.overtimeHours || '' })
  }

  const saveOvertime = () => {
    if (!overtimeModal) return
    markAttendanceMutation.mutate({ workerId: overtimeModal.worker.id, date: todayStr, status: 'present', overtimeHours: Number(overtimeModal.overtimeHours) || 0 })
    setOvertimeModal(null)
  }

  const presentCount = workingToday.filter((w) => getTodayEntry(w.id)?.status === 'present').length
  const absentCount = workingToday.filter((w) => getTodayEntry(w.id)?.status === 'absent').length
  const halfCount = workingToday.filter((w) => getTodayEntry(w.id)?.status === 'half_day').length
  const unmarkedCount = workingToday.filter((w) => !getTodayEntry(w.id)).length

  return (
    <div>
      <PageHeader eyebrow="Workspace / Attendance" title="Attendance" description={`Mark today's attendance — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`} />

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-matcha-glaze" /><p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Present</p></div>
          <p className="mt-1.5 font-mono text-2xl font-bold text-matcha-glaze">{presentCount}</p>
        </div>
        <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cherry-compote" /><p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Absent</p></div>
          <p className="mt-1.5 font-mono text-2xl font-bold text-cherry-compote">{absentCount}</p>
        </div>
        <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-toasted-sesame" /><p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Half-day</p></div>
          <p className="mt-1.5 font-mono text-2xl font-bold text-toasted-sesame">{halfCount}</p>
        </div>
        <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-espresso/30" /><p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Unmarked</p></div>
          <p className="mt-1.5 font-mono text-2xl font-bold text-espresso/50">{unmarkedCount}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative flex-1 lg:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/30" />
            <input className={`${inputClass} pl-9`} placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={`${inputClass} lg:w-36`} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="chef">Chef</option>
            <option value="labour">Labour</option>
            <option value="delivery">Delivery</option>
            <option value="marketer">Marketer</option>
          </select>
          <div className="inline-flex rounded-full bg-crust p-0.5">
            {['all', 'present', 'absent', 'half_day', 'unmarked'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${statusFilter === s ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>
                {s === 'half_day' ? 'Half-day' : s === 'unmarked' ? 'Unmarked' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredWithStatus.length === 0 && workers.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading workers...</p>
      ) : filteredWithStatus.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No workers found" description="Adjust your filters to see workers." />
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Worker</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Roles</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Week off</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Today</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithStatus.map((w) => {
                  const entry = getTodayEntry(w.id)
                  const cfg = entry ? statusConfig[entry.status] : null
                  const isWeekOff = isOffToday(w)
                  return (
                    <tr key={w.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <WorkerAvatar photo={w.photoUrl} name={w.name} size="sm" />
                          <Link to="/workers/$workerId" params={{ workerId: w.id }} className="font-medium text-espresso hover:text-oven-amber">{w.name}</Link>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {w.roles.map((r) => <RoleBadge key={r} role={r} />)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-espresso/60">
                        {w.weekOffDay}
                        {isWeekOff && <span className="ml-1.5 rounded-full bg-espresso/8 px-2 py-0.5 text-[10px] text-espresso/50">Today</span>}
                      </td>
                      <td className="px-4 py-3">
                        {cfg ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                            {entry.overtimeHours > 0 && <span className="font-mono">+{entry.overtimeHours}h</span>}
                          </span>
                        ) : isWeekOff ? (
                          <span className="text-xs text-espresso/40">Week off</span>
                        ) : (
                          <span className="text-xs text-espresso/40">Not marked</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {entry?.status !== 'present' && (
                            <button
                              onClick={() => markPresent(w.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-matcha-glaze/15 px-2.5 py-1.5 text-xs font-medium text-matcha-glaze hover:bg-matcha-glaze/25"
                              title="Mark present"
                            >
                              <Check className="h-3.5 w-3.5" /> Present
                            </button>
                          )}
                          {entry?.status !== 'absent' && (
                            <button
                              onClick={() => markAbsent(w.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-cherry-compote/10 px-2.5 py-1.5 text-xs font-medium text-cherry-compote hover:bg-cherry-compote/20"
                              title="Mark absent"
                            >
                              <X className="h-3.5 w-3.5" /> Absent
                            </button>
                          )}
                          {entry?.status === 'present' && (
                            <button
                              onClick={() => openOvertime(w)}
                              className="inline-flex items-center gap-1 rounded-lg border border-espresso/15 bg-crust/30 px-2.5 py-1.5 text-xs font-medium text-espresso/60 hover:bg-crust/50"
                              title="Add overtime"
                            >
                              <Clock className="h-3.5 w-3.5" /> OT
                            </button>
                          )}
                          {entry && (
                            <button
                              onClick={() => clearAttendance(w.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-espresso/40 hover:bg-espresso/5"
                              title="Clear"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overtime modal */}
      {overtimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setOvertimeModal(null)}>
          <div className="w-full max-w-sm rounded-bakery border border-espresso/10 bg-proof-cream p-5 shadow-bakery-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 font-display text-lg font-semibold text-espresso">Add overtime — {overtimeModal.worker.name}</h3>
            <p className="mb-4 text-xs text-espresso/50">Overtime hours for today ({new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})</p>
            <Field label="Overtime hours"><input type="number" className={inputClass} value={overtimeModal.overtimeHours} onChange={(e) => setOvertimeModal((m) => ({ ...m, overtimeHours: e.target.value }))} placeholder="0" autoFocus /></Field>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setOvertimeModal(null)}>Cancel</Button>
              <Button onClick={saveOvertime}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
