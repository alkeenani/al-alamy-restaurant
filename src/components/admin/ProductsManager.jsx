import { useMemo, useState } from 'react'
import AdminModal from './AdminModal.jsx'
import {
  createProduct,
  deleteProduct,
  mapSupabaseError,
  replaceProductOptions,
  saveProductCombinations,
  updateProduct,
} from '../../lib/menuApi.js'

function emptyProductForm(categories) {
  return {
    name: '',
    description: '',
    category_id: categories[0]?.id || '',
    base_price: '',
    is_active: true,
    is_available: true,
    sort_order: 0,
  }
}

function emptyGroup(sort = 0) {
  return {
    tempId: crypto.randomUUID?.() || String(Math.random()),
    name: '',
    is_required: true,
    min_select: 1,
    max_select: 1,
    sort_order: sort,
    values: [emptyValue(0)],
  }
}
function emptyValue(sort = 0) {
  return {
    tempId: crypto.randomUUID?.() || String(Math.random()),
    name: '',
    price_delta: 0,
    is_available: true,
    sort_order: sort,
  }
}

function cartesian(arrays) {
  if (!arrays.length) return [[]]
  return arrays.reduce((acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])), [[]])
}

export default function ProductsManager({ data, loading, refresh, showToast }) {
  const categories = useMemo(() => [...(data.categories || [])].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)), [data.categories])
  const products = useMemo(() => data.products || [], [data.products])
  const groups = useMemo(() => data.groups || [], [data.groups])
  const values = useMemo(() => data.values || [], [data.values])
  const combos = useMemo(() => data.combinations || [], [data.combinations])
  const comboValues = useMemo(() => data.combinationValues || [], [data.combinationValues])

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAvail, setFilterAvail] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyProductForm(categories))
  const [draftGroups, setDraftGroups] = useState([])
  const [comboPrices, setComboPrices] = useState({}) // key by temp value ids ordered by groups -> price string
  const [saving, setSaving] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...products]
      .filter(p => (filterCategory === 'all' ? true : p.category_id === filterCategory))
      .filter(p => filterAvail === 'all' ? true : filterAvail === 'available' ? !!p.is_available : !p.is_available)
      .filter(p => !q || String(p.name||'').toLowerCase().includes(q))
      .sort((a,b)=>(a.sort_order??0)-(b.sort_order??0) || String(a.created_at||'').localeCompare(String(b.created_at||'')))
  }, [products, filterCategory, filterAvail, search])

  function loadDraftFromProduct(product) {
    const pGroups = groups.filter(g => g.product_id === product.id).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))
    const draft = pGroups.map(g => ({
      tempId: g.id,
      dbId: g.id,
      name: g.name || '',
      is_required: g.is_required !== false,
      min_select: g.min_select ?? (g.is_required !== false ? 1 : 0),
      max_select: g.max_select ?? 1,
      sort_order: g.sort_order ?? 0,
      values: values.filter(v => v.option_group_id === g.id).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).map(v => ({
        tempId: v.id,
        dbId: v.id,
        name: v.name || '',
        price_delta: Number(v.price_delta ?? 0),
        is_available: v.is_available !== false,
        sort_order: v.sort_order ?? 0,
      }))
    }))
    // build combo price map by draft tempIds (db ids here)
    const pCombos = combos.filter(c => c.product_id === product.id)
    const map = {}
    for (const c of pCombos) {
      const ids = comboValues.filter(cv => cv.combination_id === c.id).map(cv => cv.option_value_id)
      const ordered = []
      for (const g of draft) {
        const vid = ids.find(id => g.values.some(v => v.tempId === id))
        if (vid) ordered.push(vid)
      }
      if (ordered.length === draft.length) map[ordered.join('|')] = String(c.price)
    }
    setDraftGroups(draft.length ? draft : [])
    setComboPrices(map)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyProductForm(categories))
    setDraftGroups([])
    setComboPrices({})
    setModalOpen(true)
  }
  function openEdit(p) {
    setEditing(p)
    setForm({
      name: p.name || '',
      description: p.description || '',
      category_id: p.category_id || categories[0]?.id || '',
      base_price: String(p.base_price ?? ''),
      is_active: p.is_active !== false,
      is_available: !!p.is_available,
      sort_order: Number(p.sort_order ?? 0),
    })
    loadDraftFromProduct(p)
    setModalOpen(true)
  }
  function closeModal(){ if(!saving) setModalOpen(false) }

  function updateGroup(idx, patch) {
    setDraftGroups(gs => gs.map((g,i)=> i===idx ? { ...g, ...patch } : g))
  }
  function addGroup() { setDraftGroups(gs => [...gs, emptyGroup(gs.length)]) }
  function removeGroup(idx) {
    setDraftGroups(gs => gs.filter((_,i)=>i!==idx))
    setComboPrices({})
  }
  function addValue(gIdx) {
    setDraftGroups(gs => gs.map((g,i)=> i===gIdx ? { ...g, values:[...g.values, emptyValue(g.values.length)] } : g))
    setComboPrices({})
  }
  function updateValue(gIdx, vIdx, patch) {
    setDraftGroups(gs => gs.map((g,i)=> i===gIdx ? { ...g, values: g.values.map((v,j)=> j===vIdx ? {...v, ...patch} : v) } : g))
  }
  function removeValue(gIdx, vIdx) {
    setDraftGroups(gs => gs.map((g,i)=> i===gIdx ? { ...g, values: g.values.filter((_,j)=>j!==vIdx) } : g))
    setComboPrices({})
  }

  const allCombinations = useMemo(() => {
    if (draftGroups.length < 2) return []
    const arrays = draftGroups.map(g => g.values.filter(v=>String(v.name||'').trim()))
    if (arrays.some(a => a.length === 0)) return []
    return cartesian(arrays)
  }, [draftGroups])

  function validate() {
    if (!form.name.trim()) return 'يرجى إدخال اسم المنتج.'
    if (!form.category_id) return 'يرجى اختيار القسم.'
    const price = Number(form.base_price)
    if (!Number.isFinite(price) || price < 0) return 'يرجى إدخال سعر أساسي صحيح.'
    if (Number.isNaN(Number(form.sort_order))) return 'ترتيب العرض يجب أن يكون رقماً.'
    for (const [gi,g] of draftGroups.entries()) {
      if (!g.name.trim()) return `يرجى إدخال اسم مجموعة الخيارات رقم ${gi+1}.`
      const min = Number(g.min_select ?? 0), max = Number(g.max_select ?? 1)
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < 1 || min > max) return `قيم الحد الأدنى/الأقصى غير صحيحة في مجموعة "${g.name || gi+1}".`
      if (g.is_required && min < 1) return `المجموعة المطلوبة "${g.name}" يجب أن يكون الحد الأدنى للاختيار 1 على الأقل.`
      if (!g.values.length) return `أضف قيمة واحدة على الأقل في مجموعة "${g.name}".`
      for (const [vi,v] of g.values.entries()) {
        if (!v.name.trim()) return `يرجى إدخال اسم القيمة رقم ${vi+1} في مجموعة "${g.name}".`
        const d = Number(v.price_delta ?? 0)
        if (!Number.isFinite(d)) return `تعديل السعر غير صحيح للقيمة "${v.name || vi+1}".`
      }
    }
    if (draftGroups.length >= 2) {
      if (allCombinations.length === 0) return 'أكمل قيم مجموعات الخيارات لإنشاء تركيبات الأسعار.'
      for (const combo of allCombinations) {
        const key = combo.map(v=>v.tempId).join('|')
        const val = comboPrices[key]
        if (val === undefined || val === '' || !Number.isFinite(Number(val)) || Number(val) < 0) {
          return 'يرجى تحديد سعر صحيح لكل تركيبة ممكنة عند وجود أكثر من مجموعة خيارات.'
        }
      }
    }
    return ''
  }

  async function submit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { showToast(err, 'error'); return }
    if (!categories.length) { showToast('أضف قسماً أولاً قبل إضافة المنتجات.', 'error'); return }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id,
      base_price: Number(form.base_price),
      is_active: !!form.is_active,
      is_available: !!form.is_available,
      sort_order: Number(form.sort_order || 0),
    }
    let res
    if (editing) res = await updateProduct(editing.id, payload)
    else res = await createProduct(payload)
    if (res.error) {
      setSaving(false)
      showToast(mapSupabaseError(res.error, editing ? 'تعذر تعديل المنتج.' : 'تعذر إضافة المنتج.'), 'error')
      return
    }
    const productId = res.data.id

    // save options structure
    const groupsDraft = draftGroups.map((g, gi) => ({
      name: g.name.trim(),
      is_required: !!g.is_required,
      min_select: Number(g.min_select ?? (g.is_required ? 1 : 0)),
      max_select: Number(g.max_select ?? 1),
      sort_order: Number(g.sort_order ?? gi),
      values: g.values.map((v, vi) => ({
        name: v.name.trim(),
        price_delta: Number(v.price_delta ?? 0),
        is_available: v.is_available !== false,
        sort_order: Number(v.sort_order ?? vi),
      })),
    }))
    const optRes = await replaceProductOptions(productId, groupsDraft)
    if (optRes.error) {
      setSaving(false)
      showToast(mapSupabaseError(optRes.error, 'تم حفظ المنتج لكن تعذر حفظ الخيارات.'), 'error')
      await refresh()
      return
    }
    const savedGroups = optRes.data || []
    if (savedGroups.length >= 2) {
      const comboRows = allCombinations.map(combo => {
        // combo elements correspond to draftGroups order and draft values order; map to saved IDs by index
        const valueIds = combo.map((draftVal, gi) => {
          const gDraft = draftGroups[gi]
          const vIdx = gDraft.values.findIndex(v => v.tempId === draftVal.tempId)
          return savedGroups[gi]?.values?.[vIdx]?.id
        }).filter(Boolean)
        const key = combo.map(v=>v.tempId).join('|')
        return { valueIds, price: Number(comboPrices[key]) }
      }).filter(r => r.valueIds.length === savedGroups.length)
      const cRes = await saveProductCombinations(productId, savedGroups, comboRows)
      if (cRes.error) {
        setSaving(false)
        showToast(mapSupabaseError(cRes.error, 'تم حفظ المنتج والخيارات لكن تعذر حفظ أسعار التركيبات.'), 'error')
        await refresh()
        return
      }
    }
    setSaving(false)
    setModalOpen(false)
    showToast(editing ? 'تم تحديث المنتج بنجاح.' : 'تمت إضافة المنتج بنجاح.', 'success')
    await refresh()
  }

  async function confirmDelete() {
    if (!confirmTarget) return
    setDeleting(true)
    const res = await deleteProduct(confirmTarget.id)
    setDeleting(false)
    if (res.error) {
      const code = res.error.code || ''
      const msg = (res.error.message || '').toLowerCase()
      if (code === '23503' || msg.includes('foreign key')) {
        showToast('لا يمكن حذف المنتج لوجود بيانات مرتبطة به (مثل طلبات سابقة). يمكنك إخفاؤه بدلًا من ذلك.', 'error')
      } else {
        showToast(mapSupabaseError(res.error, 'تعذر حذف المنتج.'), 'error')
      }
      setConfirmTarget(null)
      return
    }
    showToast('تم حذف المنتج.', 'success')
    setConfirmTarget(null)
    await refresh()
  }

  if (loading && !products.length && !categories.length) return <div className="admin-empty">جاري تحميل المنتجات…</div>

  return (
    <div>
      <div className="admin-toolbar">
        <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate} disabled={!categories.length}>إضافة منتج</button>
        <input className="admin-input admin-toolbar__control" placeholder="ابحث باسم المنتج..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="admin-select admin-toolbar__control" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
          <option value="all">كل الأقسام</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}{c.is_active !== false ? '' : ' (مخفي)'}</option>)}
        </select>
        <select className="admin-select admin-toolbar__control" value={filterAvail} onChange={e=>setFilterAvail(e.target.value)}>
          <option value="all">كل حالات التوفر</option>
          <option value="available">متوفر</option>
          <option value="unavailable">غير متوفر</option>
        </select>
      </div>
      {!categories.length ? <div className="admin-empty">لا توجد أقسام. أضف قسمًا أولًا قبل إنشاء المنتجات.</div> : null}

      {!filtered.length ? (
        <div className="admin-empty">لا توجد منتجات مطابقة.</div>
      ) : (
        <>
          <div className="admin-table-wrap admin-table-wrap--responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>القسم</th>
                  <th>السعر الأساسي</th>
                  <th>الترتيب</th>
                  <th>الظهور</th>
                  <th>التوفر</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{fontWeight:700}}>{p.name}</div>
                      {p.description ? <div className="admin-help">{p.description}</div> : null}
                    </td>
                    <td>{categoryMap.get(p.category_id)?.name || '-'}</td>
                    <td>{Number(p.base_price)} ج.م</td>
                    <td>{p.sort_order ?? 0}</td>
                    <td><span className={`admin-badge ${p.is_active !== false ? '' : 'admin-badge--muted'}`}>{p.is_active !== false ? 'ظاهر' : 'مخفي'}</span></td>
                    <td><span className={`admin-badge ${p.is_available ? '' : 'admin-badge--danger'}`}>{p.is_available ? 'متوفر' : 'غير متوفر'}</span></td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="admin-btn" onClick={()=>openEdit(p)}>تعديل</button>
                        <button type="button" className="admin-btn admin-btn--danger" onClick={()=>setConfirmTarget(p)}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-list-cards">
            {filtered.map(p => (
              <article key={p.id} className="admin-list-card">
                <div className="admin-list-card__head">
                  <div>
                    <div className="admin-list-card__title">{p.name}</div>
                    {p.description ? <div className="admin-help" style={{marginTop:'.25rem'}}>{p.description}</div> : null}
                  </div>
                  <div className="admin-inline" style={{gap:'.35rem', flexWrap:'wrap', justifyContent:'flex-end'}}>
                    <span className={`admin-badge ${p.is_active !== false ? '' : 'admin-badge--muted'}`}>{p.is_active !== false ? 'ظاهر' : 'مخفي'}</span>
                    <span className={`admin-badge ${p.is_available ? '' : 'admin-badge--danger'}`}>{p.is_available ? 'متوفر' : 'غير متوفر'}</span>
                  </div>
                </div>
                <div className="admin-list-card__meta">
                  <div className="admin-list-card__meta-row"><span>القسم</span><span>{categoryMap.get(p.category_id)?.name || '-'}</span></div>
                  <div className="admin-list-card__meta-row"><span>السعر الأساسي</span><span>{Number(p.base_price)} ج.م</span></div>
                  <div className="admin-list-card__meta-row"><span>الترتيب</span><span>{p.sort_order ?? 0}</span></div>
                </div>
                <div className="admin-list-card__actions">
                  <button type="button" className="admin-btn" onClick={()=>openEdit(p)}>تعديل</button>
                  <button type="button" className="admin-btn admin-btn--danger" onClick={()=>setConfirmTarget(p)}>حذف</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <AdminModal
        open={modalOpen}
        title={editing ? 'تعديل منتج' : 'إضافة منتج'}
        onClose={closeModal}
        size="lg"
        footer={(
          <>
            <button type="button" className="admin-btn" onClick={closeModal} disabled={saving}>إلغاء</button>
            <button type="submit" form="product-form" className="admin-btn admin-btn--primary" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ المنتج'}</button>
          </>
        )}
      >
        <form id="product-form" onSubmit={submit}>
          <div className="admin-grid-2">
            <div className="admin-field" style={{gridColumn:'1 / -1'}}>
              <label htmlFor="p-name">اسم المنتج</label>
              <input id="p-name" className="admin-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="admin-field" style={{gridColumn:'1 / -1'}}>
              <label htmlFor="p-desc">الوصف (اختياري)</label>
              <textarea id="p-desc" className="admin-textarea" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
            </div>
            <div className="admin-field">
              <label htmlFor="p-cat">القسم</label>
              <select id="p-cat" className="admin-select" value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))}>
                <option value="">اختر القسم</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}{c.is_active !== false ? '' : ' (مخفي)'}</option>)}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="p-price">السعر الأساسي (ج.م)</label>
              <input id="p-price" className="admin-input" type="number" min="0" step="0.01" value={form.base_price} onChange={e=>setForm(f=>({...f,base_price:e.target.value}))} />
            </div>
            <div className="admin-field">
              <label htmlFor="p-sort">ترتيب العرض</label>
              <input id="p-sort" className="admin-input" type="number" value={form.sort_order} onChange={e=>setForm(f=>({...f,sort_order:e.target.value}))} />
            </div>
            <div className="admin-grid-2" style={{gridColumn:'1 / -1'}}>
              <label className="admin-check">
                <input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} />
                ظاهر في الموقع (إلغاء التحديد = مخفي)
              </label>
              <label className="admin-check">
                <input type="checkbox" checked={form.is_available} onChange={e=>setForm(f=>({...f,is_available:e.target.checked}))} />
                متوفر للطلب (إلغاء التحديد = غير متوفر)
              </label>
            </div>
          </div>

          <div className="admin-divider" />
          <div className="admin-inline" style={{justifyContent:'space-between', marginBottom:'.5rem'}}>
            <h3 className="admin-subsection-title" style={{margin:0}}>خيارات المنتج</h3>
            <button type="button" className="admin-btn admin-btn--accent" onClick={addGroup}>إضافة مجموعة خيارات</button>
          </div>
          <p className="admin-help" style={{marginBottom:'.75rem'}}>أضف مجموعات مثل الحجم أو النوع، مع قيم وأسعار لكل قيمة عند الحاجة.</p>

          {draftGroups.length === 0 ? <div className="admin-empty">لا توجد مجموعات خيارات لهذا المنتج.</div> : null}

          <div style={{display:'grid', gap:'1rem'}}>
            {draftGroups.map((g, gi) => (
              <div key={g.tempId} className="admin-card">
                <div className="admin-inline" style={{justifyContent:'space-between', marginBottom:'.75rem'}}>
                  <strong>مجموعة {gi+1}</strong>
                  <button type="button" className="admin-btn admin-btn--danger" onClick={()=>removeGroup(gi)}>حذف المجموعة</button>
                </div>
                <div className="admin-grid-3">
                  <div className="admin-field">
                    <label>اسم المجموعة</label>
                    <input className="admin-input" value={g.name} onChange={e=>updateGroup(gi,{name:e.target.value})} placeholder="مثال: الحجم" />
                  </div>
                  <div className="admin-field">
                    <label>الحد الأدنى</label>
                    <input className="admin-input" type="number" min="0" value={g.min_select} onChange={e=>updateGroup(gi,{min_select:e.target.value})} />
                  </div>
                  <div className="admin-field">
                    <label>الحد الأقصى</label>
                    <input className="admin-input" type="number" min="1" value={g.max_select} onChange={e=>updateGroup(gi,{max_select:e.target.value})} />
                  </div>
                  <div className="admin-field">
                    <label>ترتيب المجموعة</label>
                    <input className="admin-input" type="number" value={g.sort_order} onChange={e=>updateGroup(gi,{sort_order:e.target.value})} />
                  </div>
                  <label className="admin-check" style={{alignSelf:'end', paddingBottom:'.6rem'}}>
                    <input type="checkbox" checked={!!g.is_required} onChange={e=>{
                      const checked = e.target.checked
                      updateGroup(gi,{ is_required: checked, min_select: checked ? Math.max(1, Number(g.min_select||1)) : Number(g.min_select||0) })
                    }} />
                    مجموعة مطلوبة
                  </label>
                </div>
                <div className="admin-divider" />
                <div className="admin-inline" style={{justifyContent:'space-between', marginBottom:'.5rem'}}>
                  <span style={{fontWeight:700}}>القيم</span>
                  <button type="button" className="admin-btn" onClick={()=>addValue(gi)}>إضافة قيمة</button>
                </div>
                <div style={{display:'grid', gap:'.5rem'}}>
                  {g.values.map((v, vi) => (
                    <div key={v.tempId} className="admin-grid-3" style={{alignItems:'end', border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)', padding:'.6rem'}}>
                      <div className="admin-field">
                        <label>الاسم</label>
                        <input className="admin-input" value={v.name} onChange={e=>updateValue(gi,vi,{name:e.target.value})} placeholder="مثال: كبير" />
                      </div>
                      <div className="admin-field">
                        <label>تعديل السعر (ج.م)</label>
                        <input className="admin-input" type="number" step="0.01" value={v.price_delta} onChange={e=>updateValue(gi,vi,{price_delta:e.target.value})} />
                      </div>
                      <div className="admin-field">
                        <label>الترتيب</label>
                        <input className="admin-input" type="number" value={v.sort_order} onChange={e=>updateValue(gi,vi,{sort_order:e.target.value})} />
                      </div>
                      <label className="admin-check">
                        <input type="checkbox" checked={v.is_available !== false} onChange={e=>updateValue(gi,vi,{is_available:e.target.checked})} />
                        متاحة
                      </label>
                      <div className="admin-inline" style={{justifyContent:'flex-start'}}>
                        <button type="button" className="admin-btn admin-btn--danger" onClick={()=>removeValue(gi,vi)} disabled={g.values.length <= 1}>حذف القيمة</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {draftGroups.length >= 2 && (
            <>
              <div className="admin-divider" />
              <h3 className="admin-subsection-title">أسعار التركيبات</h3>
              <p className="admin-help" style={{ marginBottom: '.75rem' }}>عند وجود أكثر من مجموعة خيارات يجب تحديد سعر نهائي صريح لكل تركيبة ممكنة. لن يتم تخمين أي سعر.</p>
              {allCombinations.length === 0 ? (
                <div className="admin-empty">أدخل قيمًا لجميع المجموعات لعرض التركيبات.</div>
              ) : (
                <div className="admin-combos">
                  <div className="admin-table-wrap admin-combos__table-wrap">
                    <table className="admin-table admin-combos__table">
                      <thead>
                        <tr>
                          <th>التركيبة</th>
                          <th>السعر النهائي (ج.م)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCombinations.map((combo, idx) => {
                          const key = combo.map((v) => v.tempId).join('|')
                          const label = combo.map((v, gi) => `${draftGroups[gi]?.name || ''}: ${v.name || ''}`).join(' | ')
                          return (
                            <tr key={key || idx}>
                              <td className="admin-combos__label-cell">{label}</td>
                              <td className="admin-combos__price-cell">
                                <input
                                  className="admin-input admin-combos__price-input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  inputMode="decimal"
                                  value={comboPrices[key] ?? ''}
                                  onChange={(e) => setComboPrices((m) => ({ ...m, [key]: e.target.value }))}
                                  placeholder="مثال: 65"
                                  aria-label={`السعر النهائي لـ ${label}`}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="admin-combos__cards" role="list">
                    {allCombinations.map((combo, idx) => {
                      const key = combo.map((v) => v.tempId).join('|')
                      return (
                        <article key={key || idx} className="admin-combo-card" role="listitem">
                          <div className="admin-combo-card__header">
                            <span className="admin-combo-card__index">تركيبة {idx + 1}</span>
                          </div>
                          <ul className="admin-combo-card__parts">
                            {combo.map((v, gi) => (
                              <li key={`${key}-${gi}`} className="admin-combo-card__part">
                                <span className="admin-combo-card__group">{draftGroups[gi]?.name || `مجموعة ${gi + 1}`}</span>
                                <strong className="admin-combo-card__value">{v.name || '-'}</strong>
                              </li>
                            ))}
                          </ul>
                          <div className="admin-field admin-combo-card__price-field">
                            <label htmlFor={`combo-price-${idx}`}>السعر النهائي (ج.م)</label>
                            <input
                              id={`combo-price-${idx}`}
                              className="admin-input"
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={comboPrices[key] ?? ''}
                              onChange={(e) => setComboPrices((m) => ({ ...m, [key]: e.target.value }))}
                              placeholder="مثال: 65"
                            />
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </form>
      </AdminModal>

      <AdminModal
        open={!!confirmTarget}
        title="تأكيد حذف المنتج"
        onClose={()=>!deleting && setConfirmTarget(null)}
        footer={(
          <>
            <button type="button" className="admin-btn" onClick={()=>setConfirmTarget(null)} disabled={deleting}>إلغاء</button>
            <button type="button" className="admin-btn admin-btn--danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'جارٍ الحذف...' : 'حذف المنتج'}</button>
          </>
        )}
      >
        <p>هل أنت متأكد من حذف المنتج "{confirmTarget?.name}"؟</p>
        <p className="admin-help" style={{marginTop:'.5rem'}}>سيتم حذف المنتج وخياراته المرتبطة. لإخفائه مؤقتًا استخدم خيار "مخفي" بدلاً من الحذف.</p>
      </AdminModal>
    </div>
  )
}


