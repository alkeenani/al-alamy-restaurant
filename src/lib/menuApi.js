import { supabase } from './supabase.js'

async function verifyAdminSession() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) return { user: null, error: userError }
  if (!user) return { user: null, error: { message: 'No authenticated admin session.', code: 'NO_AUTH_SESSION' } }

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return { user: null, error }
  if (!data) return { user: null, error: { message: 'Authenticated user is not authorized as admin.', code: 'NOT_ADMIN' } }
  return { user, error: null }
}

export function mapSupabaseError(error, fallback = 'حدث خطأ غير متوقع. يرجى المحاولة مجدداً.') {
  if (!error) return fallback
  const msg = error.message || ''
  const code = error.code || ''
  if (code === '23505' || msg.includes('duplicate key')) {
    if (msg.includes('slug')) return 'المعرّف (slug) مستخدم بالفعل. يرجى اختيار معرّف مختلف.'
    return 'القيمة مكررة. يرجى التحقق من البيانات.'
  }
  if (code === '23503' || msg.toLowerCase().includes('foreign key')) {
    return 'لا يمكن تنفيذ العملية بسبب وجود بيانات مرتبطة.'
  }
  if (code === '42501' || msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('permission')) {
    return 'ليس لديك صلاحية لتنفيذ هذه العملية.'
  }
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
    return 'تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.'
  }
  return fallback
}

export function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function sortByOrderThenCreated(a, b) {
  const ao = a.sort_order ?? 0
  const bo = b.sort_order ?? 0
  if (ao !== bo) return ao - bo
  return String(a.created_at || '').localeCompare(String(b.created_at || ''))
}

export function buildPublicMenu(categories, products, groups, values, combos, comboValues) {
  const valuesByGroup = new Map()
  for (const v of values || []) {
    if (!valuesByGroup.has(v.option_group_id)) valuesByGroup.set(v.option_group_id, [])
    valuesByGroup.get(v.option_group_id).push(v)
  }
  for (const arr of valuesByGroup.values()) arr.sort(sortByOrderThenCreated)

  const comboValueIdsByCombo = new Map()
  for (const cv of comboValues || []) {
    if (!comboValueIdsByCombo.has(cv.combination_id)) comboValueIdsByCombo.set(cv.combination_id, [])
    comboValueIdsByCombo.get(cv.combination_id).push(cv.option_value_id)
  }

  const combosByProduct = new Map()
  for (const c of combos || []) {
    if (!combosByProduct.has(c.product_id)) combosByProduct.set(c.product_id, [])
    combosByProduct.get(c.product_id).push(c)
  }

  const groupsByProduct = new Map()
  for (const g of groups || []) {
    if (!groupsByProduct.has(g.product_id)) groupsByProduct.set(g.product_id, [])
    groupsByProduct.get(g.product_id).push(g)
  }
  for (const arr of groupsByProduct.values()) arr.sort(sortByOrderThenCreated)

  // Visibility vs availability are independent:
  // categories: is_active = ظاهر/مخفي, is_available = متوفر/غير متوفر حاليًا
  // products:   is_active = ظاهر/مخفي, is_available = متوفر/غير متوفر
  const visibleCategories = (categories || [])
    .filter(c => c.is_active !== false)
    .sort(sortByOrderThenCreated)

  const productsById = new Map()
  for (const p of products || []) {
    if (p.is_active === false) continue
    const cat = (categories || []).find(c => c.id === p.category_id)
    if (!cat || cat.is_active === false) continue

    const pGroups = (groupsByProduct.get(p.id) || []).map(g => {
      const gValues = (valuesByGroup.get(g.id) || []).filter(v => v.is_available !== false)
      return {
        id: g.id,
        name: g.name,
        label: g.name,
        required: g.is_required !== false,
        minSelect: g.min_select ?? (g.is_required !== false ? 1 : 0),
        maxSelect: g.max_select ?? 1,
        sortOrder: g.sort_order ?? 0,
        values: gValues.map(v => ({
          id: v.id,
          name: v.name,
          label: v.name,
          priceDelta: Number(v.price_delta ?? 0),
          sortOrder: v.sort_order ?? 0,
        })),
      }
    }).filter(g => g.values.length > 0)

    const priceMatrix = {}
    for (const combo of (combosByProduct.get(p.id) || [])) {
      const ids = comboValueIdsByCombo.get(combo.id) || []
      if (ids.length === 0) continue
      const selected = []
      for (const g of pGroups) {
        const vid = ids.find(id => g.values.some(v => v.id === id))
        if (vid) selected.push({ groupId: g.id, valueId: vid })
      }
      if (selected.length === 0) continue
      const key = selected.map(s => `${s.groupId}:${s.valueId}`).join('|')
      priceMatrix[key] = Number(combo.price)
    }

    const productAvailable = p.is_available !== false
    const categoryAvailable = cat.is_available !== false
    productsById.set(p.id, {
      id: p.id,
      name: p.name,
      description: p.description || '',
      category: p.category_id,
      categoryId: p.category_id,
      categoryLabel: cat.name,
      categoryAvailable,
      price: Number(p.base_price),
      basePrice: Number(p.base_price),
      isVisible: true,
      isAvailable: productAvailable,
      isOrderable: productAvailable && categoryAvailable,
      sortOrder: p.sort_order ?? 0,
      options: pGroups.map(g => ({
        id: g.id,
        label: g.name,
        required: g.required,
        priceMode: 'adjustment',
        values: g.values.map(v => ({ id: v.id, label: v.name, priceDelta: v.priceDelta })),
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
      })),
      priceMatrix,
    })
  }

  const menuProducts = Array.from(productsById.values()).sort(sortByOrderThenCreated)
  const menuCategories = visibleCategories.map(c => ({
    id: c.id,
    label: c.name,
    slug: c.slug,
    sortOrder: c.sort_order ?? 0,
    isActive: c.is_active !== false,
    isAvailable: c.is_available !== false,
  }))
  return { categories: menuCategories, products: menuProducts }
}

