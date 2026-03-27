// Format an ISO date string for display
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Format an ISO date string as a relative label or time
export function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return formatDate(iso)
}

// Generate a default entry title from a timestamp
export function defaultTitle(): string {
  const now = new Date()
  return `Capture — ${now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}
