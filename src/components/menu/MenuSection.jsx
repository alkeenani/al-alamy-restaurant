import { useEffect, useState } from 'react'
import CategoryFilter from './CategoryFilter.jsx'
import ProductCard from './ProductCard.jsx'
import { OUTDOOR_GRILL_CATEGORY_ID, fetchPublicMenu } from '../../lib/menuApi.js'
import './MenuSection.css'

const INQUIRY_ONLY_SERVICES = [
  {
    id: 'inquiry-outdoor-external-meals',
    name: 'تسوية وجبات خارجية حسب الكمية',
    description: 'خدمة تسوية الوجبات الخارجية. السعر بيتحدد حسب الكمية ونوع الطلب. تواصل معنا عبر واتساب لمعرفة التفاصيل.',
    category: OUTDOOR_GRILL_CATEGORY_ID,
    categoryId: OUTDOOR_GRILL_CATEGORY_ID,
    isInquiryOnly: true,
    isAvailable: true,
    sortOrder: 999,
  },
]

function MenuSection({
  cartItems,
  onAddToCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
}) {
  const [activeCategory, setActiveCategory] = useState('')
  const [menuCategories, setMenuCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data, error: fetchError } = await fetchPublicMenu()
      if (!mounted) return
      if (fetchError) {
        setError('تعذر تحميل القائمة حالياً. يرجى المحاولة لاحقاً.')
        setMenuCategories([])
        setProducts([])
      } else {
        setError('')
        setMenuCategories(data?.categories || [])
        setProducts(data?.products || [])
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const effectiveActiveCategory =
    menuCategories.some((c) => c.id === activeCategory)
      ? activeCategory
      : (menuCategories[0]?.id || '')

  const activeInquiryServices = INQUIRY_ONLY_SERVICES.filter(
    (s) => menuCategories.some((c) => c.id === s.categoryId),
  )
  const mergedProducts = [...products, ...activeInquiryServices]

  const displayedProducts = effectiveActiveCategory
    ? mergedProducts.filter((product) => product.category === effectiveActiveCategory)
    : []

  return (
    <section className="menu-section" id="menu" aria-labelledby="menu-title">
      <div className="container">
        <div className="menu-section__intro">
          <div>
            <p className="menu-section__eyebrow">قائمتنا</p>
            <h2 className="menu-section__title" id="menu-title">
              المنيو
            </h2>
          </div>
        </div>

        {loading ? (
          <p className="menu-section__notice" role="status">جاري تحميل القائمة…</p>
        ) : error ? (
          <p className="menu-section__notice" role="alert">{error}</p>
        ) : (
          <>
            <CategoryFilter
              categories={menuCategories}
              activeCategory={effectiveActiveCategory}
              onSelect={setActiveCategory}
            />
            <p className="visually-hidden" aria-live="polite">
              {displayedProducts.length} صنفاً معروضاً
            </p>
            {displayedProducts.length ? (
              <div className="product-grid">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartItems={cartItems}
                    onAddToCart={onAddToCart}
                    onIncreaseQuantity={onIncreaseQuantity}
                    onDecreaseQuantity={onDecreaseQuantity}
                  />
                ))}
              </div>
            ) : (
              <p className="menu-section__notice" role="status">لا توجد منتجات متاحة حالياً.</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default MenuSection
