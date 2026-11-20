import { useState } from 'react'
import { restaurantInfo } from '../../data/siteInfo.js'
import {
  buildOrderMessageText,
  buildWhatsAppUrl,
} from '../../lib/whatsapp.js'
import { fetchPublicMenu } from '../../lib/menuApi.js'
import { WhatsAppIcon } from '../common/Icons.jsx'
import './CheckoutForm.css'

const CUSTOMER_INFO_STORAGE_KEY = 'al-alamy-customer-info'
const PERSISTED_CUSTOMER_FIELDS = ['fullName', 'primaryPhone', 'secondaryPhone', 'address']

const initialForm = {
  fullName: '',
  primaryPhone: '',
  secondaryPhone: '',
  address: '',
  notes: '',
}

const phonePattern = /^01\d{9}$/

function readSavedCustomerInfo() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const raw = window.localStorage.getItem(CUSTOMER_INFO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const safe = {}
    for (const field of PERSISTED_CUSTOMER_FIELDS) {
      const value = parsed[field]
      safe[field] = typeof value === 'string' ? value : ''
    }
    return safe
  } catch {
    return null
  }
}

function persistCustomerInfo(form) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    const data = {}
    for (const field of PERSISTED_CUSTOMER_FIELDS) {
      data[field] = typeof form[field] === 'string' ? form[field] : ''
    }
    window.localStorage.setItem(CUSTOMER_INFO_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore storage errors (private mode/quota) without breaking checkout
  }
}

function validate(form) {
  const errors = {}

  if (form.fullName.trim().length < 3) {
    errors.fullName = 'يرجى إدخال الاسم بالكامل (3 أحرف على الأقل).'
  }

  if (!form.primaryPhone.trim()) {
    errors.primaryPhone = 'رقم الموبايل الأساسي مطلوب.'
  } else if (!phonePattern.test(form.primaryPhone.trim())) {
    errors.primaryPhone = 'أدخل رقم موبايل مصري صحيح من 11 رقمًا يبدأ بـ 01.'
  }

  if (
    form.secondaryPhone.trim() &&
    !phonePattern.test(form.secondaryPhone.trim())
  ) {
    errors.secondaryPhone = 'أدخل رقم موبايل مصري صحيح من 11 رقمًا يبدأ بـ 01.'
  }

  if (form.address.trim().length < 10) {
    errors.address = 'يرجى كتابة العنوان بالتفصيل (10 أحرف على الأقل).'
  }

  return errors
}

