import { useRef, useState } from 'react'
import CartDrawer from '../components/cart/CartDrawer.jsx'
import ToastViewport from '../components/common/ToastViewport.jsx'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import Hero from '../components/layout/Hero.jsx'
import MenuSection from '../components/menu/MenuSection.jsx'
import { useToasts } from '../hooks/useToasts.js'
import {
  addCartLine,
  computeCartSummary,
  createCartLine,
  getCartLineLabel,
  updateCartLineQuantity,
} from '../lib/cart.js'
import { formatOptionsSummary } from '../lib/productOptions.js'

function Home() {
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const cartTriggerRef = useRef(null)
  const { toasts, showToast } = useToasts()

  const cartSummary = computeCartSummary(cartItems)
  const cartCount = cartSummary.itemCount
  const cartTotal = cartSummary.total

  function handleAddToCart(product, priceQuote) {
    if (!priceQuote.isValid) return

    const line = createCartLine(
      product,
      priceQuote,
      product.categoryLabel || '',
    )
    if (!line) return

    setCartItems((items) => addCartLine(items, line))

    const optionsSummary = formatOptionsSummary(line.options)
    const itemLabel =
      optionsSummary ? `${product.name} (${optionsSummary})` : product.name

    showToast(`تمت إضافة ${itemLabel} إلى السلة.`, 'success')
  }

  function handleIncreaseQuantity(key) {
    const item = cartSummary.items.find((cartItem) => cartItem.key === key)

    if (!item) return

    setCartItems((items) =>
      updateCartLineQuantity(items, key, item.quantity + 1),
    )
    showToast(`تم زيادة كمية ${getCartLineLabel(item)}.`, 'info')
  }

  function handleDecreaseQuantity(key) {
    const item = cartSummary.items.find((cartItem) => cartItem.key === key)

    if (!item) return

    const nextQuantity = item.quantity - 1
    setCartItems((items) => updateCartLineQuantity(items, key, nextQuantity))

    if (nextQuantity === 0) {
      showToast(`تم حذف ${getCartLineLabel(item)} من السلة.`, 'info')
      return
    }

    showToast(`تم تقليل كمية ${getCartLineLabel(item)}.`, 'info')
  }

  function handleRemoveItem(key) {
    const item = cartSummary.items.find((cartItem) => cartItem.key === key)

    if (!item) return

    setCartItems((items) => items.filter((cartItem) => cartItem.key !== key))
    showToast(`تم حذف ${getCartLineLabel(item)} من السلة.`, 'success')
  }

  function handleClearCart() {
    if (cartSummary.items.length === 0) return

    setCartItems([])
    showToast('تم تفريغ السلة.', 'info')
  }

  function handleBrowseMenu() {
    setIsCartOpen(false)
    window.setTimeout(() => {
      document
        .getElementById('menu')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <>
      <a className="skip-link" href="#menu">
        تخطّي إلى المنيو
      </a>
      <Header
        cartCount={cartCount}
        isCartOpen={isCartOpen}
        cartTriggerRef={cartTriggerRef}
        onOpenCart={() => setIsCartOpen(true)}
      />
      <main>
        <Hero />
        <MenuSection
          cartItems={cartSummary.items}
          onAddToCart={handleAddToCart}
          onIncreaseQuantity={handleIncreaseQuantity}
          onDecreaseQuantity={handleDecreaseQuantity}
        />
      </main>
      <Footer />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartSummary.items}
        itemCount={cartCount}
        total={cartTotal}
        onIncrease={handleIncreaseQuantity}
        onDecrease={handleDecreaseQuantity}
        onRemove={handleRemoveItem}
        onClearCart={handleClearCart}
        onBrowseMenu={handleBrowseMenu}
        showToast={showToast}
        returnFocusRef={cartTriggerRef}
      />
      <ToastViewport toasts={toasts} />
    </>
  )
}

export default Home