export async function fetchPublicMenu() {
  // Fetch public menu. Visibility/availability are applied in buildPublicMenu
  // with safe defaults (missing columns => visible/available), so this works
  // before and after the visibility/availability migration.
  const [catRes, prodRes, groupRes, valueRes, comboRes, cvRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('product_option_groups').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('product_option_values').select('*').eq('is_available', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('product_option_combinations').select('*'),
    supabase.from('product_option_combination_values').select('*'),
  ])

  const error = catRes.error || prodRes.error || groupRes.error || valueRes.error || comboRes.error || cvRes.error
  if (error) return { data: null, error }

  const menu = buildPublicMenu(catRes.data, prodRes.data, groupRes.data, valueRes.data, comboRes.data, cvRes.data)
  return { data: menu, error: null }
}
export async function fetchAdminMenuData() {
  const [catRes, prodRes, groupRes, valueRes, comboRes, cvRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('product_option_groups').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('product_option_values').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('product_option_combinations').select('*'),
    supabase.from('product_option_combination_values').select('*'),
  ])
  const error = catRes.error || prodRes.error || groupRes.error || valueRes.error || comboRes.error || cvRes.error
  if (error) return { data: null, error }
  return {
    data: {
      categories: catRes.data || [],
      products: prodRes.data || [],
      groups: groupRes.data || [],
      values: valueRes.data || [],
      combinations: comboRes.data || [],
      combinationValues: cvRes.data || [],
    },
    error: null,
  }
}

// Categories
export async function createCategory({ name, slug, is_active = true, is_available = true, sort_order = 0 }) {
  return supabase.from('categories').insert({ name, slug, is_active, is_available, sort_order }).select('*').single()
}
export async function updateCategory(id, patch) {
  return supabase.from('categories').update(patch).eq('id', id).select('*').single()
}
export async function deleteCategory(id) {
  return supabase.from('categories').delete().eq('id', id)
}

export const REQUIRED_MENU_CATEGORIES = [
  { name: 'السندوتشات', slug: 'sandwiches', sort_order: 1 },
  { name: 'الكريب', slug: 'crepes', sort_order: 2 },
  { name: 'أطباق الريزو', slug: 'rizzo-dishes', sort_order: 3 },
  { name: 'أطباق المكرونة', slug: 'pasta-dishes', sort_order: 4 },
  { name: 'البيتزا', slug: 'pizza', sort_order: 5 },
  { name: 'بوكسات اللمة الحلوة', slug: 'sweet-gathering-boxes', sort_order: 6 },
  { name: 'وجبات الفراخ واللحوم', slug: 'chicken-meat-meals', sort_order: 7 },
  { name: 'التسويات الخارجية والشوي', slug: 'outdoor-grill', sort_order: 8 },
]

export const SANDWICHES_CATEGORY_ID = '8682e8a5-f665-4023-a6ec-044b7f5efd8d'
export const CREPES_CATEGORY_ID = '08a1f94f-46b1-4e83-bb00-59ffcb3287b2'
export const PIZZA_CATEGORY_ID = 'ba23bef2-64b2-45c0-ae35-38eb3ebda846'
export const PASTA_CATEGORY_ID = '9adea86a-7696-4c61-b261-ba97f764ba16'
export const RIZZO_CATEGORY_ID = '308e425d-f4bb-458c-a930-426087073aec'
export const CHICKEN_MEAT_MEALS_CATEGORY_ID = '01dfd527-389e-4ed3-980b-8d53031e6468'
export const OUTDOOR_GRILL_CATEGORY_ID = '49b97c08-6fc2-4e81-bd8f-a11866f443e8'
export const SWEET_BOXES_CATEGORY_ID = 'f678db0a-65e9-43d5-bfea-bd48e27e3280'

