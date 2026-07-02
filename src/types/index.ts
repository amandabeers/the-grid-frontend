// Shared API types. Ported from SPEC §8 as features need them; auth-only for now.

export interface User {
  id: number
  username: string
  role: 'member' | 'admin'
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}
