import apiUrl from '../apiConfig'
import type { LoginRequest, RegisterRequest, User } from '../types'

// All routes are mounted under /api on the backend (SPEC §7).
const API_BASE = `${apiUrl}/api`

export class ApiError extends Error {
  readonly status: number
  // Form field the error applies to, when the backend identifies one
  // (e.g. a 409 register conflict: { error, field: 'username' }).
  readonly field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
  }
}

// Read the double-submit CSRF token the backend sets as an `XSRF-TOKEN` cookie
// so it can be echoed back in a header on state-changing requests.
function csrfToken(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  // Only send a JSON content type when there's actually a body to describe —
  // avoids an unnecessary CORS preflight on bodyless GET/POST requests.
  if (init.body != null) headers.set('Content-Type', 'application/json')
  // Attach the CSRF token to mutating requests (no-op until the backend sets
  // the cookie).
  if (method !== 'GET' && method !== 'HEAD') {
    const token = csrfToken()
    if (token) headers.set('X-XSRF-TOKEN', token)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include', // session cookies (SPEC §7)
      ...init,
      headers,
    })
  } catch {
    // Network error: no response received.
    throw new ApiError(0, 'Connection error. Check your network and try again.')
  }

  if (!response.ok) {
    const { message, field } = await parseError(response)
    throw new ApiError(response.status, message, field)
  }

  // Parse text-first so empty success bodies (e.g. 204 logout) don't throw a
  // raw SyntaxError outside the ApiError contract.
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

async function parseError(response: Response): Promise<{ message: string; field?: string }> {
  if (response.status === 423) {
    return { message: 'The season has started. Picks are locked.' }
  }
  try {
    const body = await response.json()
    // Backend shape: { error: string, details?: string[], field?: string }.
    // `field` identifies the offending form field (e.g. a 409 register conflict).
    const field = typeof body?.field === 'string' ? body.field : undefined
    // Prefer the specific validation detail, then the error label, then a
    // generic `message` field.
    if (Array.isArray(body?.details) && typeof body.details[0] === 'string') {
      return { message: body.details[0], field }
    }
    if (typeof body?.error === 'string') return { message: body.error, field }
    if (typeof body?.message === 'string') return { message: body.message, field }
  } catch {
    // fall through to default
  }
  return { message: 'Something went wrong. Try again in a moment.' }
}

// Auth endpoints wrap the user: { user: {...} }.
interface UserEnvelope {
  user: User
}

export const client = {
  register: async (body: RegisterRequest): Promise<User> =>
    (await request<UserEnvelope>('/auth/register', { method: 'POST', body: JSON.stringify(body) }))
      .user,

  login: async (body: LoginRequest): Promise<User> =>
    (await request<UserEnvelope>('/auth/login', { method: 'POST', body: JSON.stringify(body) }))
      .user,

  logout: (): Promise<void> => request('/auth/logout', { method: 'POST' }),

  getMe: async (): Promise<User> => (await request<UserEnvelope>('/auth/me')).user,
}
