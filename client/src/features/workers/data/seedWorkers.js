import { daysAgo } from '@/utils'
import { dayNames } from '../utils/salary'

export const seedWorkers = [
  { id: 'w1', name: 'Ramesh Yadav', address: 'Saki Naka, Andheri East, Mumbai', phone: '9876543210', aadhaarNumber: '123456789012', photo: '', joiningDate: daysAgo(120), leftDate: null, status: 'active', roles: ['chef'], monthlySalary: 13500, overtimeRates: 60, shiftStart: '06:00', shiftEnd: '14:00', weekOffDay: 'Sunday' },
  { id: 'w2', name: 'Sunita Devi', address: 'Bhandup West, Mumbai', phone: '9820011223', aadhaarNumber: '234567890123', photo: '', joiningDate: daysAgo(90), leftDate: null, status: 'active', roles: ['labour'], monthlySalary: 10500, overtimeRates: 45, shiftStart: '07:00', shiftEnd: '15:00', weekOffDay: 'Sunday' },
  { id: 'w3', name: 'Imran Khan', address: 'Kurla West, Mumbai', phone: '9934567890', aadhaarNumber: '345678901234', photo: '', joiningDate: daysAgo(200), leftDate: null, status: 'active', roles: ['labour', 'delivery'], monthlySalary: 11500, overtimeRates: 50, shiftStart: '08:00', shiftEnd: '16:00', weekOffDay: 'Tuesday' },
  { id: 'w4', name: 'Priya Sharma', address: 'Goregaon West, Mumbai', phone: '9001234567', aadhaarNumber: '456789012345', photo: '', joiningDate: daysAgo(60), leftDate: null, status: 'active', roles: ['marketer'], monthlySalary: 12000, overtimeRates: 55, shiftStart: '09:00', shiftEnd: '17:00', weekOffDay: 'Sunday' },
  { id: 'w5', name: 'Dinesh Patel', address: 'Vikhroli East, Mumbai', phone: '9009876543', aadhaarNumber: '567890123456', photo: '', joiningDate: daysAgo(45), leftDate: null, status: 'active', roles: ['chef'], monthlySalary: 14500, overtimeRates: 65, shiftStart: '05:00', shiftEnd: '13:00', weekOffDay: 'Sunday' },
  { id: 'w6', name: 'Kavita Nair', address: 'Mulund West, Mumbai', phone: '9870012345', aadhaarNumber: '678901234567', photo: '', joiningDate: daysAgo(30), leftDate: null, status: 'active', roles: ['labour'], monthlySalary: 10800, overtimeRates: 48, shiftStart: '07:00', shiftEnd: '15:00', weekOffDay: 'Sunday' },
  { id: 'w7', name: 'Anil Joseph', address: 'Dadar East, Mumbai', phone: '9812345678', aadhaarNumber: '789012345678', photo: '', joiningDate: daysAgo(300), leftDate: daysAgo(15), status: 'left', roles: ['delivery'], monthlySalary: 11000, overtimeRates: 50, shiftStart: '08:00', shiftEnd: '16:00', weekOffDay: 'Sunday' },
  { id: 'w8', name: 'Mohan Reddy', address: 'Powai, Mumbai', phone: '9844556677', aadhaarNumber: '890123456789', photo: '', joiningDate: daysAgo(75), leftDate: null, status: 'active', roles: ['chef', 'marketer'], monthlySalary: 15000, overtimeRates: 70, shiftStart: '06:00', shiftEnd: '14:00', weekOffDay: 'Sunday' },
]

const generateSeedAttendance = () => {
  const entries = []
  const statuses = ['present', 'present', 'present', 'present', 'absent', 'half_day']
  let entryId = 1
  seedWorkers.forEach((w) => {
    for (let i = 0; i < 45; i++) {
      if (w.status === 'left' && i < 15) continue
      const dateObj = new Date()
      dateObj.setDate(dateObj.getDate() - i)
      const dow = dateObj.getDay()
      if (dayNames[dow] === w.weekOffDay) continue
      if (Math.random() > 0.85) continue
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const overtimeHours = (status === 'present' || status === 'half_day') && Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0
      entries.push({ id: 'a' + entryId++, workerId: w.id, date: daysAgo(i), status, overtimeHours })
    }
  })
  return entries
}

export const seedAttendance = generateSeedAttendance()
