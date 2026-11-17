import { buildCartKey, formatOptionsSummary } from './productOptions.js'
import {
  fromPiastres,
  isFiniteMoneyNumber,
  multiplyMoneyByQuantity,
  normalizeQuantity,
  sumMoney,
  toPiastres,
} from './money.js'

function roundMoney(value) {
  const p = toPiastres(value)
  return p == null ? null : fromPiastres(p)
}

export function getCartLineTotals(item) {
  const unitPrice = roundMoney(item?.unitPrice)
  const quantity = normalizeQuantity(item?.quantity)
  const subtotal =
    unitPrice == null ? 0 : (multiplyMoneyByQuantity(unitPrice, quantity) ?? 0)
  return { unitPrice: unitPrice ?? 0, quantity, subtotal }
}

export function computeCartSummary(items) {
  const safeItems = Array.isArray(items) ? items : []
  const normalizedItems = safeItems.map((item) => {
    const totals = getCartLineTotals(item)
    return { ...item, ...totals }
  })
  const itemCount = normalizedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  )
  const total = sumMoney(normalizedItems.map((item) => item.subtotal)) ?? 0
  return { items: normalizedItems, itemCount, total }
}

export function createCartLine(product, priceQuote, categoryLabel) {
  if (!product || !priceQuote?.isValid || !isFiniteMoneyNumber(priceQuote.price)) {
    return null
  }
  const selectedOptions = (priceQuote.selectedOptions || []).map((option) => ({
    ...option,
  }))
  const unitPrice = roundMoney(priceQuote.price)
  if (unitPrice == null) return null

  return {
    key: buildCartKey(product.id, selectedOptions),
    productId: product.id,
    name: product.name,
    category: product.category,
    categoryLabel: categoryLabel || '',
    options: selectedOptions,
    unitPrice,
    quantity: 1,
    subtotal: unitPrice,
  }
}

export function addCartLine(items, line) {
  if (!line) return computeCartSummary(items).items
  const base = computeCartSummary(items).items
  const existingItem = base.find((item) => item.key === line.key)

  if (!existingItem) {
    return computeCartSummary([...base, line]).items
  }

  return computeCartSummary(
    base.map((item) =>
      item.key === line.key ? { ...item, quantity: item.quantity + 1 } : item,
    ),
  ).items
}

export function updateCartLineQuantity(items, key, quantity) {
  const qty = normalizeQuantity(quantity)
  const base = computeCartSummary(items).items
  if (qty <= 0) {
    return computeCartSummary(base.filter((item) => item.key !== key)).items
  }

  return computeCartSummary(
    base.map((item) => (item.key === key ? { ...item, quantity: qty } : item)),
  ).items
}

export function getCartLineLabel(item) {
  const optionsSummary = formatOptionsSummary(item?.options || [])
  return optionsSummary ? `${item.name} (${optionsSummary})` : (item?.name || '')
}

export function getCartCount(items) {
  return computeCartSummary(items).itemCount
}

export function getCartTotal(items) {
  return computeCartSummary(items).total
}
