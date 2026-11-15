import { supabase } from './supabase.js'

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

  const activeCategories = (categories || []).filter(c => c.is_active).sort(sortByOrderThenCreated)

  const productsById = new Map()
  for (const p of products || []) {
    if (!p.is_available) continue
    const cat = (categories || []).find(c => c.id === p.category_id)
    if (!cat || !cat.is_active) continue

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
      // build key by group order using selected values
      const selected = []
      for (const g of pGroups) {
        const vid = ids.find(id => g.values.some(v => v.id === id))
        if (vid) selected.push({ groupId: g.id, valueId: vid })
      }
      if (selected.length === 0) continue
      const key = selected.map(s => `${s.groupId}:${s.valueId}`).join('|')
      priceMatrix[key] = Number(combo.price)
    }

    productsById.set(p.id, {
      id: p.id,
      name: p.name,
      description: p.description || '',
      category: p.category_id,
      categoryId: p.category_id,
      categoryLabel: cat.name,
      price: Number(p.base_price),
      basePrice: Number(p.base_price),
      isAvailable: !!p.is_available,
      sortOrder: p.sort_order ?? 0,
      options: pGroups.map(g => ({
        id: g.id,
        label: g.name,
        required: g.required,
        // use adjustment mode with base_price + price_delta; combinations override via priceMatrix
        priceMode: 'adjustment',
        values: g.values.map(v => ({ id: v.id, label: v.name, priceDelta: v.priceDelta })),
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
      })),
      priceMatrix,
    })
  }

  const menuProducts = Array.from(productsById.values()).sort(sortByOrderThenCreated)
  const menuCategories = activeCategories.map(c => ({ id: c.id, label: c.name, slug: c.slug, sortOrder: c.sort_order ?? 0 }))
  return { categories: menuCategories, products: menuProducts }
}

export async function fetchPublicMenu() {
  const [catRes, prodRes, groupRes, valueRes, comboRes, cvRes] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('products').select('*').eq('is_available', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
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
export async function createCategory({ name, slug, is_active = true, sort_order = 0 }) {
  return supabase.from('categories').insert({ name, slug, is_active, sort_order }).select('*').single()
}
export async function updateCategory(id, patch) {
  return supabase.from('categories').update(patch).eq('id', id).select('*').single()
}
export async function deleteCategory(id) {
  return supabase.from('categories').delete().eq('id', id)
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
