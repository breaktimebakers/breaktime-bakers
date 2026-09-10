// Keep in sync with server/src/modules/sales/storeVisitNote.validation.js
// (VISIT_REASON_CODES) - these are the "why no order today" outcomes an
// order taker can log for a store visit instead of an order.
export const VISIT_REASONS = {
  STORE_CLOSED: { label: 'Store closed' },
  OWNER_UNAVAILABLE: { label: 'Owner/person unavailable' },
  COME_LATER: { label: 'Asked to visit later' },
  NO_ORDER_REQUIRED: { label: 'No order required' },
  STOCK_AVAILABLE: { label: 'Existing stock available' },
  VISIT_SKIPPED: { label: 'Visit skipped' },
  OTHER: { label: 'Other' },
}

export const VISIT_REASON_KEYS = Object.keys(VISIT_REASONS)
