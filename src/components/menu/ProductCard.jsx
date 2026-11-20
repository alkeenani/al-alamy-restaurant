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

const WHATSAPP_PHONE = '201095445386'

function ProductCard({
  product,
  cartItems,
  onAddToCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
}) {
  const [selections, setSelections] = useState({})
  const isInquiryOnly = !!product.isInquiryOnly
  const optionGroups = isInquiryOnly ? [] : getProductOptionGroups(product)
  const hasSizeGroup = optionGroups.some((group) => group.kind === 'size')
  const isOrderable = product.isOrderable !== false
  const categoryUnavailable = product.categoryAvailable === false
  const priceQuote = isInquiryOnly
    ? { isValid: false, price: null, selectedOptions: [], missingGroups: [], message: '' }
    : getProductPriceQuote(product, selections)
  const canAdd = !isInquiryOnly && isOrderable && priceQuote.isValid
  const cartKey = !isInquiryOnly && priceQuote.isValid
    ? buildCartKey(product.id, priceQuote.selectedOptions)
    : null
  const quantity =
    cartKey
      ? (cartItems.find((item) => item.key === cartKey)?.quantity ?? 0)
      : 0
  const optionsSummary = formatOptionsSummary(priceQuote.selectedOptions)
  const itemLabel =
    optionsSummary ? `${product.name} (${optionsSummary})` : product.name
  const optionHelpId = `${product.id}-option-help`
  const missingPrompt = getOptionPricePrompt(priceQuote.missingGroups)
  const hasPriceError =
    !isInquiryOnly && !priceQuote.isValid && priceQuote.missingGroups.length === 0

  if (isInquiryOnly) {
    const message = `استفسار بخصوص خدمة: ${product.name}\nأرغب في معرفة السعر والتفاصيل المتاحة.`
    const whatsappHref = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`

    return (
      <article
        className={`product-card product-card--inquiry${!isOrderable ? ' product-card--unavailable' : ''}`}
        data-product-id={product.id}
      >
        <div className="product-card__body">
          <span className={`product-card__availability ${isOrderable ? 'product-card__availability--inquiry' : 'product-card__availability--unavailable'}`}>
            <span className="product-card__availability-dot" aria-hidden="true" />
            {isOrderable ? 'خدمة حسب الطلب' : 'غير متوفر حاليًا'}
          </span>
          <h3 className="product-card__name">{product.name}</h3>
          {product.description ? (
            <p className="product-card__description">{product.description}</p>
          ) : null}
        </div>

        <div className="product-card__footer">
          <p className="product-card__price" aria-live="polite">
            <span className="product-card__price-prompt">{isOrderable ? 'السعر يُحدد عند الاستفسار' : 'غير متوفر حاليًا'}</span>
          </p>
          {isOrderable ? (
            <a
              className="product-card__add product-card__whatsapp"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`استفسار عبر واتساب عن ${product.name}`}
            >
              <span>استفسار عبر واتساب</span>
            </a>
          ) : (
            <button type="button" className="product-card__add" disabled>
              <span>غير متوفر</span>
            </button>
          )}
        </div>
      </article>
    )
  }

  function handleOptionSelect(groupId, valueId) {
    setSelections((current) => ({ ...current, [groupId]: valueId }))
  }

  function handleAdd() {
    if (!canAdd) return
    onAddToCart(product, priceQuote)
  }

  function handleIncrease() {
    if (!cartKey || !isOrderable) return
    onIncreaseQuantity(cartKey)
  }

  function handleDecrease() {
    if (!cartKey) return
    onDecreaseQuantity(cartKey)
  }

  return (
    <article
      className={`product-card${!isOrderable ? ' product-card--unavailable' : ''}`}
      data-product-id={product.id}
      data-card-quantity={quantity}
    >
      <div className="product-card__body">
        <span
          className={`product-card__availability${isOrderable ? '' : ' product-card__availability--unavailable'}`}
        >
          <span className="product-card__availability-dot" aria-hidden="true" />
          {isOrderable ? 'متوفر' : 'غير متوفر'}
        </span>
        <h3 className="product-card__name">{product.name}</h3>
        {product.description ? (
          <p className="product-card__description">{product.description}</p>
        ) : null}
        {!isOrderable && categoryUnavailable ? (
          <p className="product-card__unavailable-note">القسم غير متوفر حاليًا</p>
        ) : null}

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
                    disabled={!isOrderable}
                    onClick={() => handleOptionSelect(group.id, value.id)}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!hasSizeGroup ? (
            <p className="product-card__no-sizes">لا توجد أحجام متاحة</p>
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
              {!isOrderable ? 'غير متوفر' : hasPriceError ? 'السعر غير متاح' : missingPrompt}
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
              disabled={!isOrderable}
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
            <span>{isOrderable ? 'أضف للسلة' : 'غير متوفر'}</span>
          </button>
        )}
      </div>
    </article>
  )
}

export default ProductCard
