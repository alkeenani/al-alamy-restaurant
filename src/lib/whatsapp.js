import { formatPrice } from './formatPrice.js'
import { computeCartSummary } from './cart.js'

export function buildWhatsAppUrl(phone, message = '') {
  const baseUrl = `https://wa.me/${phone}`

  if (!message) {
    return baseUrl
  }

  return `${baseUrl}?text=${encodeURIComponent(message)}`
}

export function buildOrderMessage({ customer, items }) {
  const summary = computeCartSummary(items)
  const safeCustomer = customer || {}
  const lines = [
    'السلام عليكم، أريد طلب من مطعم العالمي.',
    '',
    'بيانات العميل:',
    `الاسم: ${String(safeCustomer.fullName || '').trim()}`,
    `رقم الهاتف: ${String(safeCustomer.primaryPhone || '').trim()}`,
  ]

  const secondaryPhone = String(safeCustomer.secondaryPhone || '').trim()
  if (secondaryPhone) {
    lines.push(`رقم الهاتف البديل: ${secondaryPhone}`)
  }

  lines.push(`العنوان: ${String(safeCustomer.address || '').trim()}`, '', 'تفاصيل الطلب:', '')

  summary.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`)

    ;(item.options || []).forEach((option) => {
      lines.push(`   ${option.groupLabel}: ${option.label}`)
    })

    lines.push(
      `   الكمية: ${item.quantity}`,
      `   سعر الوحدة: ${formatPrice(item.unitPrice)}`,
      `   الإجمالي: ${formatPrice(item.subtotal)}`,
      '',
    )
  })

  lines.push(`الإجمالي النهائي: ${formatPrice(summary.total)}`)

  const notes = String(safeCustomer.notes || '').trim()
  if (notes) {
    lines.push('', `ملاحظات: ${notes}`)
  }

  return { message: lines.join('\n'), summary }
}

export function buildOrderMessageText(args) {
  return buildOrderMessage(args).message
}
