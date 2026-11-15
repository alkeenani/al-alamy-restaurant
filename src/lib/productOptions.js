const DEFAULT_MISSING_MESSAGE =
  'يرجى اختيار جميع الخيارات المطلوبة قبل الإضافة.'
const INVALID_PRICE_MESSAGE =
  'السعر غير متاح لهذه التركيبة. يرجى اختيار تركيبة أخرى.'

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function isFinitePrice(value) {
  return isFiniteNumber(value) && value >= 0
}

export function getProductOptionGroups(product) {
  return Array.isArray(product.options) ? product.options : []
}

export function findOptionValue(group, valueId) {
  return group?.values?.find((value) => value.id === valueId) ?? null
}

export function getSelectedOptions(product, selections = {}) {
  return getProductOptionGroups(product).flatMap((group) => {
    const value = findOptionValue(group, selections[group.id])

    if (!value) {
      return []
    }

    return [
      {
        groupId: group.id,
        groupLabel: group.label,
        valueId: value.id,
        label: value.label,
      },
    ]
  })
}

export function getMissingOptionGroups(product, selections = {}) {
  return getProductOptionGroups(product).filter(
    (group) =>
      group.required !== false && !findOptionValue(group, selections[group.id]),
  )
}

export function buildSelectionKey(selectedOptions) {
  if (selectedOptions.length === 0) {
    return 'base'
  }

  return selectedOptions
    .map((option) => `${option.groupId}:${option.valueId}`)
    .join('|')
}

export function buildCartKey(productId, selectedOptions) {
  return `${productId}::${buildSelectionKey(selectedOptions)}`
}

export function formatOptionsSummary(options, separator = '، ') {
  return options.map((option) => option.label).join(separator)
}

export function buildMissingOptionsMessage(groupLabels) {
  if (groupLabels.length === 0) {
    return DEFAULT_MISSING_MESSAGE
  }

  return `يرجى اختيار ${groupLabels.join(' و')} أولاً.`
}

function getGroupPricingMode(group, value) {
  if (group.priceMode) {
    return group.priceMode
  }

  if (isFinitePrice(value.price)) {
    return 'absolute'
  }

  if (isFiniteNumber(value.priceDelta)) {
    return 'adjustment'
  }

  return 'none'
}

export function getProductPriceQuote(product, selections = {}) {
  const selectedOptions = getSelectedOptions(product, selections)
  const missingGroups = getMissingOptionGroups(product, selections)

  if (missingGroups.length > 0) {
    return {
      isValid: false,
      price: null,
      selectedOptions,
      missingGroups,
      message: buildMissingOptionsMessage(
        missingGroups.map((group) => group.label),
      ),
    }
  }

  const selectionKey = buildSelectionKey(selectedOptions)
  const configuredCombinationPrice = product.priceMatrix?.[selectionKey]

  if (isFinitePrice(configuredCombinationPrice)) {
    return {
      isValid: true,
      price: configuredCombinationPrice,
      selectedOptions,
      missingGroups: [],
      message: '',
    }
  }

  let absolutePrice = null
  let absolutePriceGroups = 0
  let adjustment = 0

  const optionGroups = getProductOptionGroups(product)

  // When multiple option groups exist, a valid explicit combination price is required.
  if (optionGroups.length > 1 && !isFinitePrice(configuredCombinationPrice)) {
    return {
      isValid: false,
      price: null,
      selectedOptions,
      missingGroups: [],
      message: INVALID_PRICE_MESSAGE,
    }
  }

  for (const group of optionGroups) {
    const value = findOptionValue(group, selections[group.id])

    if (!value) {
      continue
    }

    const pricingMode = getGroupPricingMode(group, value)

    if (pricingMode === 'absolute') {
      if (!isFinitePrice(value.price)) {
        return {
          isValid: false,
          price: null,
          selectedOptions,
          missingGroups: [],
          message: INVALID_PRICE_MESSAGE,
        }
      }

      absolutePrice = value.price
      absolutePriceGroups += 1
    } else if (pricingMode === 'adjustment') {
      if (!isFiniteNumber(value.priceDelta)) {
        return {
          isValid: false,
          price: null,
          selectedOptions,
          missingGroups: [],
          message: INVALID_PRICE_MESSAGE,
        }
      }

      adjustment += value.priceDelta
    }
  }

  if (absolutePriceGroups > 1) {
    return {
      isValid: false,
      price: null,
      selectedOptions,
      missingGroups: [],
      message: INVALID_PRICE_MESSAGE,
    }
  }

  const basePrice = absolutePrice ?? product.price

  if (!isFinitePrice(basePrice)) {
    return {
      isValid: false,
      price: null,
      selectedOptions,
      missingGroups: [],
      message: INVALID_PRICE_MESSAGE,
    }
  }

  const price = basePrice + adjustment

  if (!isFinitePrice(price)) {
    return {
      isValid: false,
      price: null,
      selectedOptions,
      missingGroups: [],
      message: INVALID_PRICE_MESSAGE,
    }
  }

  return {
    isValid: true,
    price,
    selectedOptions,
    missingGroups: [],
    message: '',
  }
}

export function getOptionPricePrompt(missingGroups) {
  if (missingGroups.length === 0) {
    return 'اختر الخيارات'
  }

  if (missingGroups.length === 1) {
    return `اختر ${missingGroups[0].label}`
  }

  return 'اختر الخيارات'
}
