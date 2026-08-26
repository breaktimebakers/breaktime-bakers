import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useCreateLot } from "@/features/inventory/hooks";
import { uploadReceipt } from "@/lib/uploadReceipt";
import { Button, Field, Modal, ReceiptDropzone, inputClass } from "@/components/shared";
import { todayISO } from "@/utils";

const makeEmptyForm = () => ({
  qty: "",
  rate: "",
  vendor: "",
  purchaseDate: todayISO(),
  receipt: null,
});

export function RestockModal({ open, onClose, material }) {
  const createLot = useCreateLot();
  const [form, setForm] = useState(makeEmptyForm);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!material || !form.qty) return;
    setError("");

    try {
      const receiptKey = form.receipt ? await uploadReceipt(form.receipt) : undefined;

      await createLot.mutateAsync({
        materialId: material.id,
        body: {
          qty: form.qty,
          rate: form.rate || 0,
          vendor: form.vendor || undefined,
          purchaseDate: form.purchaseDate,
          receiptKey,
        },
      });
      setForm(makeEmptyForm());
      onClose();
    } catch (err) {
      setError(err.message || "Could not add lot.");
    }
  };

  const busy = createLot.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Restock"
      title={material ? `Restock ${material.name}` : ""}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Adding…" : "Add lot"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity" required>
          <input
            type="number"
            className={inputClass}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
          />
        </Field>
        <Field label="Rate (₹)" required>
          <input
            type="number"
            className={inputClass}
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
          />
        </Field>
        <Field label="Vendor">
          <input
            className={inputClass}
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
          />
        </Field>
        <Field label="Purchase date">
          <input
            type="date"
            className={inputClass}
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />
        </Field>
        <div className="col-span-2">
          <Field label="Purchase receipt">
            <ReceiptDropzone
              value={form.receipt}
              onChange={(v) => setForm({ ...form, receipt: v })}
            />
          </Field>
        </div>
        {error && (
          <div className="col-span-2 flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