export const REQUIRED_SANDWICH_PRODUCTS = [
  { name: 'بانيه', base_price: 40 },
  { name: 'زنجر', base_price: 60 },
  { name: 'كرنشي', base_price: 60 },
  { name: 'فاهيتا', base_price: 65 },
  { name: 'شاورما', base_price: 65 },
  { name: 'شيش طاووق', base_price: 65 },
  { name: 'تشيكن برجر', base_price: 90 },
  { name: 'كوردون بلو', base_price: 70 },
  { name: 'كفتة', base_price: 50 },
  { name: 'كبدة', base_price: 45 },
  { name: 'سوسيس', base_price: 45 },
  { name: 'سجق إسكندراني', base_price: 50 },
  { name: 'حواوشي', base_price: 25 },
  { name: 'كباب حلة', base_price: 65 },
  { name: 'داود باشا', base_price: 65 },
  { name: 'روزبيف', base_price: 65 },
  { name: 'كلاسيك برجر', base_price: 80 },
]

export const REQUIRED_CREPE_PRODUCTS = [
  { name: 'كريب بطاطس', base_price: 50 },
  { name: 'بانيه', base_price: 60 },
  { name: 'زنجر', base_price: 80 },
  { name: 'كرنشي', base_price: 80 },
  { name: 'فاهيتا', base_price: 90 },
  { name: 'شيش طاووق', base_price: 90 },
  { name: 'شاورما', base_price: 90 },
  { name: 'كوردون بلو', base_price: 90 },
  { name: 'ميكس فراخ', base_price: 90 },
  { name: 'كونو دجاج', base_price: 100 },
  { name: 'كونو العالمي', base_price: 120 },
  { name: 'داوود باشا', base_price: 95 },
  { name: 'كفتة', base_price: 90 },
  { name: 'كبدة', base_price: 70 },
  { name: 'سوسيس', base_price: 60 },
  { name: 'سجق', base_price: 90 },
  { name: 'روزبيف', base_price: 95 },
  { name: 'كباب حلة', base_price: 95 },
  { name: 'ميكس اللحوم', base_price: 90 },
  { name: 'كونو اللحوم', base_price: 100 },
]

export const REQUIRED_PIZZA_PRODUCTS = [
  { name: 'مارجريتا بالجبن', base_price: 110 },
  { name: 'بيبروني', base_price: 130 },
  { name: 'تشيكن رانش', base_price: 145 },
  { name: 'مكسيكان', base_price: 140 },
  { name: 'تشيكن باربيكيو', base_price: 145 },
  { name: 'بافلو تشيكن', base_price: 135 },
  { name: 'مشكل دجاج', base_price: 140 },
  { name: 'سجق', base_price: 140 },
  { name: 'مشكل لحوم', base_price: 140 },
]

export const REQUIRED_PASTA_PRODUCTS = [
  { name: 'مكرونة بشاميل', base_price: 60 },
  { name: 'مكرونة نجرسكو', base_price: 75 },
  { name: 'مكرونة بانيه / زنجر', base_price: 70 },
  { name: 'مكرونة كرنشي / فاهيتا', base_price: 75 },
  { name: 'مكرونة شيش / شاورما', base_price: 75 },
  { name: 'مكرونة كوردون بلو', base_price: 80 },
  { name: 'مكرونة ميكس فراخ', base_price: 85 },
  { name: 'مكرونة ألفريدو', base_price: 80 },
  { name: 'مكرونة بالكبدة', base_price: 60 },
  { name: 'مكرونة سجق', base_price: 65 },
  { name: 'مكرونة بالكفتة', base_price: 65 },
  { name: 'مكرونة سوسيس', base_price: 60 },
  { name: 'مكرونة روزبيف', base_price: 75 },
  { name: 'مكرونة كباب حلة', base_price: 75 },
  { name: 'مكرونة داود باشا', base_price: 70 },
  { name: 'مكرونة ميكس اللحوم', base_price: 85 },
]

export const REQUIRED_RIZZO_PRODUCTS = [
  { name: 'طبق رز سادة', base_price: 30 },
  { name: 'ريزو فراخ / بانيه', base_price: 65 },
  { name: 'ريزو كرنشي / زنجر', base_price: 70 },
  { name: 'ريزو شاورما / فاهيتا', base_price: 75 },
  { name: 'ريزو شيش طاووق', base_price: 75 },
  { name: 'ريزو كوردون بلو', base_price: 80 },
  { name: 'ريزو كفتة', base_price: 65 },
  { name: 'ريزو كبدة', base_price: 65 },
  { name: 'ريزو سوسيس', base_price: 65 },
  { name: 'ريزو داود باشا', base_price: 75 },
  { name: 'ريزو كباب حلة', base_price: 75 },
  { name: 'ريزو سجق', base_price: 70 },
  { name: 'ريزو روزبيف', base_price: 75 },
]

export const REQUIRED_CHICKEN_MEAT_MEAL_PRODUCTS = [
  { name: 'فراخ بالبطاطس (ربع)', base_price: 75 },
  { name: 'فراخ بالبطاطس (نصف)', base_price: 140 },
  { name: 'فراخ مشوية (ربع)', base_price: 80 },
  { name: 'فراخ مشوية (نصف)', base_price: 150 },
  { name: 'وجبة شيش طاووق', base_price: 120 },
  { name: 'وجبة كريسبي', base_price: 125 },
  { name: 'وجبة كوردون', base_price: 125 },
  { name: 'وجبة كفتة', base_price: 110 },
  { name: 'وجبة سجق', base_price: 110 },
  { name: 'وجبة كبدة', base_price: 110 },
  { name: 'وجبة كباب حلة', base_price: 125 },
  { name: 'وجبة داود باشا', base_price: 125 },
  { name: 'ميكس العالمي', base_price: 140 },
]

