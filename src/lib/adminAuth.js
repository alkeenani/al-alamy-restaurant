import { supabase } from './supabase.js'

const inFlightAdminChecks = new Map()

export const AUTH_MESSAGES = {
  forbidden:
    'هذا الحساب لا يملك صلاحية الوصول إلى لوحة التحكم. تم تسجيل الخروج.',
  adminCheckFailed:
    'تعذر التحقق من صلاحية الحساب. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
  invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  emailNotConfirmed: 'يرجى تأكيد البريد الإلكتروني أولاً ثم حاول مرة أخرى.',
  tooManyRequests: 'محاولات تسجيل دخول كثيرة. يرجى الانتظار قليلاً والمحاولة مجدداً.',
  signInFailed: 'تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.',
  signOutFailed: 'تعذر تسجيل الخروج. يرجى المحاولة مرة أخرى.',
}

export async function checkAdminAccess(userId) {
  if (!userId) {
    return { isAdmin: false, error: new Error('Missing user id') }
  }

  if (inFlightAdminChecks.has(userId)) {
    return inFlightAdminChecks.get(userId)
  }

  const request = (async () => {
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return { isAdmin: false, error }
    }

    return { isAdmin: Boolean(data), error: null }
  })()

  inFlightAdminChecks.set(userId, request)

  try {
    return await request
  } finally {
    inFlightAdminChecks.delete(userId)
  }
}

export function getSignInErrorMessage(error) {
  if (!error) return AUTH_MESSAGES.signInFailed

  if (error.status === 429 || error.code === 'too_many_requests') {
    return AUTH_MESSAGES.tooManyRequests
  }

  if (error.code === 'email_not_confirmed') {
    return AUTH_MESSAGES.emailNotConfirmed
  }

  if (error.code === 'invalid_credentials') {
    return AUTH_MESSAGES.invalidCredentials
  }

  if (error.code === 'user_banned') {
    return 'هذا الحساب موقوف. يرجى التواصل مع إدارة المطعم.'
  }

  return AUTH_MESSAGES.signInFailed
}
