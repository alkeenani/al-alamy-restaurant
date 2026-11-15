import { useState } from 'react'
import { restaurantInfo } from '../../data/siteInfo.js'
import {
  buildOrderMessage,
  buildWhatsAppUrl,
} from '../../lib/whatsapp.js'
import { WhatsAppIcon } from '../common/Icons.jsx'
import './CheckoutForm.css'

const initialForm = {
  fullName: '',
  primaryPhone: '',
  secondaryPhone: '',
  address: '',
  notes: '',
}

const phonePattern = /^01\d{9}$/

function validate(form) {
  const errors = {}

  if (form.fullName.trim().length < 3) {
    errors.fullName = 'يرجى إدخال الاسم بالكامل (3 أحرف على الأقل).'
  }

  if (!form.primaryPhone.trim()) {
    errors.primaryPhone = 'رقم الموبايل الأساسي مطلوب.'
  } else if (!phonePattern.test(form.primaryPhone.trim())) {
    errors.primaryPhone =
      'أدخل رقم موبايل صحيح مكوّن من 11 رقماً يبدأ بـ 01.'
  }

  if (
    form.secondaryPhone.trim() &&
    !phonePattern.test(form.secondaryPhone.trim())
  ) {
    errors.secondaryPhone =
      'أدخل رقم موبايل بديل صحيح مكوّن من 11 رقماً يبدأ بـ 01.'
  }

  if (form.address.trim().length < 10) {
    errors.address = 'يرجى إدخال العنوان بالتفصيل (10 أحرف على الأقل).'
  }

  return errors
}

function CheckoutForm({ items, total, showToast }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({ ...current, [name]: value }))

    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }

    if (status) {
      setStatus('')
    }
  }

  function handleSubmit(event) {
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

    const orderMessage = buildOrderMessage({ customer: form, items, total })
    const whatsappUrl = buildWhatsAppUrl(
      restaurantInfo.whatsappInternational,
      orderMessage,
    )

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    setStatus(
      'تم تجهيز طلبك، برجاء إكمال الإرسال عبر واتساب. لم يتم تأكيد الطلب بعد.',
    )
    showToast(
      'تم تجهيز طلبك، برجاء إكمال الإرسال عبر واتساب.',
      'success',
    )
  }

  return (
    <form
      className="checkout-form"
      aria-labelledby="checkout-title"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="checkout-form__heading">
        <p className="checkout-form__eyebrow">الخطوة الأخيرة</p>
        <h3 className="checkout-form__title" id="checkout-title">
          بيانات العميل
        </h3>
        <p className="checkout-form__description">
          أدخل بياناتك للتواصل، ثم أكمل إرسال الطلب عبر واتساب.
        </p>
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
            placeholder="أدخل اسمك بالكامل"
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
            placeholder="أدخل عنوانك بالتفصيل"
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
            placeholder="أي تفاصيل إضافية عن الطلب"
            rows="2"
            value={form.notes}
            onChange={handleChange}
          />
        </div>
      </div>

      <button type="submit" className="checkout-form__submit">
        <WhatsAppIcon size={18} />
        <span>تأكيد الطلب</span>
      </button>
      <p className="checkout-form__note">
        سيتم فتح واتساب بعد التحقق من البيانات لإرسال الطلب. لا يُعد الطلب
        مؤكداً قبل إتمام الإرسال من واتساب.
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