export const REQUIRED_OUTDOOR_GRILL_PRODUCTS = [
  { name: 'شوي كيلو كفتة', base_price: 70 },
  { name: 'شوي فرخة', base_price: 60 },
  { name: 'تسوية بطة', base_price: 90 },
  { name: 'تسوية رومي', base_price: 180 },
]

export const REQUIRED_SWEET_BOX_PRODUCTS = [
  { name: 'بوكس الشعب', base_price: 130, description: '1 كبدة + 1 كفتة + 1 سجق + 1 حلو + بطاطس' },
  { name: 'بوكس الصحاب', base_price: 390, description: '3 روزبيف + 3 سجق + 3 كباب حلة + 3 شيش طاووق + 3 حلو + 3 بانيه' },
  { name: 'بوكس التوينز', base_price: 290, description: '2 كرنشي + 2 كوردون بلو + 2 كفتة + 2 حلو' },
  { name: 'بوكس ميكسي', base_price: 250, description: 'ميكس حواوشي + كرنشي رانش + كفتة فاهيتا + بطاطس' },
]

export async function ensureRequiredSandwichProducts() {
  const { user, error: authError } = await verifyAdminSession()
  if (authError || !user) {
    return { data: null, error: authError || { message: 'Admin authorization required for product sync.', code: 'NOT_ADMIN' }, report: null }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    .eq('category_id', SANDWICHES_CATEGORY_ID)

  if (fetchError) return { data: null, error: fetchError, report: null }

  const existingByName = new Map((existing || []).map((p) => [p.name, p]))
  const maxSort = (existing || []).reduce((m, p) => Math.max(m, Number(p.sort_order ?? 0)), 0)
  const report = { existing: [], added: [], updated: [], removed: [], errors: [] }

  // Update existing
  for (const req of REQUIRED_SANDWICH_PRODUCTS) {
    const found = existingByName.get(req.name)
    if (!found) continue
    const patch = {}
    if (Number(found.base_price) !== Number(req.base_price)) patch.base_price = req.base_price
    if ((found.description || null) !== (req.description ?? null)) patch.description = req.description ?? null
    if (Object.keys(patch).length) {
      const upRes = await updateProduct(found.id, patch)
      if (upRes.error) { report.errors.push({ name: req.name, action: 'update', error: upRes.error }); return { data: { report }, error: upRes.error, report } }
      report.updated.push({ id: found.id, name: req.name })
    } else {
      report.existing.push({ id: found.id, name: found.name, base_price: Number(found.base_price), category_id: found.category_id })
    }
  }

  // Insert missing
  const toInsert = []
  REQUIRED_SANDWICH_PRODUCTS.forEach((req, idx) => {
    if (!existingByName.get(req.name)) {
      toInsert.push({ name: req.name, base_price: req.base_price, category_id: SANDWICHES_CATEGORY_ID, is_active: true, is_available: true, description: req.description ?? null, sort_order: maxSort + 1 + idx })
    }
  })
  if (toInsert.length) {
    const { data: inserted, error: insertError } = await supabase.from('products').insert(toInsert).select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    if (insertError) { report.errors.push({ action: 'insert', error: insertError }); return { data: { report }, error: insertError, report } }
    report.added = (inserted || []).map((p) => ({ id: p.id, name: p.name, base_price: Number(p.base_price), category_id: p.category_id }))
  }

  // Preserve existing products/categories. Do not delete items not in the required list during sync.

  const error = report.errors[0]?.error || null
  return { data: { report }, error, report }
}

export async function ensureRequiredCrepeProducts() {
  const { user, error: authError } = await verifyAdminSession()
  if (authError || !user) {
    return { data: null, error: authError || { message: 'Admin authorization required for product sync.', code: 'NOT_ADMIN' }, report: null }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    .eq('category_id', CREPES_CATEGORY_ID)

  if (fetchError) return { data: null, error: fetchError, report: null }

  const existingByName = new Map((existing || []).map((p) => [p.name, p]))
  const maxSort = (existing || []).reduce((m, p) => Math.max(m, Number(p.sort_order ?? 0)), 0)
  const report = { existing: [], added: [], updated: [], removed: [], errors: [] }

  for (const req of REQUIRED_CREPE_PRODUCTS) {
    const found = existingByName.get(req.name)
    if (!found) continue
    const patch = {}
    if (Number(found.base_price) !== Number(req.base_price)) patch.base_price = req.base_price
    if ((found.description || null) !== (req.description ?? null)) patch.description = req.description ?? null
    if (Object.keys(patch).length) {
      const upRes = await updateProduct(found.id, patch)
      if (upRes.error) { report.errors.push({ name: req.name, action: 'update', error: upRes.error }); return { data: { report }, error: upRes.error, report } }
      report.updated.push({ id: found.id, name: req.name })
    } else {
      report.existing.push({ id: found.id, name: found.name, base_price: Number(found.base_price), category_id: found.category_id })
    }
  }

  const toInsert = []
  REQUIRED_CREPE_PRODUCTS.forEach((req, idx) => {
    if (!existingByName.get(req.name)) {
      toInsert.push({ name: req.name, base_price: req.base_price, category_id: CREPES_CATEGORY_ID, is_active: true, is_available: true, description: req.description ?? null, sort_order: maxSort + 1 + idx })
    }
  })
  if (toInsert.length) {
    const { data: inserted, error: insertError } = await supabase.from('products').insert(toInsert).select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    if (insertError) { report.errors.push({ action: 'insert', error: insertError }); return { data: { report }, error: insertError, report } }
    report.added = (inserted || []).map((p) => ({ id: p.id, name: p.name, base_price: Number(p.base_price), category_id: p.category_id }))
  }

  // Preserve existing products. Do not delete items not in the required list during sync.

  const error = report.errors[0]?.error || null
  return { data: { report }, error, report }
}

export async function ensureRequiredPizzaProducts() {
  const { user, error: authError } = await verifyAdminSession()
  if (authError || !user) {
    return { data: null, error: authError || { message: 'Admin authorization required for product sync.', code: 'NOT_ADMIN' }, report: null }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    .eq('category_id', PIZZA_CATEGORY_ID)

  if (fetchError) return { data: null, error: fetchError, report: null }

  const report = { existing: [], added: [], updated: [], removed: [], errors: [] }

  // 1) Rename old "كرنشي رانش" -> "تشيكن رانش" if present and new name not present (preserve id)
  const oldCrunchy = (existing || []).find((p) => p.name === 'كرنشي رانش')
  const hasNewName = (existing || []).some((p) => p.name === 'تشيكن رانش')
  if (oldCrunchy && !hasNewName) {
    const upRes = await updateProduct(oldCrunchy.id, { name: 'تشيكن رانش', base_price: 145, description: oldCrunchy.description ?? null })
    if (upRes.error) {
      report.errors.push({ name: 'كرنشي رانش->تشيكن رانش', action: 'rename', error: upRes.error })
      return { data: { report }, error: upRes.error, report }
    }
    report.updated.push({ id: oldCrunchy.id, name: 'تشيكن رانش (renamed from كرنشي رانش)' })
  } else if (oldCrunchy && hasNewName && oldCrunchy.id !== (existing || []).find((p) => p.name === 'بيتزا تشيكن')?.id) {
    // Preserve existing records (no deletions during sync).
  } else if (oldCrunchy && hasNewName && oldCrunchy.id === (existing || []).find((p) => p.name === 'بيتزا تشيكن')?.id) {
    // same record already named correctly (shouldn't happen), just ensure price
    const upRes = await updateProduct(oldCrunchy.id, { base_price: 145 })
    if (upRes.error) {
      report.errors.push({ name: 'تشيكن رانش', action: 'update', error: upRes.error })
      return { data: { report }, error: upRes.error, report }
    }
  }

  // Re-fetch after possible rename/delete to be safe
  const { data: existing2, error: fetchError2 } = await supabase
    .from('products')
    .select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    .eq('category_id', PIZZA_CATEGORY_ID)
  if (fetchError2) return { data: null, error: fetchError2, report: null }

  const existingByName2 = new Map((existing2 || []).map((p) => [p.name, p]))
  const maxSort2 = (existing2 || []).reduce((m, p) => Math.max(m, Number(p.sort_order ?? 0)), 0)

  // 2) Update existing required items to exact prices/descriptions/availability
  for (const req of REQUIRED_PIZZA_PRODUCTS) {
    const found = existingByName2.get(req.name)
    if (!found) continue
    const patch = {}
    if (Number(found.base_price) !== Number(req.base_price)) patch.base_price = req.base_price
    if ((found.description || null) !== (req.description ?? null)) patch.description = req.description ?? null
    if (Object.keys(patch).length) {
      const upRes = await updateProduct(found.id, patch)
      if (upRes.error) {
        report.errors.push({ name: req.name, action: 'update', error: upRes.error })
        return { data: { report }, error: upRes.error, report }
      }
      report.updated.push({ id: found.id, name: req.name })
    } else {
      report.existing.push({ id: found.id, name: req.name, base_price: Number(found.base_price), category_id: found.category_id })
    }
  }

  // 3) Insert any missing required items
  const toInsert = []
  REQUIRED_PIZZA_PRODUCTS.forEach((req, idx) => {
    if (!existingByName2.get(req.name)) {
      toInsert.push({
        name: req.name,
        base_price: req.base_price,
        category_id: PIZZA_CATEGORY_ID,
        is_active: true,
        is_available: true,
        description: req.description ?? null,
        sort_order: maxSort2 + 1 + idx,
      })
    }
  })
  if (toInsert.length) {
    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert(toInsert)
      .select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    if (insertError) {
      report.errors.push({ action: 'insert', error: insertError })
      return { data: { report }, error: insertError, report }
    }
    report.added = (inserted || []).map((p) => ({ id: p.id, name: p.name, base_price: Number(p.base_price), category_id: p.category_id }))
  }

  // Preserve existing products. Do not delete items not in the required list during sync.

  const error = report.errors[0]?.error || null
  return { data: { report }, error, report }
}

async function ensureSimpleRequiredProducts(categoryId, requiredProducts) {
  const { user, error: authError } = await verifyAdminSession()
  if (authError || !user) {
    return { data: null, error: authError || { message: 'Admin authorization required for product sync.', code: 'NOT_ADMIN' }, report: null }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    .eq('category_id', categoryId)

  if (fetchError) return { data: null, error: fetchError, report: null }

  const existingByName = new Map((existing || []).map((p) => [p.name, p]))
  const maxSort = (existing || []).reduce((m, p) => Math.max(m, Number(p.sort_order ?? 0)), 0)
  const report = { existing: [], added: [], updated: [], removed: [], errors: [] }

  // Update existing items that match required names (price/description/availability)
  for (const req of requiredProducts) {
    const found = existingByName.get(req.name)
    if (!found) continue
    const patch = {}
    if (Number(found.base_price) !== Number(req.base_price)) patch.base_price = req.base_price
    if ((found.description || null) !== (req.description ?? null)) patch.description = req.description ?? null
    if (Object.keys(patch).length) {
      const upRes = await updateProduct(found.id, patch)
      if (upRes.error) {
        report.errors.push({ name: req.name, action: 'update', error: upRes.error })
        return { data: { report }, error: upRes.error, report }
      }
      report.updated.push({ id: found.id, name: req.name })
    } else {
      report.existing.push({ id: found.id, name: found.name, base_price: Number(found.base_price), category_id: found.category_id })
    }
  }

  // Insert missing
  const toInsert = []
  requiredProducts.forEach((req, idx) => {
    if (!existingByName.get(req.name)) {
      toInsert.push({
        name: req.name,
        base_price: req.base_price,
        category_id: categoryId,
        is_active: true,
        is_available: true,
        description: req.description ?? null,
        sort_order: maxSort + 1 + idx,
      })
    }
  })
  if (toInsert.length) {
    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert(toInsert)
      .select('id,name,base_price,category_id,sort_order,is_active,is_available,description')

    if (insertError) {
      report.errors.push({ action: 'insert', error: insertError })
      return { data: { report }, error: insertError, report }
    }
    report.added = (inserted || []).map((p) => ({ id: p.id, name: p.name, base_price: Number(p.base_price), category_id: p.category_id }))
  }

  // Preserve existing products. Do not delete items not in the required list during sync.

  const error = report.errors[0]?.error || null
  return { data: { report }, error, report }
}

export async function ensureRequiredPastaProducts() {
  return ensureSimpleRequiredProducts(PASTA_CATEGORY_ID, REQUIRED_PASTA_PRODUCTS)
}

export async function ensureRequiredRizzoProducts() {
  return ensureSimpleRequiredProducts(RIZZO_CATEGORY_ID, REQUIRED_RIZZO_PRODUCTS)
}

export async function ensureRequiredChickenMeatMealProducts() {
  const { user, error: authError } = await verifyAdminSession()
  if (authError || !user) {
    return { data: null, error: authError || { message: 'Admin authorization required for product sync.', code: 'NOT_ADMIN' }, report: null }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id,name,base_price,category_id,sort_order,is_active,is_available,description')
    .eq('category_id', CHICKEN_MEAT_MEALS_CATEGORY_ID)

  if (fetchError) return { data: null, error: fetchError, report: null }

  const existingByName = new Map((existing || []).map((p) => [p.name, p]))
  const maxSort = (existing || []).reduce((m, p) => Math.max(m, Number(p.sort_order ?? 0)), 0)
  const report = { existing: [], added: [], removed: [], errors: [] }

  // Preserve existing products. Do not delete items not in the required list during sync.

  let sortCursor = maxSort + 1
  for (const req of REQUIRED_CHICKEN_MEAT_MEAL_PRODUCTS) {
    const found = existingByName.get(req.name)
    if (found) {
      // Update base price/description if changed
      const patch = {}
      if (Number(found.base_price) !== Number(req.base_price)) patch.base_price = req.base_price
      if ((found.description || null) !== (req.description ?? null)) patch.description = req.description ?? null
      if (Object.keys(patch).length) {
        const upRes = await updateProduct(found.id, patch)
        if (upRes.error) {
          report.errors.push({ name: req.name, action: 'update', error: upRes.error })
          return { data: { report }, error: upRes.error, report }
        }
      }
      // Remove any options/groups if present (cleanup old size groups)
      await replaceProductOptions(found.id, [])
      report.existing.push({ id: found.id, name: found.name, base_price: Number(req.base_price), category_id: found.category_id })
      continue
    }

    const prodRes = await supabase.from('products').insert({
      name: req.name,
      base_price: req.base_price,
      category_id: CHICKEN_MEAT_MEALS_CATEGORY_ID,
      is_active: true,
      is_available: true,
      description: req.description ?? null,
      sort_order: sortCursor++,
    }).select('id,name,base_price,category_id,sort_order,is_active,is_available').single()

    if (prodRes.error) {
      report.errors.push({ name: req.name, action: 'insert', error: prodRes.error })
      return { data: { report }, error: prodRes.error, report }
    }
    // ensure no options
    await replaceProductOptions(prodRes.data.id, [])
    report.added.push({ id: prodRes.data.id, name: prodRes.data.name, base_price: Number(prodRes.data.base_price), category_id: prodRes.data.category_id })
  }

  const error = report.errors[0]?.error || null
  return { data: { report }, error, report }
}

export async function ensureRequiredOutdoorGrillProducts() {
  return ensureSimpleRequiredProducts(OUTDOOR_GRILL_CATEGORY_ID, REQUIRED_OUTDOOR_GRILL_PRODUCTS)
}

export async function ensureRequiredSweetBoxProducts() {
  return ensureSimpleRequiredProducts(SWEET_BOXES_CATEGORY_ID, REQUIRED_SWEET_BOX_PRODUCTS)
}

export async function ensureRequiredMenuCategories(existingCategories) {
  const { user, error: authError } = await verifyAdminSession()
  if (authError || !user) {
    return { data: null, error: authError || { message: 'Admin authorization required for category sync.', code: 'NOT_ADMIN' }, report: null }
  }

  let categories = existingCategories
  if (!Array.isArray(categories)) {
    const { data, error } = await supabase.from('categories').select('*')
    if (error) return { data: null, error, report: null }
    categories = data || []
  }

  const report = { existing: [], added: [], updated: [], errors: [] }

  for (const required of REQUIRED_MENU_CATEGORIES) {
    let match = categories.find((c) => c.slug === required.slug)
    if (!match && required.slug === 'sandwiches') {
      match = categories.find((c) => c.id === '8682e8a5-f665-4023-a6ec-044b7f5efd8d' || String(c.name || '').includes('ساندوتش'))
    }
    if (!match && required.slug === 'crepes') {
      match = categories.find((c) => c.id === '08a1f94f-46b1-4e83-bb00-59ffcb3287b2' || String(c.name || '').includes('كريب'))
    }
    if (!match) match = categories.find((c) => c.name === required.name)

    if (match) {
      const patch = {}
      if (match.name !== required.name) patch.name = required.name
      if (match.slug !== required.slug) patch.slug = required.slug
      if (Number(match.sort_order ?? 0) !== required.sort_order) patch.sort_order = required.sort_order
      // Preserve admin-controlled visibility/availability. Never reactivate hidden categories.

      if (Object.keys(patch).length) {
        const res = await updateCategory(match.id, patch)
        if (res.error) {
          report.errors.push({ name: required.name, action: 'update', id: match.id, error: res.error })
        } else {
          report.updated.push({ id: match.id, name: res.data.name, slug: res.data.slug, sort_order: res.data.sort_order })
          categories = categories.map((c) => (c.id === match.id ? res.data : c))
        }
      } else {
        report.existing.push({ id: match.id, name: match.name, slug: match.slug, sort_order: match.sort_order })
      }
    } else {
      const res = await createCategory({ ...required, is_active: true, is_available: true })
      if (res.error) {
        report.errors.push({ name: required.name, action: 'create', error: res.error })
      } else {
        report.added.push({ id: res.data.id, name: res.data.name, slug: res.data.slug, sort_order: res.data.sort_order })
        categories = [...categories, res.data]
      }
    }
  }

  // keep any non-required existing categories after the required 8 without deleting them
  const requiredSlugs = new Set(REQUIRED_MENU_CATEGORIES.map((c) => c.slug))
  const extras = categories
    .filter((c) => !requiredSlugs.has(c.slug) && !REQUIRED_MENU_CATEGORIES.some((r) => r.name === c.name))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')))

  let extraOrder = REQUIRED_MENU_CATEGORIES.length + 1
  for (const extra of extras) {
    if (Number(extra.sort_order ?? 0) !== extraOrder) {
      const res = await updateCategory(extra.id, { sort_order: extraOrder })
      if (res.error) {
        report.errors.push({ name: extra.name, action: 'reorder-extra', id: extra.id, error: res.error })
      } else {
        categories = categories.map((c) => (c.id === extra.id ? res.data : c))
      }
    }
    extraOrder += 1
  }

  const error = report.errors[0]?.error || null
  return { data: { categories, report }, error, report }
}

// Products
export async function createProduct(payload) {
  return supabase.from('products').insert(payload).select('*').single()
}
export async function updateProduct(id, patch) {
  return supabase.from('products').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
}
export async function deleteProduct(id) {
  // delete dependent option data first (if FK cascade not present); best effort
  const { data: groups } = await supabase.from('product_option_groups').select('id').eq('product_id', id)
  const groupIds = (groups || []).map(g => g.id)
  if (groupIds.length) {
    const { data: vals } = await supabase.from('product_option_values').select('id').in('option_group_id', groupIds)
    const valIds = (vals || []).map(v => v.id)
    const { data: combos } = await supabase.from('product_option_combinations').select('id').eq('product_id', id)
    const comboIds = (combos || []).map(c => c.id)
    if (comboIds.length) {
      await supabase.from('product_option_combination_values').delete().in('combination_id', comboIds)
      await supabase.from('product_option_combinations').delete().in('id', comboIds)
    }
    if (valIds.length) {
      await supabase.from('product_option_values').delete().in('id', valIds)
    }
    await supabase.from('product_option_groups').delete().in('id', groupIds)
  } else {
    const { data: combos } = await supabase.from('product_option_combinations').select('id').eq('product_id', id)
    const comboIds = (combos || []).map(c => c.id)
    if (comboIds.length) {
      await supabase.from('product_option_combination_values').delete().in('combination_id', comboIds)
      await supabase.from('product_option_combinations').delete().in('id', comboIds)
    }
  }
  return supabase.from('products').delete().eq('id', id)
}

// Option groups/values/combos helpers (admin)
export async function replaceProductOptions(productId, groupsDraft) {
  // groupsDraft: [{id?, name, is_required, min_select, max_select, sort_order, values:[{id?, name, price_delta, is_available, sort_order}]}]
  // Fetch existing
  const { data: existingGroups } = await supabase.from('product_option_groups').select('id').eq('product_id', productId)
  const existingGroupIds = (existingGroups || []).map(g => g.id)
  let existingValueIds = []
  if (existingGroupIds.length) {
    const { data: ev } = await supabase.from('product_option_values').select('id').in('option_group_id', existingGroupIds)
    existingValueIds = (ev || []).map(v => v.id)
  }
  const { data: existingCombos } = await supabase.from('product_option_combinations').select('id').eq('product_id', productId)
  const existingComboIds = (existingCombos || []).map(c => c.id)

  // wipe combos and links (pricing depends on values/groups structure)
  if (existingComboIds.length) {
    await supabase.from('product_option_combination_values').delete().in('combination_id', existingComboIds)
    await supabase.from('product_option_combinations').delete().in('id', existingComboIds)
  }
  if (existingValueIds.length) await supabase.from('product_option_values').delete().in('id', existingValueIds)
  if (existingGroupIds.length) await supabase.from('product_option_groups').delete().in('id', existingGroupIds)

  const savedGroups = []
  for (let gi = 0; gi < (groupsDraft || []).length; gi++) {
    const g = groupsDraft[gi]
    const gRes = await supabase.from('product_option_groups').insert({
      product_id: productId,
      name: g.name,
      is_required: !!g.is_required,
      min_select: Number(g.min_select ?? (g.is_required ? 1 : 0)),
      max_select: Number(g.max_select ?? 1),
      sort_order: Number(g.sort_order ?? gi),
    }).select('*').single()
    if (gRes.error) return { error: gRes.error }
    const savedValues = []
    for (let vi = 0; vi < (g.values || []).length; vi++) {
      const v = g.values[vi]
      const vRes = await supabase.from('product_option_values').insert({
        option_group_id: gRes.data.id,
        name: v.name,
        price_delta: Number(v.price_delta ?? 0),
        is_available: v.is_available !== false,
        sort_order: Number(v.sort_order ?? vi),
      }).select('*').single()
      if (vRes.error) return { error: vRes.error }
      savedValues.push(vRes.data)
    }
    savedGroups.push({ ...gRes.data, values: savedValues })
  }
  return { data: savedGroups, error: null }
}

export async function saveProductCombinations(productId, groupsWithSavedValues, combinationRows) {
  // combinationRows: [{ valueIds: [..ids in any order], price }]
  // remove existing
  const { data: existingCombos } = await supabase.from('product_option_combinations').select('id').eq('product_id', productId)
  const existingComboIds = (existingCombos || []).map(c => c.id)
  if (existingComboIds.length) {
    await supabase.from('product_option_combination_values').delete().in('combination_id', existingComboIds)
    await supabase.from('product_option_combinations').delete().in('id', existingComboIds)
  }
  for (const row of (combinationRows || [])) {
    // deterministic key by group order
    const ordered = []
    for (const g of groupsWithSavedValues) {
      const vid = row.valueIds.find(id => g.values.some(v => v.id === id))
      if (vid) ordered.push({ groupId: g.id, valueId: vid })
    }
    const combination_key = ordered.map(s => `${s.groupId}:${s.valueId}`).join('|')
    const cRes = await supabase.from('product_option_combinations').insert({
      product_id: productId,
      combination_key,
      price: Number(row.price),
    }).select('*').single()
    if (cRes.error) return { error: cRes.error }
    const linkRows = ordered.map(s => ({ combination_id: cRes.data.id, option_value_id: s.valueId }))
    if (linkRows.length) {
      const lRes = await supabase.from('product_option_combination_values').insert(linkRows)
      if (lRes.error) return { error: lRes.error }
    }
  }
  return { error: null }
}

