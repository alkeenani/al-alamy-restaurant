import { formatPrice } from './formatPrice.js'

export function buildWhatsAppUrl(phone, message = '') {
  const baseUrl = `https://wa.me/${phone}`

  if (!message) {
    return baseUrl
  }

  return `${baseUrl}?text=${encodeURIComponent(message)}`
}

export function buildOrderMessage({ customer, items, total }) {
  const lines = [
    'السلام عليكم، أريد طلب من مطعم العالمي.',
    '',
    'بيانات العميل:',
    `الاسم: ${customer.fullName.trim()}`,
    `رقم الهاتف: ${customer.primaryPhone.trim()}`,
  ]

  if (customer.secondaryPhone.trim()) {
    lines.push(`رقم الهاتف البديل: ${customer.secondaryPhone.trim()}`)
  }

  lines.push(`العنوان: ${customer.address.trim()}`, '', 'تفاصيل الطلب:', '')

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`)

    item.options.forEach((option) => {
      lines.push(`   ${option.groupLabel}: ${option.label}`)
    })

    lines.push(
      `   الكمية: ${item.quantity}`,
      `   سعر الوحدة: ${formatPrice(item.unitPrice)}`,
      `   الإجمالي: ${formatPrice(item.subtotal)}`,
      '',
    )
  })

  lines.push(`الإجمالي النهائي: ${formatPrice(total)}`)

  if (customer.notes.trim()) {
    lines.push('', `ملاحظات: ${customer.notes.trim()}`)
  }

  return lines.join('\n')
}
