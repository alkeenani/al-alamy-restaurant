import { useEffect, useMemo, useRef, useState } from 'react'
import ToastViewport from '../common/ToastViewport.jsx'
import { useToasts } from '../../hooks/useToasts.js'
import {
  ensureRequiredChickenMeatMealProducts,
  ensureRequiredCrepeProducts,
  ensureRequiredMenuCategories,
  ensureRequiredOutdoorGrillProducts,
  ensureRequiredPastaProducts,
  ensureRequiredPizzaProducts,
  ensureRequiredRizzoProducts,
  ensureRequiredSandwichProducts,
  ensureRequiredSweetBoxProducts,
  fetchAdminMenuData,
  mapSupabaseError,
} from '../../lib/menuApi.js'
import CategoriesManager from './CategoriesManager.jsx'
import ProductsManager from './ProductsManager.jsx'
import './AdminDashboard.css'

export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({ categories: [], products: [], groups: [], values: [], combinations: [], combinationValues: [] })
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [categoriesEnsured, setCategoriesEnsured] = useState(false)
  const [sandwichProductsEnsured, setSandwichProductsEnsured] = useState(false)
  const [crepeProductsEnsured, setCrepeProductsEnsured] = useState(false)
  const [pizzaProductsEnsured, setPizzaProductsEnsured] = useState(false)
  const [pastaProductsEnsured, setPastaProductsEnsured] = useState(false)
  const [rizzoProductsEnsured, setRizzoProductsEnsured] = useState(false)
  const [chickenMeatMealsEnsured, setChickenMeatMealsEnsured] = useState(false)
  const [outdoorGrillProductsEnsured, setOutdoorGrillProductsEnsured] = useState(false)
  const [sweetBoxProductsEnsured, setSweetBoxProductsEnsured] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toasts, showToast } = useToasts()
  const autoRefreshStarted = useRef(false)

  async function refresh() {
    setLoading(true)
    try {
      const { data: next, error } = await fetchAdminMenuData()
      if (error) {
        showToast(mapSupabaseError(error, 'تعذر تحميل بيانات القائمة.'), 'error')
        return
      }

      let finalData = next
      if (!categoriesEnsured) {
        const ensured = await ensureRequiredMenuCategories(next.categories)
        if (ensured.error || ensured.report?.errors?.length) {
          const syncError = ensured.error || ensured.report.errors[0].error
          const details = syncError ? `${syncError.code || 'ERROR'}: ${syncError.message || ''}${syncError.hint ? ` (${syncError.hint})` : ''}${syncError.details ? ` - ${syncError.details}` : ''}` : ''
          console.error('Category sync failed:', syncError, ensured.report)
          showToast(`تعذر مزامنة أقسام القائمة المطلوبة. ${details}`.trim(), 'error')
          setData(next)
          setLoadedOnce(true)
          return
        }

        setCategoriesEnsured(true)
        const changed = ((ensured.report?.added?.length || 0) + (ensured.report?.updated?.length || 0)) > 0
        if (changed) {
          const reloaded = await fetchAdminMenuData()
          if (!reloaded.error && reloaded.data) {
            finalData = reloaded.data
          } else {
            finalData = { ...next, categories: ensured.data?.categories || next.categories }
          }
        } else {
          finalData = { ...next, categories: ensured.data?.categories || next.categories }
        }
      }

      if (!sandwichProductsEnsured) {
        const ensuredProducts = await ensureRequiredSandwichProducts()
        if (ensuredProducts.error || ensuredProducts.report?.errors?.length) {
          const syncError = ensuredProducts.error || ensuredProducts.report.errors[0].error
          const details = syncError ? `${syncError.code || 'ERROR'}: ${syncError.message || ''}${syncError.hint ? ` (${syncError.hint})` : ''}${syncError.details ? ` - ${syncError.details}` : ''}` : ''
          console.error('Sandwich products sync failed:', syncError, ensuredProducts.report)
          showToast(`تعذر مزامنة منتجات السندوتشات. ${details}`.trim(), 'error')
          setData(finalData)
          setLoadedOnce(true)
          return
        }

        setSandwichProductsEnsured(true)
        if ((ensuredProducts.report?.added?.length || 0) > 0) {
          const reloaded = await fetchAdminMenuData()
          if (!reloaded.error && reloaded.data) {
            finalData = reloaded.data
          }
        }
      }

      if (!crepeProductsEnsured) {
        const ensuredCrepes = await ensureRequiredCrepeProducts()
        if (ensuredCrepes.error || ensuredCrepes.report?.errors?.length) {
          const syncError = ensuredCrepes.error || ensuredCrepes.report.errors[0].error
          const details = syncError ? `${syncError.code || 'ERROR'}: ${syncError.message || ''}${syncError.hint ? ` (${syncError.hint})` : ''}${syncError.details ? ` - ${syncError.details}` : ''}` : ''
          console.error('Crepe products sync failed:', syncError, ensuredCrepes.report)
          showToast(`تعذر مزامنة منتجات الكريب. ${details}`.trim(), 'error')
          setData(finalData)
          setLoadedOnce(true)
          return
        }

        setCrepeProductsEnsured(true)
        if ((ensuredCrepes.report?.added?.length || 0) > 0) {
          const reloaded = await fetchAdminMenuData()
          if (!reloaded.error && reloaded.data) {
            finalData = reloaded.data
          }
        }
      }

      if (!pizzaProductsEnsured) {
        const ensuredPizzas = await ensureRequiredPizzaProducts()
        if (ensuredPizzas.error || ensuredPizzas.report?.errors?.length) {
          const syncError = ensuredPizzas.error || ensuredPizzas.report.errors[0].error
          const details = syncError ? `${syncError.code || 'ERROR'}: ${syncError.message || ''}${syncError.hint ? ` (${syncError.hint})` : ''}${syncError.details ? ` - ${syncError.details}` : ''}` : ''
          console.error('Pizza products sync failed:', syncError, ensuredPizzas.report)
          showToast(`تعذر مزامنة منتجات البيتزا. ${details}`.trim(), 'error')
          setData(finalData)
          setLoadedOnce(true)
          return
        }

        setPizzaProductsEnsured(true)
        if ((ensuredPizzas.report?.added?.length || 0) > 0) {
          const reloaded = await fetchAdminMenuData()
          if (!reloaded.error && reloaded.data) {
            finalData = reloaded.data
          }
        }
      }

      const remainingSyncs = [
        { done: pastaProductsEnsured, setDone: setPastaProductsEnsured, fn: ensureRequiredPastaProducts, label: 'منتجات المكرونة' },
        { done: rizzoProductsEnsured, setDone: setRizzoProductsEnsured, fn: ensureRequiredRizzoProducts, label: 'منتجات الريزو' },
        { done: chickenMeatMealsEnsured, setDone: setChickenMeatMealsEnsured, fn: ensureRequiredChickenMeatMealProducts, label: 'وجبات الفراخ واللحوم' },
        { done: outdoorGrillProductsEnsured, setDone: setOutdoorGrillProductsEnsured, fn: ensureRequiredOutdoorGrillProducts, label: 'منتجات التسويات والشوي' },
        { done: sweetBoxProductsEnsured, setDone: setSweetBoxProductsEnsured, fn: ensureRequiredSweetBoxProducts, label: 'بوكسات اللمة الحلوة' },
      ]

      for (const step of remainingSyncs) {
        if (step.done) continue
        const ensured = await step.fn()
        if (ensured.error || ensured.report?.errors?.length) {
          const syncError = ensured.error || ensured.report.errors[0].error
          const details = syncError ? `${syncError.code || 'ERROR'}: ${syncError.message || ''}${syncError.hint ? ` (${syncError.hint})` : ''}${syncError.details ? ` - ${syncError.details}` : ''}` : ''
          console.error(`${step.label} sync failed:`, syncError, ensured.report)
          showToast(`تعذر مزامنة ${step.label}. ${details}`.trim(), 'error')
          setData(finalData)
          setLoadedOnce(true)
          return
        }
        step.setDone(true)
        if ((ensured.report?.added?.length || 0) > 0) {
          const reloaded = await fetchAdminMenuData()
          if (!reloaded.error && reloaded.data) {
            finalData = reloaded.data
          }
        }
      }

      setData(finalData)
      setLoadedOnce(true)
    } finally {
      setLoading(false)
    }
  }

  // auto-sync/load once for authenticated admin dashboard session
  useEffect(() => {
    if (autoRefreshStarted.current) return
    autoRefreshStarted.current = true
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [sidebarOpen])

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // lazy load when entering data tabs
  async function handleTab(next) {
    setTab(next)
    setSidebarOpen(false)
    if ((next === 'categories' || next === 'products' || next === 'overview') && !loadedOnce && !loading) {
      await refresh()
    }
  }

  const stats = useMemo(() => {
    const categories = data.categories.length
    const visibleCategories = data.categories.filter(c => c.is_active !== false).length
    const availableCategories = data.categories.filter(c => c.is_active !== false && c.is_available !== false).length
    const products = data.products.length
    const visibleProducts = data.products.filter(p => p.is_active !== false).length
    const availableProducts = data.products.filter(p => p.is_active !== false && p.is_available).length
    return { categories, visibleCategories, availableCategories, products, visibleProducts, availableProducts }
  }, [data])

  const sectionTitle = tab === 'overview' ? 'نظرة عامة' : tab === 'categories' ? 'إدارة الأقسام' : 'إدارة المنتجات'

  return (
    <main className={`admin-shell${sidebarOpen ? ' admin-shell--nav-open' : ''}`} dir="rtl">
      <div className="admin-shell__layout container">
        <button
          type="button"
          className="admin-shell__overlay"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
          tabIndex={sidebarOpen ? 0 : -1}
        />
        <aside id="admin-sidebar" className={`admin-shell__sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="admin-shell__brand">
            <div className="admin-shell__brand-row">
              <h1 className="admin-shell__title">لوحة التحكم</h1>
              <button type="button" className="admin-shell__close-nav" aria-label="إغلاق القائمة" onClick={() => setSidebarOpen(false)}>×</button>
            </div>
            {user?.email ? <p className="admin-shell__email">{user.email}</p> : null}
          </div>
          <nav className="admin-shell__nav" aria-label="أقسام لوحة التحكم">
            <button type="button" className={`admin-shell__navbtn ${tab === 'overview' ? 'is-active' : ''}`} onClick={() => handleTab('overview')}>نظرة عامة</button>
            <button type="button" className={`admin-shell__navbtn ${tab === 'categories' ? 'is-active' : ''}`} onClick={() => handleTab('categories')}>إدارة الأقسام</button>
            <button type="button" className={`admin-shell__navbtn ${tab === 'products' ? 'is-active' : ''}`} onClick={() => handleTab('products')}>إدارة المنتجات</button>
            <button type="button" className="admin-shell__navbtn admin-shell__navbtn--danger" onClick={() => { setSidebarOpen(false); onLogout() }}>تسجيل الخروج</button>
          </nav>
        </aside>

        <section className="admin-shell__content">
          <div className="admin-shell__topbar">
            <div className="admin-shell__topbar-main">
              <button
                type="button"
                className="admin-shell__menu-toggle"
                aria-label={sidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                aria-expanded={sidebarOpen}
                aria-controls="admin-sidebar"
                onClick={() => setSidebarOpen(v => !v)}
              >
                <span aria-hidden="true">☰</span>
              </button>
              <h2 className="admin-shell__section-title">{sectionTitle}</h2>
            </div>
            <div className="admin-shell__actions">
              <button type="button" className="admin-btn admin-btn--secondary" onClick={refresh} disabled={loading}>
                {loading ? 'جاري التحديث…' : 'تحديث البيانات'}
              </button>
            </div>
          </div>

          {tab === 'overview' && (
            <div className="admin-overview">
              {!loadedOnce && !loading ? (
                <div className="admin-empty">اضغط "تحديث البيانات" لتحميل الإحصائيات.</div>
              ) : loading ? (
                <div className="admin-empty">جاري تحميل البيانات…</div>
              ) : (
                <div className="admin-stats">
                  <div className="admin-stat"><span className="admin-stat__label">الأقسام (الكل)</span><strong className="admin-stat__value">{stats.categories}</strong></div>
                  <div className="admin-stat"><span className="admin-stat__label">الأقسام الظاهرة</span><strong className="admin-stat__value">{stats.visibleCategories}</strong></div>
                  <div className="admin-stat"><span className="admin-stat__label">الأقسام المتاحة</span><strong className="admin-stat__value">{stats.availableCategories}</strong></div>
                  <div className="admin-stat"><span className="admin-stat__label">المنتجات (الكل)</span><strong className="admin-stat__value">{stats.products}</strong></div>
                  <div className="admin-stat"><span className="admin-stat__label">المنتجات الظاهرة</span><strong className="admin-stat__value">{stats.visibleProducts}</strong></div>
                  <div className="admin-stat"><span className="admin-stat__label">المنتجات المتاحة</span><strong className="admin-stat__value">{stats.availableProducts}</strong></div>
                </div>
              )}
              <div className="admin-note">تحكم مستقل في الظهور والتوفر للأقسام والمنتجات. التغييرات تُحفظ مباشرة في قاعدة البيانات وتنعكس على الموقع بعد التحديث.</div>
            </div>
          )}

          {tab === 'categories' && (
            <CategoriesManager data={data} loading={loading} refresh={refresh} showToast={showToast} />
          )}
          {tab === 'products' && (
            <ProductsManager data={data} loading={loading} refresh={refresh} showToast={showToast} />
          )}
        </section>
      </div>
      <ToastViewport toasts={toasts} />
    </main>
  )
}
