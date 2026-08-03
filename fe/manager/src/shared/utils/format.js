export const money = (value, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0))

export const dateVN = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : ''

export const dateTimeVN = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : ''

export const isoDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function defaultStay() {
  const checkIn = new Date()
  checkIn.setDate(checkIn.getDate() + 1)
  const checkOut = new Date()
  checkOut.setDate(checkOut.getDate() + 3)
  return { checkIn: isoDate(checkIn), checkOut: isoDate(checkOut) }
}

export function nightsBetween(checkIn, checkOut) {
  return Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
}

export const ratingLabel = (score) => {
  const n = Number(score || 0)
  if (n >= 9) return 'Tuyệt hảo'
  if (n >= 8) return 'Rất tốt'
  if (n >= 7) return 'Tốt'
  return 'Khá tốt'
}
