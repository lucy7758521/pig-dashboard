import dayjs from 'dayjs'

/** 格式化日期 */
export function formatDate(dateStr: string, format = 'MM-DD') {
  return dayjs(dateStr).format(format)
}

/** 格式化完整日期 */
export function formatFullDate(dateStr: string) {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

/** 获取相对时间 */
export function timeAgo(dateStr: string) {
  const now = dayjs()
  const target = dayjs(dateStr)
  const diffMinutes = now.diff(target, 'minute')
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  const diffHours = now.diff(target, 'hour')
  if (diffHours < 24) return `${diffHours}小时前`
  const diffDays = now.diff(target, 'day')
  if (diffDays < 30) return `${diffDays}天前`
  return formatDate(dateStr, 'YYYY-MM-DD')
}

/** 格式化价格 */
export function formatPrice(price: number, unit = '元/公斤') {
  return `${price.toFixed(2)} ${unit}`
}

/** 品种颜色映射 */
export const categoryColors: Record<string, string> = {
  '外三元': '#e74c3c',
  '内三元': '#e67e22',
  '土杂猪': '#8e44ad',
  '玉米': '#27ae60',
  '豆粕': '#2980b9',
}

/** 事件类型颜色映射 */
export const eventTypeColors: Record<string, string> = {
  '公告': 'blue',
  '出栏数据': 'green',
  '股价动态': 'red',
  '新闻': 'orange',
}
