import { useContext } from 'react'
import { WorkersContext } from '../context/WorkersContext'

export function useWorkers() {
  const ctx = useContext(WorkersContext)
  if (!ctx) throw new Error('useWorkers must be used within WorkersProvider')
  return ctx
}
