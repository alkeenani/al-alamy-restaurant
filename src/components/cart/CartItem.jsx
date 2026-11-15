import { MinusIcon, PlusIcon, TrashIcon } from '../common/Icons.jsx'
import { getCartLineLabel } from '../../lib/cart.js'
import { formatPrice } from '../../lib/formatPrice.js'
import './CartItem.css'

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const itemLabel = getCartLineLabel(item)

  return (
    <li className="cart-item" data-cart-key={item.key}>
      <div className="cart-item__header">
        <div className="cart-item__details">
          <p className="cart-item__category">{item.categoryLabel}</p>
          <h3 className="cart-item__name">{item.name}</h3>
          {item.options.length > 0 ? (
            <dl className="cart-item__options" aria-label="الخيارات المحددة">
              {item.options.map((option) => (
                <div
                  className="cart-item__option"
                  key={`${option.groupId}:${option.valueId}`}
                >
                  <dt>{option.groupLabel}</dt>
                  <dd>{option.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="cart-item__unit">
            سعر الوحدة: {formatPrice(item.unitPrice)}
          </p>
        </div>
        <button
          type="button"
          className="cart-item__remove"
          aria-label={`إزالة ${itemLabel} من السلة`}
          onClick={() => onRemove(item.key)}
        >
          <TrashIcon />
          <span>إزالة</span>
        </button>
      </div>
      <div className="cart-item__footer">
        <div
          className="quantity-control"
          role="group"
          aria-label={`الكمية: ${itemLabel}`}
        >
          <button
            type="button"
            aria-label={`تقليل كمية ${itemLabel}`}
            onClick={() => onDecrease(item.key)}
          >
            <MinusIcon />
          </button>
          <span className="quantity-control__value" aria-live="polite">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={`زيادة كمية ${itemLabel}`}
            onClick={() => onIncrease(item.key)}
          >
            <PlusIcon />
          </button>
        </div>
        <p className="cart-item__subtotal">
          <span>المجموع</span>
          <strong>{formatPrice(item.subtotal)}</strong>
        </p>
      </div>
    </li>
  )
}

export default CartItem
