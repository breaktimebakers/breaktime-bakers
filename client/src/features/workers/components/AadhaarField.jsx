import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass } from '@/components/shared'

export function maskAadhaar(num) {
  if (!num) return ''
  const digits = String(num).replace(/\D/g, '')
  if (digits.length <= 4) return 'XXXX XXXX ' + digits.padStart(4, '0')
  return 'XXXX XXXX ' + digits.slice(-4)
}

export function formatAadhaarInput(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 12)
  return digits.replace(/(\d{4})(\d{4})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
}

export function AadhaarField({ value, onChange, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-espresso/70">
        Aadhaar number{required && <span className="text-cherry-compote"> *</span>}
      </span>
      <input
        className={inputClass}
        value={value ? formatAadhaarInput(value) : ''}
        onChange={(e) => onChange?.(e.target.value.replace(/\s/g, ''))}
        placeholder="XXXX XXXX 1234"
        inputMode="numeric"
      />
    </label>
  )
}

export function AadhaarDisplay({ number }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="inline-flex items-center gap-2">
      <span className="font-mono text-sm text-espresso/80">
        {revealed ? formatAadhaarInput(number) : maskAadhaar(number)}
      </span>
      <button
        onClick={() => setRevealed((r) => !r)}
        className="text-espresso/40 hover:text-espresso"
        title={revealed ? 'Hide' : 'Show'}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
