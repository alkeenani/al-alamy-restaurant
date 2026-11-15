import logo from '../../assets/icons/logo.png'
import { restaurantInfo } from '../../data/siteInfo.js'
import { CartIcon, LocationIcon } from '../common/Icons.jsx'
import './Header.css'

function Header({ cartCount, isCartOpen, cartTriggerRef, onOpenCart }) {
  const cartLabel =
    cartCount > 0
      ? `سلة المشتريات، ${cartCount} قطعة`
      : 'سلة المشتريات، فارغة'

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <div className="brand">
          <img
            className="brand__logo"
            src={logo}
            alt="شعار مطعم العالمي"
            width="52"
            height="52"
          />
          <div className="brand__text">
            <span className="brand__name">{restaurantInfo.name}</span>
            <span className="brand__latin">{restaurantInfo.latinName}</span>
          </div>
        </div>
        <div className="site-header__actions">
          <p className="site-header__location">
            <LocationIcon />
            <span>{restaurantInfo.location}</span>
          </p>
          <button
            ref={cartTriggerRef}
            type="button"
            className="site-header__cart"
            aria-label={cartLabel}
            aria-haspopup="dialog"
            aria-expanded={isCartOpen}
            onClick={onOpenCart}
          >
            <CartIcon />
            <span className="site-header__cart-count" aria-hidden="true">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
