export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').replace(/\/$/, '')

export interface Link {
  code: string
  target_url: string
  short_url: string
  created_at: string
  expires_at: string | null
  clicks: number
  last_clicked_at: string | null
}

export interface LinkPage {
  items: Link[]
  total: number
}

export interface CreateLinkInput {
  url: string
  custom_alias?: string
  expires_in_days?: number
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// FastAPI returns `detail` as a string for HTTPException and as a list for validation errors.
function readDetail(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: string[]; msg?: string }
    const field = first.loc?.at(-1)
    if (field === 'url') return 'Enter a full web address, starting with http:// or https://.'
    if (field === 'custom_alias')
      return 'Aliases use 3–32 letters, numbers, dashes or underscores.'
    return first.msg ?? 'The request was not valid.'
  }
  return `The server responded with ${status}.`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, `Can't reach the server at ${API_URL}. Check that the backend is running.`)
  }
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 429)
      throw new ApiError(429, 'You’ve made a lot of links in the last minute. Wait a moment, then try again.')
    throw new ApiError(res.status, readDetail(res.status, body))
  }
  return body as T
}

export const api = {
  list: (limit = 20, offset = 0) => request<LinkPage>(`/api/links?limit=${limit}&offset=${offset}`),
  create: (input: CreateLinkInput) =>
    request<Link>('/api/links', { method: 'POST', body: JSON.stringify(input) }),
  remove: (code: string) => request<void>(`/api/links/${encodeURIComponent(code)}`, { method: 'DELETE' }),
}

export function isExpired(link: Link): boolean {
  return link.expires_at !== null && new Date(link.expires_at).getTime() <= Date.now()
}

export function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}
