import { useState } from 'react'
import {
  buildCartKey,
  formatOptionsSummary,
  getOptionPricePrompt,
  getProductOptionGroups,
  getProductPriceQuote,
} from '../../lib/productOptions.js'
import { MinusIcon, PlusIcon } from '../common/Icons.jsx'
import './ProductCard.css'

function ProductCard({
  product,
  cartItems,
  onAddToCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
}) {
  const [selections, setSelections] = useState({})
  const optionGroups = getProductOptionGroups(product)
  const hasSizeGroup = optionGroups.some((group) => group.kind === 'size')
  const isAvailable = product.isAvailable !== false
  const priceQuote = getProductPriceQuote(product, selections)
  const canAdd = isAvailable && priceQuote.isValid
  const cartKey = priceQuote.isValid
    ? buildCartKey(product.id, priceQuote.selectedOptions)
    : null
  const quantity =
    cartKey ?
      (cartItems.find((item) => item.key === cartKey)?.quantity ?? 0)
    : 0
  const optionsSummary = formatOptionsSummary(priceQuote.selectedOptions)
  const itemLabel =
    optionsSummary ? `${product.name} (${optionsSummary})` : product.name
  const optionHelpId = `${product.id}-option-help`
  const missingPrompt = getOptionPricePrompt(priceQuote.missingGroups)
  const hasPriceError =
    !priceQuote.isValid && priceQuote.missingGroups.length === 0

  function handleOptionSelect(groupId, valueId) {
    setSelections((current) => ({ ...current, [groupId]: valueId }))
  }

  function handleAdd() {
    if (!canAdd) return
    onAddToCart(product, priceQuote)
  }

  function handleIncrease() {
    if (!cartKey) return
    onIncreaseQuantity(cartKey)
  }

  function handleDecrease() {
    if (!cartKey) return
    onDecreaseQuantity(cartKey)
  }

  return (
    <article
      className="product-card"
      data-product-id={product.id}
      data-card-quantity={quantity}
    >
      <div className="product-card__body">
        <span
          className={`product-card__availability${isAvailable ? '' : ' product-card__availability--unavailable'}`}
        >
          <span className="product-card__availability-dot" aria-hidden="true" />
          {isAvailable ? 'متوفر' : 'غير متوفر'}
        </span>
        <h3 className="product-card__name">{product.name}</h3>

        <div className="product-card__options">
          {optionGroups.map((group) => (
            <div
              className="product-card__option-group"
              key={group.id}
              data-option-group={group.id}
            >
              <span className="product-card__option-label">
                {group.label}
              </span>
              <div
                className="product-card__option-values"
                role="group"
                aria-label={`${group.label} لـ ${product.name}`}
              >
                {group.values.map((value) => (
                  <button
                    key={value.id}
                    type="button"
                    className="product-card__option"
                    aria-pressed={selections[group.id] === value.id}
                    data-option-value={value.id}
                    onClick={() => handleOptionSelect(group.id, value.id)}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!hasSizeGroup ? (
            <p className="product-card__no-sizes">لا تتوفر أحجام مختلفة</p>
          ) : null}

          {hasPriceError ? (
            <p
              className="product-card__option-error"
              id={optionHelpId}
              role="alert"
            >
              {priceQuote.message}
            </p>
          ) : null}
        </div>

        {!priceQuote.isValid && !hasPriceError ? (
          <p className="visually-hidden" id={optionHelpId}>
            {priceQuote.message}
          </p>
        ) : null}
      </div>

      <div className="product-card__footer">
        <p className="product-card__price" aria-live="polite">
          {priceQuote.isValid ? (
            <>
              <span className="product-card__amount">{priceQuote.price}</span>
              <span className="product-card__currency">ج.م</span>
            </>
          ) : (
            <span className="product-card__price-prompt">
              {hasPriceError ? 'السعر غير متاح' : missingPrompt}
            </span>
          )}
        </p>

        {quantity > 0 ? (
          <div
            className="product-card__quantity"
            role="group"
            aria-label={`كمية ${itemLabel}`}
          >
            <button
              type="button"
              aria-label={`تقليل كمية ${itemLabel}`}
              onClick={handleDecrease}
            >
              <MinusIcon />
            </button>
            <span className="product-card__quantity-value" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              aria-label={`زيادة كمية ${itemLabel}`}
              onClick={handleIncrease}
            >
              <PlusIcon />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="product-card__add"
            disabled={!canAdd}
            aria-describedby={!priceQuote.isValid ? optionHelpId : undefined}
            onClick={handleAdd}
          >
            <PlusIcon />
            <span>{isAvailable ? 'إضافة للسلة' : 'غير متوفر'}</span>
          </button>
        )}
      </div>
    </article>
  )
}

export default ProductCard
