import apiUrl from '../apiConfig'
import type { LoginRequest, RegisterRequest, User } from '../types'

// All routes are mounted under /api on the backend (SPEC §7).
const API_BASE = `${apiUrl}/api`

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include', // session cookies (SPEC §7)
      headers: { 'Content-Type': 'application/json', ...init.headers },
      ...init,
    })
  } catch {
    // Network error: no response received.
    throw new ApiError(0, 'Connection error. Check your network and try again.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
  }

  // Handle 204 / empty bodies (e.g. logout).
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }
  return (await response.json()) as T
}

async function errorMessage(response: Response): Promise<string> {
  if (response.status === 423) {
    return 'The season has started. Picks are locked.'
  }
  try {
    const body = await response.json()
    // Backend shape: { error: string, details?: string[] }. Prefer the specific
    // validation detail, then the error label, then a generic `message` field.
    if (Array.isArray(body?.details) && typeof body.details[0] === 'string') {
      return body.details[0]
    }
    if (typeof body?.error === 'string') return body.error
    if (typeof body?.message === 'string') return body.message
  } catch {
    // fall through to default
  }
  return 'Something went wrong. Try again in a moment.'
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
