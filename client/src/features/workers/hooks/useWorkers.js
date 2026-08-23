import { useQueryClient } from '@tanstack/react-query'
import { useLocalQuery, setLocalData } from '@/lib/localStore'
import { seedWorkers, seedAttendance } from '../data/seedWorkers'

const KEYS = {
  workers: ['local', 'workers', 'workers'],
  attendance: ['local', 'workers', 'attendance'],
}

export function useWorkers() {
  const queryClient = useQueryClient()
  const { data: workers = [] } = useLocalQuery(KEYS.workers, seedWorkers)
  const { data: attendance = [] } = useLocalQuery(KEYS.attendance, seedAttendance)

  const addWorker = (data) => {
    const id = 'w' + Date.now()
    setLocalData(queryClient, KEYS.workers, (p) => [...p, {
      id,
      name: data.name,
      address: data.address || '',
      phone: data.phone || '',
      aadhaarNumber: data.aadhaarNumber || '',
      photo: data.photo || '',
      joiningDate: data.joiningDate || new Date().toISOString().slice(0, 10),
      leftDate: null,
      status: 'active',
      roles: data.roles || [],
      monthlySalary: Number(data.monthlySalary) || 0,
      overtimeRates: Number(data.overtimeRates) || 0,
      shiftStart: data.shiftStart || '08:00',
      shiftEnd: data.shiftEnd || '16:00',
      weekOffDay: data.weekOffDay || 'Sunday',
    }])
  }

  const updateWorker = (id, data) => {
    setLocalData(queryClient, KEYS.workers, (p) => p.map((w) => w.id === id ? { ...w, ...data } : w))
  }

  const markLeft = (id) => {
    setLocalData(queryClient, KEYS.workers, (p) => p.map((w) => w.id === id ? { ...w, status: 'left', leftDate: new Date().toISOString().slice(0, 10) } : w))
  }

  const reactivate = (id) => {
    setLocalData(queryClient, KEYS.workers, (p) => p.map((w) => w.id === id ? { ...w, status: 'active', leftDate: null } : w))
  }

  const deleteWorker = (id) => {
    setLocalData(queryClient, KEYS.workers, (p) => p.filter((w) => w.id !== id))
    setLocalData(queryClient, KEYS.attendance, (p) => p.filter((a) => a.workerId !== id))
  }

  const markAttendance = (workerId, date, data) => {
    setLocalData(queryClient, KEYS.attendance, (p) => {
      const existing = p.find((a) => a.workerId === workerId && a.date === date)
      if (data.status === 'clear') {
        return p.filter((a) => a.id !== existing?.id)
      }
      if (existing) {
        return p.map((a) => a.id === existing.id ? { ...a, status: data.status, overtimeHours: Number(data.overtimeHours) || 0 } : a)
      }
      return [...p, { id: 'a' + Date.now() + Math.random(), workerId, date, status: data.status, overtimeHours: Number(data.overtimeHours) || 0 }]
    })
  }

  const deleteAttendanceEntry = (workerId, date) => {
    setLocalData(queryClient, KEYS.attendance, (p) => p.filter((a) => !(a.workerId === workerId && a.date === date)))
  }

  return { workers, attendance, addWorker, updateWorker, markLeft, reactivate, deleteWorker, markAttendance, deleteAttendanceEntry }
}
