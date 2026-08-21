import { createContext, useState, useCallback } from 'react'
import { seedWorkers, seedAttendance } from '../data/seedWorkers'

export const WorkersContext = createContext(null)

export function WorkersProvider({ children }) {
  const [workers, setWorkers] = useState(seedWorkers)
  const [attendance, setAttendance] = useState(seedAttendance)

  const addWorker = useCallback((data) => {
    const id = 'w' + Date.now()
    setWorkers((p) => [...p, {
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
  }, [])

  const updateWorker = useCallback((id, data) => {
    setWorkers((p) => p.map((w) => w.id === id ? { ...w, ...data } : w))
  }, [])

  const markLeft = useCallback((id) => {
    setWorkers((p) => p.map((w) => w.id === id ? { ...w, status: 'left', leftDate: new Date().toISOString().slice(0, 10) } : w))
  }, [])

  const reactivate = useCallback((id) => {
    setWorkers((p) => p.map((w) => w.id === id ? { ...w, status: 'active', leftDate: null } : w))
  }, [])

  const deleteWorker = useCallback((id) => {
    setWorkers((p) => p.filter((w) => w.id !== id))
    setAttendance((p) => p.filter((a) => a.workerId !== id))
  }, [])

  const markAttendance = useCallback((workerId, date, data) => {
    setAttendance((p) => {
      const existing = p.find((a) => a.workerId === workerId && a.date === date)
      if (data.status === 'clear') {
        return p.filter((a) => a.id !== existing?.id)
      }
      if (existing) {
        return p.map((a) => a.id === existing.id ? { ...a, status: data.status, overtimeHours: Number(data.overtimeHours) || 0 } : a)
      }
      return [...p, { id: 'a' + Date.now() + Math.random(), workerId, date, status: data.status, overtimeHours: Number(data.overtimeHours) || 0 }]
    })
  }, [])

  const deleteAttendanceEntry = useCallback((workerId, date) => {
    setAttendance((p) => p.filter((a) => !(a.workerId === workerId && a.date === date)))
  }, [])

  return (
    <WorkersContext.Provider value={{
      workers, attendance,
      addWorker, updateWorker, markLeft, reactivate, deleteWorker, markAttendance, deleteAttendanceEntry,
    }}>
      {children}
    </WorkersContext.Provider>
  )
}
