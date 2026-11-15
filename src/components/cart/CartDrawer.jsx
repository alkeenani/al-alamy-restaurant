import { useEffect, useRef } from 'react'
import { formatPrice } from '../../lib/formatPrice.js'
import { CartIcon, CloseIcon, TrashIcon } from '../common/Icons.jsx'
import CartItem from './CartItem.jsx'
import CheckoutForm from './CheckoutForm.jsx'
import './CartDrawer.css'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function CartDrawer({
  isOpen,
  onClose,
  items,
  itemCount,
  total,
  onIncrease,
  onDecrease,
  onRemove,
  onClearCart,
  onBrowseMenu,
  showToast,
  returnFocusRef,
}) {
  const drawerRef = useRef(null)
  const closeButtonRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined

    const previouslyFocused = document.activeElement
    const returnFocusElement = returnFocusRef?.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function getFocusableElements() {
      return Array.from(
        drawerRef.current?.querySelectorAll(focusableSelector) ?? [],
      ).filter((element) => element.offsetParent !== null)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()

      if (focusableElements.length === 0) {
        event.preventDefault()
        drawerRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow

      const focusTarget =
        returnFocusElement ??
        (previouslyFocused instanceof HTMLElement ? previouslyFocused : null)

      focusTarget?.focus()
    }
  }, [isOpen, returnFocusRef])

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="cart-overlay" onClick={handleBackdropClick}>
      <aside
        ref={drawerRef}
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex="-1"
      >
        <div className="cart-drawer__header">
          <div>
            <p className="cart-drawer__eyebrow">طلبك</p>
            <h2 className="cart-drawer__title" id="cart-title">
              سلة المشتريات
            </h2>
          </div>
          <div className="cart-drawer__header-actions">
            {items.length > 0 ? (
              <button
                type="button"
                className="cart-drawer__clear"
                aria-label="تفريغ السلة"
                onClick={onClearCart}
              >
                <TrashIcon />
                <span className="cart-drawer__clear-label">تفريغ السلة</span>
              </button>
            ) : null}
            <button
              ref={closeButtonRef}
              type="button"
              className="cart-drawer__close"
              aria-label="إغلاق السلة"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty__icon">
                <CartIcon size={30} />
              </span>
              <h3 className="cart-empty__title">السلة فارغة</h3>
              <p className="cart-empty__text">
                أضف أصنافك المفضلة من المنيو ثم عد إلى هنا لإتمام الطلب.
              </p>
              <button
                type="button"
                className="cart-empty__button"
                onClick={onBrowseMenu}
              >
                تصفح المنيو
              </button>
            </div>
          ) : (
            <>
              <ul className="cart-list">
                {items.map((item) => (
                  <CartItem
                    key={item.key}
                    item={item}
                    onIncrease={onIncrease}
                    onDecrease={onDecrease}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
              <div className="cart-summary">
                <div className="cart-summary__row">
                  <span>عدد القطع</span>
                  <span>{itemCount}</span>
                </div>
                <div className="cart-summary__total">
                  <span>الإجمالي</span>
                  <strong>{formatPrice(total)}</strong>
                </div>
                <p className="cart-summary__note">
                  الأسعار تجريبية وستُحدّث لاحقاً.
                </p>
              </div>
              <CheckoutForm
                items={items}
                total={total}
                showToast={showToast}
              />
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

export default CartDrawer
