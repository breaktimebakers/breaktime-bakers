export function OrderProductsTable({ order, id }) {
  const items = order.items || []
  const formatCurrency = (value) => `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
  const hasCompletePricing = items.every((item) => item.pricePerUnit !== null && item.pricePerUnit !== undefined)
  const orderTotal = hasCompletePricing
    ? items.reduce((total, item) => total + Number(item.quantity) * Number(item.pricePerUnit), 0)
    : null

  return (
    <div id={id}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">
          Order products — {order.storeName}
        </p>
        <span className="font-mono text-[10px] uppercase tracking-wider text-espresso/40">
          {items.length} {items.length === 1 ? 'product' : 'products'}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-espresso/8 bg-crust/20">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Products ordered for {order.storeName}</caption>
          <thead>
            <tr className="text-espresso/40">
              <th scope="col" className="px-3 py-2 font-mono text-[10px] uppercase">Product</th>
              <th scope="col" className="px-3 py-2 text-right font-mono text-[10px] uppercase">Quantity</th>
              <th scope="col" className="px-3 py-2 text-right font-mono text-[10px] uppercase">Rate</th>
              <th scope="col" className="px-3 py-2 text-right font-mono text-[10px] uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const hasPrice = item.pricePerUnit !== null && item.pricePerUnit !== undefined
              const lineAmount = hasPrice ? Number(item.quantity) * Number(item.pricePerUnit) : null

              return (
                <tr key={item.id} className="border-t border-espresso/5">
                  <td className="break-words px-3 py-2 text-espresso/70">{item.productName}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums text-espresso/70">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums text-espresso/50">
                    {hasPrice ? formatCurrency(item.pricePerUnit) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-medium tabular-nums text-espresso">
                    {lineAmount === null ? '—' : formatCurrency(lineAmount)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-espresso/8 font-medium text-espresso">
              <th scope="row" className="px-3 py-2">Order total</th>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{order.totalQty}</td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                {orderTotal === null ? '—' : formatCurrency(orderTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
