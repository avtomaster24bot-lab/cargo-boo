export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function shortId(): string {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `CB-${n}`
}
