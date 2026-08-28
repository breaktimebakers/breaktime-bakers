import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Field, inputClass } from '@/components/shared'
import { weekStartOf } from '@/features/workers/utils'

const statusConfig = {
  present: { label: 'Present', dot: 'bg-matcha-glaze', fill: 'bg-matcha-glaze/20 text-matcha-glaze', border: 'border-matcha-glaze/40' },
  absent: { label: 'Absent', dot: 'bg-cherry-compote', fill: 'bg-cherry-compote/15 text-cherry-compote', border: 'border-cherry-compote/40' },
  half_day: { label: 'Half-day', dot: 'bg-toasted-sesame', fill: 'bg-toasted-sesame/15 text-toasted-sesame', border: 'border-toasted-sesame/40' },
  week_off: { label: 'Week off (swapped)', dot: 'bg-espresso/40', fill: 'bg-espresso/10 text-espresso/60', border: 'border-espresso/30' },
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AttendanceCalendar({ workerId, attendance, onMark, weekOffDay = 'Sunday' }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [editingDate, setEditingDate] = useState(null)
  const [editForm, setEditForm] = useState({ status: 'present', overtimeHours: '' })

  const workerAttendance = useMemo(
    () => attendance.filter((a) => a.workerId === workerId),
    [attendance, workerId]
  )

  const getEntry = (dateStr) => workerAttendance.find((a) => a.date === dateStr)

  // weekStart -> the date that's this week's swapped-in off day. A week
  // with an entry here no longer treats the default weekOffDay as off -
  // that day just becomes a normal (unmarked until marked) working day.
  const weekOffOverrides = useMemo(() => {
    const map = {}
    workerAttendance.forEach((a) => {
      if (a.status !== 'week_off') return
      const ws = weekStartOf(a.date)
      if (!map[ws] || a.date < map[ws]) map[ws] = a.date
    })
    return map
  }, [workerAttendance])

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewMonth.year, viewMonth.month, 1).getDay()

  const prevMonth = () => setViewMonth((m) => {
    if (m.month === 0) return { year: m.year - 1, month: 11 }
    return { ...m, month: m.month - 1 }
  })
  const nextMonth = () => setViewMonth((m) => {
    if (m.month === 11) return { year: m.year + 1, month: 0 }
    return { ...m, month: m.month + 1 }
  })

  const openEditor = (dayNum) => {
    const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    const existing = getEntry(dateStr)
    setEditingDate(dateStr)
    setEditForm({ status: existing?.status || 'present', overtimeHours: existing?.overtimeHours || '' })
  }

  const saveEntry = () => {
    onMark(editingDate, editForm)
    setEditingDate(null)
  }

  const clearEntry = () => {
    onMark(editingDate, { status: 'clear' })
    setEditingDate(null)
  }

const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const cells = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-espresso">{monthNames[viewMonth.month]} {viewMonth.year}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-espresso/10 text-espresso/60 hover:bg-crust/40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-espresso/10 text-espresso/60 hover:bg-crust/40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {dayNames.map((dn) => (
          <div key={dn} className="pb-1 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/40">{dn}</div>
        ))}
        {cells.map((dayNum, i) => {
          if (dayNum === null) return <div key={'e' + i} />
          const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          const entry = getEntry(dateStr)
          const cfg = entry ? statusConfig[entry.status] : null
          const dateObj = new Date(viewMonth.year, viewMonth.month, dayNum)
          const overrideDate = weekOffOverrides[weekStartOf(dateStr)]
          const isWeekOff = overrideDate ? dateStr === overrideDate : fullDayNames[dateObj.getDay()] === weekOffDay
          return (
            <button
              key={dayNum}
              onClick={() => openEditor(dayNum)}
              className={`relative flex h-12 flex-col items-center justify-center rounded-lg border text-sm transition hover:border-oven-amber/40 ${cfg ? `${cfg.fill} ${cfg.border}` : isWeekOff ? 'border-espresso/8 bg-espresso/5 text-espresso/30 hover:bg-espresso/8' : 'border-espresso/8 bg-crust/20 text-espresso/60 hover:bg-crust/40'}`}
            >
              <span className="font-mono text-xs">{dayNum}</span>
              {entry && <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
              {!entry && isWeekOff && <span className="absolute bottom-1 text-[8px] text-espresso/30">OFF</span>}
              {entry?.overtimeHours > 0 && <span className="absolute right-1 top-1 font-mono text-[8px] text-espresso/50">+{entry.overtimeHours}h</span>}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-espresso/50">{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono text-espresso/30">OFF</span>
          <span className="text-xs text-espresso/50">Default week off ({weekOffDay})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[8px] text-espresso/50">+Nh</span>
          <span className="text-xs text-espresso/50">Overtime</span>
        </div>
      </div>

      {/* Inline editor popover */}
      {editingDate && (
        <div className="mt-4 rounded-bakery border border-espresso/10 bg-crust/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-espresso">{new Date(editingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</h4>
            <button onClick={() => setEditingDate(null)} className="text-xs text-espresso/40 hover:text-espresso">Close</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select className={inputClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half-day</option>
                <option value="week_off">Week off (swap from {weekOffDay})</option>
              </select>
            </Field>
            {(editForm.status === 'present' || editForm.status === 'half_day') && (
              <Field label="Overtime hours"><input type="number" className={inputClass} value={editForm.overtimeHours} onChange={(e) => setEditForm({ ...editForm, overtimeHours: e.target.value })} placeholder="0" /></Field>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={saveEntry}>Save</Button>
            {getEntry(editingDate) && <Button size="sm" variant="ghost" onClick={clearEntry}>Clear entry</Button>}
          </div>
        </div>
      )}
    </div>
  )
}

export { statusConfig }
