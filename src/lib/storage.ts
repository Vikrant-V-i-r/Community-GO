// LocalStorage helpers for guest user session

import type { User } from './types'

const KEY = 'community-hero-user'

export function loadUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function saveUser(user: User | null) {
  if (typeof window === 'undefined') return
  if (user) localStorage.setItem(KEY, JSON.stringify(user))
  else localStorage.removeItem(KEY)
}

export function clearUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
