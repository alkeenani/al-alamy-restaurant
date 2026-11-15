import { buildCartKey, formatOptionsSummary } from './productOptions.js'

export function createCartLine(product, priceQuote, categoryLabel) {
  const selectedOptions = priceQuote.selectedOptions.map((option) => ({
    ...option,
  }))
  const unitPrice = priceQuote.price

  return {
    key: buildCartKey(product.id, selectedOptions),
    productId: product.id,
    name: product.name,
    category: product.category,
    categoryLabel,
    options: selectedOptions,
    unitPrice,
    quantity: 1,
    subtotal: unitPrice,
  }
}

export function addCartLine(items, line) {
  const existingItem = items.find((item) => item.key === line.key)

  if (!existingItem) {
    return [...items, line]
  }

  return items.map((item) => {
    if (item.key !== line.key) {
      return item
    }

    const quantity = item.quantity + 1

    return {
      ...item,
      quantity,
      subtotal: item.unitPrice * quantity,
    }
  })
}

export function updateCartLineQuantity(items, key, quantity) {
  if (quantity <= 0) {
    return items.filter((item) => item.key !== key)
  }

  return items.map((item) => {
    if (item.key !== key) {
      return item
    }

    return {
      ...item,
      quantity,
      subtotal: item.unitPrice * quantity,
    }
  })
}

export function getCartLineLabel(item) {
  const optionsSummary = formatOptionsSummary(item.options)

  return optionsSummary ? `${item.name} (${optionsSummary})` : item.name
}

export function getCartCount(items) {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export function getCartTotal(items) {
  return items.reduce((total, item) => total + item.subtotal, 0)
}