function CheckoutForm({ items, showToast }) {
  const [form, setForm] = useState(() => ({ ...initialForm, ...(readSavedCustomerInfo() || {}) }))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => {
      const next = { ...current, [name]: value }
      if (PERSISTED_CUSTOMER_FIELDS.includes(name)) {
        persistCustomerInfo(next)
      }
      return next
    })

    if (errors[name]) {
      setErrors((current) => {
        const nextErrors = { ...current }
        delete nextErrors[name]
        return nextErrors
      })
    }

    if (status) {
      setStatus('')
    }
  }


  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validate(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      const firstError = Object.values(nextErrors)[0]
      setStatus('')
      showToast(firstError, 'error')
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await fetchPublicMenu()
      if (error || !data) {
        showToast('تعذر التحقق من توفر المنتجات الآن. حاول مرة أخرى.', 'error')
        setStatus('')
        return
      }

      const orderableIds = new Set((data.products || []).filter(p => p.isOrderable !== false).map(p => p.id))
      const invalidItems = (items || []).filter((it) => !orderableIds.has(it.productId))

      if (invalidItems.length > 0) {
        const msg = 'بعض المنتجات في السلة أصبحت غير متوفرة أو مخفية. يرجى تحديث السلة قبل إتمام الطلب.'
        showToast(msg, 'error')
        setStatus(msg)
        return
      }

      if (!items || items.length === 0) {
        const msg = 'لا توجد منتجات متاحة للطلب في السلة.'
        showToast(msg, 'error')
        setStatus(msg)
        return
      }

      const orderMessage = buildOrderMessageText({ customer: form, items })
      const whatsappUrl = buildWhatsAppUrl(
        restaurantInfo.whatsappInternational,
        orderMessage,
      )

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      setStatus('تم تجهيز رسالة الطلب وفتح واتساب. إذا لم تُفتح النافذة، يرجى السماح بالنوافذ المنبثقة ثم المحاولة مرة أخرى.')
      showToast('تم تجهيز الطلب وفتح واتساب.', 'success')
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <form
      className="checkout-form"
      aria-labelledby="checkout-title"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="checkout-form__heading">
        <p className="checkout-form__eyebrow">بيانات التوصيل</p>
        <h3 className="checkout-form__title" id="checkout-title">
          إتمام الطلب
        </h3>
        <p className="checkout-form__description">
          أدخل بياناتك للتواصل ثم أرسل الطلب مباشرة عبر واتساب.
        </p>
        <p className="checkout-form__saved-note">بياناتك محفوظة على جهازك لتسهيل طلبك القادم.</p>
      </div>

      <div className="checkout-form__fields">
        <div
          className={`form-field${errors.fullName ? ' form-field--error' : ''}`}
        >
          <label htmlFor="fullName">
            الاسم بالكامل
            <span className="form-field__required" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> مطلوب</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="اكتب اسمك بالكامل"
            value={form.fullName}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName ? (
            <p className="form-field__error" id="fullName-error" role="alert">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div
          className={`form-field${errors.primaryPhone ? ' form-field--error' : ''}`}
        >
          <label htmlFor="primaryPhone">
            رقم الموبايل الأساسي
            <span className="form-field__required" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> مطلوب</span>
          </label>
          <input
            id="primaryPhone"
            name="primaryPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="form-field__input--phone"
            placeholder="01xxxxxxxxx"
            value={form.primaryPhone}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.primaryPhone)}
            aria-describedby={
              errors.primaryPhone ? 'primaryPhone-error' : undefined
            }
          />
          {errors.primaryPhone ? (
            <p
              className="form-field__error"
              id="primaryPhone-error"
              role="alert"
            >
              {errors.primaryPhone}
            </p>
          ) : null}
        </div>

        <div
          className={`form-field${errors.secondaryPhone ? ' form-field--error' : ''}`}
        >
          <label htmlFor="secondaryPhone">
            رقم موبايل بديل
            <span className="form-field__optional">(اختياري)</span>
          </label>
          <input
            id="secondaryPhone"
            name="secondaryPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="form-field__input--phone"
            placeholder="01xxxxxxxxx"
            value={form.secondaryPhone}
            onChange={handleChange}
            aria-invalid={Boolean(errors.secondaryPhone)}
            aria-describedby={
              errors.secondaryPhone ? 'secondaryPhone-error' : undefined
            }
          />
          {errors.secondaryPhone ? (
            <p
              className="form-field__error"
              id="secondaryPhone-error"
              role="alert"
            >
              {errors.secondaryPhone}
            </p>
          ) : null}
        </div>

        <div
          className={`form-field${errors.address ? ' form-field--error' : ''}`}
        >
          <label htmlFor="address">
            العنوان بالتفصيل
            <span className="form-field__required" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> مطلوب</span>
          </label>
          <textarea
            id="address"
            name="address"
            autoComplete="street-address"
            placeholder="اكتب العنوان بالتفصيل"
            rows="3"
            value={form.address}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address ? (
            <p className="form-field__error" id="address-error" role="alert">
              {errors.address}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="notes">
            ملاحظات الطلب
            <span className="form-field__optional">(اختياري)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            placeholder="أي تعليمات خاصة أو ملاحظات"
            rows="2"
            value={form.notes}
            onChange={handleChange}
          />
        </div>
      </div>

      <button type="submit" className="checkout-form__submit" disabled={submitting}>
        <WhatsAppIcon size={18} />
        <span>{submitting ? 'جارٍ التحقق...' : 'إرسال الطلب عبر واتساب'}</span>
      </button>
      <p className="checkout-form__note">
        سيتم فتح واتساب مع رسالة جاهزة بالتفاصيل. إذا لم يفتح تلقائيًا راجع إعدادات المتصفح.
      </p>
      {status ? (
        <p className="checkout-form__status" role="status">
          {status}
        </p>
      ) : null}
    </form>
  )
}

export default CheckoutForm
