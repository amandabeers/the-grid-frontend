import { create } from 'zustand'
import { client } from '../api/client'
import type { LoginRequest, RegisterRequest, User } from '../types'

interface AuthState {
  currentUser: User | null
  isLoading: boolean
  initialized: boolean
  init: () => Promise<void>
  login: (body: LoginRequest) => Promise<void>
  register: (body: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  currentUser: null,
  isLoading: true,
  initialized: false,

  // Rehydrate the session on app mount. Idempotent so React StrictMode's
  // double-invoked effect doesn't fire two /auth/me requests.
  init: async () => {
    if (get().initialized) return
    set({ initialized: true })
    try {
      const user = await client.getMe()
      set({ currentUser: user })
    } catch {
      set({ currentUser: null })
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (body) => {
    const user = await client.login(body)
    set({ currentUser: user })
  },

  register: async (body) => {
    const user = await client.register(body)
    set({ currentUser: user })
  },

  logout: async () => {
    // Always end the client session, even if the server call fails.
    try {
      await client.logout()
    } finally {
      set({ currentUser: null })
    }
  },
}))
