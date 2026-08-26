import { Pencil, Trash2, Eye } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { RoleBadge } from './RoleBadge'
import { WorkerAvatar } from './PhotoCapture'

export function WorkerCard({ worker, onDelete }) {
  return (
    <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
      <div className="flex items-start gap-3">
        <WorkerAvatar photo={worker.photoUrl} name={worker.name} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-espresso">{worker.name}</h3>
          <p className="text-xs text-espresso/50">{worker.phone}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${worker.status === 'active' ? 'bg-matcha-glaze/15 text-matcha-glaze' : 'bg-espresso/8 text-espresso/50'}`}>
          {worker.status === 'active' ? 'Active' : 'Left'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {worker.roles.map((r) => <RoleBadge key={r} role={r} />)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><p className="text-espresso/40">Monthly salary</p><p className="font-mono font-semibold text-espresso">₹{worker.monthlySalary.toLocaleString('en-IN')}</p></div>
        <div><p className="text-espresso/40">Joined</p><p className="text-espresso/80">{new Date(worker.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Link to="/workers/$workerId" params={{ workerId: worker.id }}>
          <button className="inline-flex items-center gap-1.5 rounded-bakery bg-oven-amber px-3 py-1.5 text-xs font-medium text-espresso hover:bg-oven-amber/90">
            <Eye className="h-3.5 w-3.5" /> View
          </button>
        </Link>
        <Link to="/workers/$workerId" params={{ workerId: worker.id }}>
          <button className="inline-flex items-center gap-1.5 rounded-bakery border border-espresso/15 bg-crust/40 px-3 py-1.5 text-xs font-medium text-espresso hover:bg-sourdough/30">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </Link>
        <button
          onClick={() => onDelete(worker)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-bakery px-3 py-1.5 text-xs font-medium text-cherry-compote hover:bg-cherry-compote/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  )
}
