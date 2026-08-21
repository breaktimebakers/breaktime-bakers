import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { inputClass } from '@/components/shared'

export function InlineField({ label, value, onSave, type = 'text', suffix }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  const save = () => { onSave(val); setEditing(false) }
  const cancel = () => { setVal(value); setEditing(false) }

  if (editing) {
    return (
      <div>
        <p className="text-xs text-espresso/40">{label}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <input type={type} className={`${inputClass} max-w-[160px]`} value={val} onChange={(e) => setVal(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && save()} />
          {suffix && <span className="text-xs text-espresso/40">{suffix}</span>}
          <button onClick={save} className="flex h-7 w-7 items-center justify-center rounded-lg text-matcha-glaze hover:bg-matcha-glaze/10"><Check className="h-4 w-4" /></button>
          <button onClick={cancel} className="flex h-7 w-7 items-center justify-center rounded-lg text-espresso/40 hover:bg-espresso/5"><X className="h-4 w-4" /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-1.5">
      <div>
        <p className="text-xs text-espresso/40">{label}</p>
        <p className="text-sm font-medium text-espresso">{value}{suffix && <span className="text-xs text-espresso/40"> {suffix}</span>}</p>
      </div>
      <button onClick={() => { setVal(value); setEditing(true) }} className="opacity-0 transition group-hover:opacity-100">
        <Pencil className="h-3.5 w-3.5 text-espresso/30 hover:text-espresso" />
      </button>
    </div>
  )
}
