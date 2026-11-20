import { useMemo, useState } from 'react'
import AdminModal from './AdminModal.jsx'
import { createCategory, deleteCategory, mapSupabaseError, slugify, updateCategory } from '../../lib/menuApi.js'

const emptyForm = { name: '', slug: '', is_active: true, is_available: true, sort_order: 0 }

export default function CategoriesManager({ data, loading, refresh, showToast }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const categories = useMemo(() => data.categories || [], [data.categories])
  const products = useMemo(() => data.products || [], [data.products])
  const rows = useMemo(() => [...categories].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0) || String(a.created_at||'').localeCompare(String(b.created_at||''))), [categories])
  const productCountByCategory = useMemo(() => {
    const m = new Map()
    for (const p of products) m.set(p.category_id, (m.get(p.category_id)||0)+1)
    return m
  }, [products])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, sort_order: rows.length ? Math.max(...rows.map(r=>Number(r.sort_order||0))) + 1 : 0 })
    setModalOpen(true)
  }
  function openEdit(cat) {
    setEditing(cat)
    setForm({ name: cat.name || '', slug: cat.slug || '', is_active: cat.is_active !== false, is_available: cat.is_available !== false, sort_order: Number(cat.sort_order ?? 0) })
    setModalOpen(true)
  }
  function closeModal() { if (!saving) setModalOpen(false) }

  function validate() {
    if (!form.name.trim()) return 'يرجى إدخال اسم القسم.'
    if (!String(form.slug).trim()) return 'يرجى إدخال المعرّف (slug).'
    if (!/^[a-z0-9\u0600-\u06FF-]+$/i.test(String(form.slug).trim())) return 'المعرّف (slug) يجب أن يحتوي على أحرف/أرقام وشرطات فقط.'
    const slug = String(form.slug).trim()
    const dup = categories.some(c => c.slug === slug && c.id !== editing?.id)
    if (dup) return 'المعرّف (slug) مستخدم بالفعل لقسم آخر.'
    if (Number.isNaN(Number(form.sort_order))) return 'ترتيب العرض يجب أن يكون رقماً.'
    return ''
  }

  async function submit(e) {
    e.preventDefault()
    const errMsg = validate()
    if (errMsg) { showToast(errMsg, 'error'); return }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: String(form.slug).trim(),
      is_active: !!form.is_active,
      is_available: !!form.is_available,
      sort_order: Number(form.sort_order || 0),
    }
    const res = editing ? await updateCategory(editing.id, payload) : await createCategory(payload)
    setSaving(false)
    if (res.error) {
      showToast(mapSupabaseError(res.error, editing ? 'تعذر تعديل القسم.' : 'تعذر إضافة القسم.'), 'error')
      return
    }
    setModalOpen(false)
    showToast(editing ? 'تم تحديث القسم بنجاح.' : 'تمت إضافة القسم بنجاح.', 'success')
    await refresh()
  }

  async function confirmDelete() {
    if (!confirmTarget) return
    const count = productCountByCategory.get(confirmTarget.id) || 0
    if (count > 0) {
      showToast('لا يمكن حذف هذا القسم لأنه يحتوي على منتجات. انقل المنتجات أو احذفها أولاً.', 'error')
      setConfirmTarget(null)
      return
    }
    setDeleting(true)
    const res = await deleteCategory(confirmTarget.id)
    setDeleting(false)
    if (res.error) {
      const code = res.error.code || ''
      const msg = (res.error.message || '').toLowerCase()
      if (code === '23503' || msg.includes('foreign key')) {
        showToast('لا يمكن حذف القسم لوجود منتجات مرتبطة به. احذف المنتجات أو انقلها أولاً.', 'error')
      } else {
        showToast(mapSupabaseError(res.error, 'تعذر حذف القسم.'), 'error')
      }
      setConfirmTarget(null)
      return
    }
    showToast('تم حذف القسم.', 'success')
    setConfirmTarget(null)
    await refresh()
  }

  if (loading && !categories.length) return <div className="admin-empty">جاري تحميل الأقسام…</div>

  return (
    <div>
      <div className="admin-toolbar">
        <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate}>إضافة قسم</button>
      </div>

      {!rows.length ? (
        <div className="admin-empty">لا توجد أقسام بعد. ابدأ بإضافة قسم جديد.</div>
      ) : (
        <>
          <div className="admin-table-wrap admin-table-wrap--responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>المعرّف (slug)</th>
                  <th>الترتيب</th>
                  <th>الظهور</th>
                  <th>التوفر</th>
                  <th>المنتجات</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(cat => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td dir="ltr" style={{textAlign:'left'}}>{cat.slug}</td>
                    <td>{cat.sort_order ?? 0}</td>
                    <td>
                      <span className={`admin-badge ${cat.is_active !== false ? '' : 'admin-badge--muted'}`}>
                        {cat.is_active !== false ? 'ظاهر' : 'مخفي'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${cat.is_available !== false ? '' : 'admin-badge--danger'}`}>
                        {cat.is_available !== false ? 'متوفر' : 'غير متوفر'}
                      </span>
                    </td>
                    <td>{productCountByCategory.get(cat.id) || 0}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="admin-btn" onClick={()=>openEdit(cat)}>تعديل</button>
                        <button type="button" className="admin-btn admin-btn--danger" onClick={()=>setConfirmTarget(cat)}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-list-cards">
            {rows.map(cat => (
              <article key={cat.id} className="admin-list-card">
                <div className="admin-list-card__head">
                  <div className="admin-list-card__title">{cat.name}</div>
                  <div className="admin-inline" style={{gap:'.35rem', flexWrap:'wrap', justifyContent:'flex-end'}}>
                    <span className={`admin-badge ${cat.is_active !== false ? '' : 'admin-badge--muted'}`}>{cat.is_active !== false ? 'ظاهر' : 'مخفي'}</span>
                    <span className={`admin-badge ${cat.is_available !== false ? '' : 'admin-badge--danger'}`}>{cat.is_available !== false ? 'متوفر' : 'غير متوفر'}</span>
                  </div>
                </div>
                <div className="admin-list-card__meta">
                  <div className="admin-list-card__meta-row"><span>المعرّف (slug)</span><span dir="ltr">{cat.slug}</span></div>
                  <div className="admin-list-card__meta-row"><span>الترتيب</span><span>{cat.sort_order ?? 0}</span></div>
                  <div className="admin-list-card__meta-row"><span>المنتجات</span><span>{productCountByCategory.get(cat.id) || 0}</span></div>
                </div>
                <div className="admin-list-card__actions">
                  <button type="button" className="admin-btn" onClick={()=>openEdit(cat)}>تعديل</button>
                  <button type="button" className="admin-btn admin-btn--danger" onClick={()=>setConfirmTarget(cat)}>حذف</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <AdminModal
        open={modalOpen}
        title={editing ? 'تعديل قسم' : 'إضافة قسم'}
        onClose={closeModal}
        footer={(
          <>
            <button type="button" className="admin-btn" onClick={closeModal} disabled={saving}>إلغاء</button>
            <button type="submit" form="category-form" className="admin-btn admin-btn--primary" disabled={saving}>{saving ? 'جاري الحفظ…' : 'حفظ'}</button>
          </>
        )}
      >
        <form id="category-form" onSubmit={submit} className="admin-grid-2">
          <div className="admin-field" style={{gridColumn:'1 / -1'}}>
            <label htmlFor="cat-name">اسم القسم</label>
            <input id="cat-name" className="admin-input" value={form.name} onChange={e=>{
              const name = e.target.value
              setForm(f=>({ ...f, name, slug: editing ? f.slug : (f.slug || slugify(name)) }))
            }} />
          </div>
          <div className="admin-field">
            <label htmlFor="cat-slug">المعرّف (slug)</label>
            <input id="cat-slug" className="admin-input" dir="ltr" value={form.slug} onChange={e=>setForm(f=>({...f, slug: e.target.value}))} />
            <span className="admin-help">يُستخدم داخلياً ويجب أن يكون فريداً.</span>
          </div>
          <div className="admin-field">
            <label htmlFor="cat-sort">ترتيب العرض</label>
            <input id="cat-sort" className="admin-input" type="number" value={form.sort_order} onChange={e=>setForm(f=>({...f, sort_order: e.target.value}))} />
          </div>
          <div className="admin-grid-2" style={{gridColumn:'1 / -1'}}>
            <label className="admin-check">
              <input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f, is_active: e.target.checked}))} />
              ظاهر في الموقع (إلغاء التحديد = مخفي)
            </label>
            <label className="admin-check">
              <input type="checkbox" checked={form.is_available} onChange={e=>setForm(f=>({...f, is_available: e.target.checked}))} />
              متوفر للطلب (إلغاء التحديد = غير متوفر حاليًا)
            </label>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={!!confirmTarget}
        title="تأكيد حذف القسم"
        onClose={()=>!deleting && setConfirmTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn" onClick={()=>setConfirmTarget(null)} disabled={deleting}>إلغاء</button>
            <button type="button" className="admin-btn admin-btn--danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'جاري الحذف…' : 'حذف نهائي'}</button>
          </>
        )}
      >
        <p>هل أنت متأكد من حذف القسم "{confirmTarget?.name}"؟</p>
        <p className="admin-help" style={{marginTop:'.5rem'}}>إذا كان القسم يحتوي على منتجات، فسيمنع النظام الحذف وستظهر رسالة توضيحية.</p>
      </AdminModal>
    </div>
  )
}
