export function OrderProductsTable({ order, id }) {
  const items = order.items || []

  return (
    <div id={id} className="mx-auto w-full max-w-xl overflow-hidden rounded-bakery border border-espresso/10 bg-proof-cream">
      <div className="flex items-center justify-between gap-3 border-b border-espresso/10 bg-crust/40 px-4 py-3">
        <span className="text-sm font-semibold text-espresso">Order products</span>
        <span className="text-xs text-espresso/60">{items.length} products</span>
      </div>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Products ordered for {order.storeName}</caption>
        <thead>
          <tr className="text-xs text-espresso/50">
            <th scope="col" className="px-4 pb-2 pt-3 font-medium">Product</th>
            <th scope="col" className="px-4 pb-2 pt-3 text-right font-medium">Quantity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-espresso/5">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="break-words px-4 py-3 text-espresso/80">{item.productName}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-espresso">{item.quantity}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-espresso/10 bg-crust/30 font-semibold text-espresso">
            <th scope="row" className="px-4 py-3">Total quantity</th>
            <td className="px-4 py-3 text-right font-mono tabular-nums">{order.totalQty}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

