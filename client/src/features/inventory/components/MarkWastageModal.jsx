import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useRawMaterialLots, useMarkWastage } from '@/features/inventory/hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { formatCurrency, todayISO } from '@/utils'

const makeEmptyForm = (lot) => ({
  lotId: lot?.id || '',
  qty: '',
  date: todayISO(),
  note: '',
})

// `lot` is passed when opened from a specific lot row (pre-filled, no
// picker shown) and left undefined when opened from the material-level
// action (a <select> of in-stock lots is shown instead). Either way the
// admin always ends up picking one specific lot - there's no "just deduct
// from whichever lot" option, so the resulting expense is traceable to a
// real purchase cost, not an averaged one.
export function MarkWastageModal({ open, onClose, material, lot }) {
  const markWastage = useMarkWastage()
  const [form, setForm] = useState(() => makeEmptyForm(lot))
  const [error, setError] = useState('')

  const showPicker = !lot
  const { data: lots = [], isLoading: lotsLoading } = useRawMaterialLots(
    material?.id,
    { inStock: true },
    { enabled: open && showPicker },
  )

  useEffect(() => {
    if (open) setForm(makeEmptyForm(lot))
  }, [open, lot])

  const selectedLot = lot || lots.find((l) => l.id === form.lotId)
  const qtyNum = Number(form.qty) || 0
  const loss = selectedLot ? qtyNum * Number(selectedLot.unitCost) : 0
  const overCap = selectedLot && qtyNum > Number(selectedLot.remainingQty)

  const submit = async () => {
    if (!material || !selectedLot || !form.qty || qtyNum <= 0 || overCap) return
    setError('')

    try {
      await markWastage.mutateAsync({
        materialId: material.id,
        lotId: selectedLot.id,
        body: {
          qty: form.qty,
          date: form.date,
          note: form.note || undefined,
        },
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not mark wastage.')
    }
  }

  const busy = markWastage.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Wastage / Loss"
      title={material ? `Mark ${material.name} as spoiled` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !selectedLot || !form.qty || overCap}>
            {busy ? 'Saving…' : 'Mark wastage'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {showPicker ? (
          <div className="col-span-2">
            <Field label="Lot" required>
              <select
                className={inputClass}
                value={form.lotId}
                onChange={(e) => setForm({ ...form, lotId: e.target.value })}
                disabled={lotsLoading}
              >
                <option value="">{lotsLoading ? 'Loading lots…' : 'Select a lot'}</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.purchaseDate} · {l.remainingQty} {material.unit} left · {formatCurrency(l.unitCost)}/{material.unit}
                  </option>
                ))}
              </select>
            </Field>
            {!lotsLoading && lots.length === 0 && (
              <p className="mt-1 text-xs text-espresso/40">No in-stock lots to choose from.</p>
            )}
          </div>
        ) : (
          <div className="col-span-2 rounded-lg bg-crust/40 px-3 py-2 text-xs text-espresso/60">
            Lot: {lot.purchaseDate} · {lot.remainingQty} {material?.unit} left · {formatCurrency(lot.unitCost)}/{material?.unit}
          </div>
        )}

        <Field label="Quantity" required>
          <input
            type="number"
            className={inputClass}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
          />
          {overCap && (
            <p className="mt-1 text-xs text-cherry-compote">Exceeds this lot&apos;s remaining stock ({selectedLot.remainingQty}).</p>
          )}
        </Field>
        <Field label="Date" required>
          <input
            type="date"
            className={inputClass}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <div className="col-span-2">
          <Field label="Note">
            <input
              className={inputClass}
              placeholder="e.g. Eaten by rats"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
        </div>

        {selectedLot && qtyNum > 0 && !overCap && (
          <div className="col-span-2 rounded-lg bg-oven-amber/8 px-3 py-2 text-sm text-espresso/70">
            Loss: <span className="font-mono font-semibold text-espresso">{formatCurrency(loss)}</span>
          </div>
        )}

        {error && (
          <div className="col-span-2 flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
