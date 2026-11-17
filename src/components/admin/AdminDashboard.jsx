import { useMemo, useState } from 'react'
import ToastViewport from '../common/ToastViewport.jsx'
import { useToasts } from '../../hooks/useToasts.js'
import { ensureRequiredMenuCategories, ensureRequiredSandwichProducts, fetchAdminMenuData, mapSupabaseError } from '../../lib/menuApi.js'
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
  const { toasts, showToast } = useToasts()

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

      setData(finalData)
      setLoadedOnce(true)
    } finally {
      setLoading(false)
    }
  }

  // lazy load when entering data tabs
  async function handleTab(next) {
    setTab(next)
    if ((next === 'categories' || next === 'products' || next === 'overview') && !loadedOnce && !loading) {
      await refresh()
    }
  }

  const stats = useMemo(() => {
    const categories = data.categories.length
    const activeCategories = data.categories.filter(c=>c.is_active).length
    const products = data.products.length
    const availableProducts = data.products.filter(p=>p.is_available).length
    return { categories, activeCategories, products, availableProducts }
  }, [data])

  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-shell__layout container">
        <aside className="admin-shell__sidebar">
          <div className="admin-shell__brand">
            <h1 className="admin-shell__title">لوحة التحكم</h1>
            {user?.email ? <p className="admin-shell__email">{user.email}</p> : null}
          </div>
          <nav className="admin-shell__nav" aria-label="أقسام لوحة التحكم">
            <button type="button" className={`admin-shell__navbtn ${tab==='overview'?'is-active':''}`} onClick={()=>handleTab('overview')}>نظرة عامة</button>
            <button type="button" className={`admin-shell__navbtn ${tab==='categories'?'is-active':''}`} onClick={()=>handleTab('categories')}>إدارة الأقسام</button>
            <button type="button" className={`admin-shell__navbtn ${tab==='products'?'is-active':''}`} onClick={()=>handleTab('products')}>إدارة المنتجات</button>
            <button type="button" className="admin-shell__navbtn admin-shell__navbtn--danger" onClick={onLogout}>تسجيل الخروج</button>
          </nav>
        </aside>

        <section className="admin-shell__content">
          <div className="admin-shell__topbar">
            <h2 className="admin-shell__section-title">
              {tab==='overview' ? 'نظرة عامة' : tab==='categories' ? 'إدارة الأقسام' : 'إدارة المنتجات'}
            </h2>
            <div className="admin-shell__actions">
              <button type="button" className="admin-btn admin-btn--secondary" onClick={refresh} disabled={loading}>
                {loading ? 'جاري التحديث…' : 'تحديث البيانات'}
              </button>
            </div>
          </div>

          {tab==='overview' && (
            <div className="admin-overview">
              {!loadedOnce && !loading ? (
                <div className="admin-empty">اضغط "تحديث البيانات" لتحميل الإحصائيات.</div>
              ) : loading ? (
                <div className="admin-empty">جاري تحميل البيانات…</div>
              ) : (
                <div className="admin-stats">
                  <div className="admin-stat"><span className="admin-stat__label">الأقسام</span><strong className="admin-stat__value">{stats.categories}</strong></div>
                  <div className="admin-stat"><span className="admin-stat__label">الأقسام النشطة</span><strong className="admin-stat__value">{stats.activeCategories}</strong></div>
                  <div className="admin-stat"><span className="admin-stat__label">المنتجات</span><strong className="admin-stat__value">{stats.products}</strong></div>
                  <div className="admin-stat"><span className="admin-stat__label">المنتجات المتاحة</span><strong className="admin-stat__value">{stats.availableProducts}</strong></div>
                </div>
              )}
              <div className="admin-note">يمكنك من هنا إدارة الأقسام والمنتجات والخيارات والأسعار. التغييرات تظهر في القائمة العامة بعد تحديث الصفحة.</div>
            </div>
          )}

          {tab==='categories' && (
            <CategoriesManager data={data} loading={loading} refresh={refresh} showToast={showToast} />
          )}
          {tab==='products' && (
            <ProductsManager data={data} loading={loading} refresh={refresh} showToast={showToast} />
          )}
        </section>
      </div>
      <ToastViewport toasts={toasts} />
    </main>
  )
}
