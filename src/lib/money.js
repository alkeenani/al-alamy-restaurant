export function isFiniteMoneyNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string' && value.trim() !== '') return Number.isFinite(Number(value))
  return false
}

export function toPiastres(value) {
  if (!isFiniteMoneyNumber(value)) return null
  return Math.round(Number(value) * 100)
}

export function fromPiastres(piastres) {
  if (!Number.isInteger(piastres)) return null
  return piastres / 100
}

export function normalizeQuantity(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) return 0
  return n
}

export function formatPrice(value) {
  if (!isFiniteMoneyNumber(value)) return '—'
  const amount = Number(value)
  const hasFraction = Math.round(amount * 100) % 100 !== 0
  return `${amount.toLocaleString('en-EG', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })} ج.م`
}

export function multiplyMoneyByQuantity(unitPrice, quantity) {
  const unitPiastres = toPiastres(unitPrice)
  const qty = normalizeQuantity(quantity)
  if (unitPiastres == null || qty <= 0) return null
  return fromPiastres(unitPiastres * qty)
}

export function sumMoney(values) {
  let total = 0
  for (const value of values) {
    const p = toPiastres(value)
    if (p == null) return null
    total += p
  }
  return fromPiastres(total)
}
