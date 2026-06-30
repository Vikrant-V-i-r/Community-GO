// Visual constants — colors, icons, labels for the Neo-arcade design system

import {
  CircleAlert, Hammer, CheckCircle2, Construction, Droplets,
  Lightbulb, Trash2, Waypoints, Waves, HelpCircle,
  type LucideIcon,
} from 'lucide-react'
import type { IssueCategory, IssueStatus, Severity, AuthorityDept } from './types'

export const STATUS_META: Record<
  IssueStatus,
  { label: string; color: string; bg: string; ring: string; glow: string; emoji: string; pulse: boolean }
> = {
  FRESH: {
    label: 'Active',
    color: '#dc2626',
    bg: 'bg-red-500',
    ring: 'ring-red-400',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
    emoji: 'red',
    pulse: true,
  },
  WIP: {
    label: 'Fixing',
    color: '#f59e0b',
    bg: 'bg-amber-500',
    ring: 'ring-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.55)]',
    emoji: 'yellow',
    pulse: true,
  },
  SOLVED: {
    label: 'Solved',
    color: '#16a34a',
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.55)]',
    emoji: 'green',
    pulse: false,
  },
}

export const CATEGORY_META: Record<
  IssueCategory,
  { label: string; icon: LucideIcon; color: string; dept: AuthorityDept; emoji: string }
> = {
  POTHOLE: {
    label: 'Pothole', icon: CircleAlert, color: '#dc2626', dept: 'BBMP', emoji: '🕳️',
  },
  WATER_LEAK: {
    label: 'Water Leak', icon: Droplets, color: '#0ea5e9', dept: 'WATER_BOARD', emoji: '💧',
  },
  STREETLIGHT: {
    label: 'Streetlight', icon: Lightbulb, color: '#f59e0b', dept: 'ELECTRICITY', emoji: '💡',
  },
  GARBAGE: {
    label: 'Garbage', icon: Trash2, color: '#84cc16', dept: 'BBMP', emoji: '🗑️',
  },
  ROAD_DAMAGE: {
    label: 'Road Damage', icon: Construction, color: '#f97316', dept: 'BBMP', emoji: '🚧',
  },
  DRAINAGE: {
    label: 'Drainage', icon: Waves, color: '#06b6d4', dept: 'BBMP', emoji: '🌊',
  },
  OTHER: {
    label: 'Other', icon: Waypoints, color: '#8b5cf6', dept: 'BBMP', emoji: '📍',
  },
}

export const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: '#65a30d', bg: 'bg-lime-500' },
  MEDIUM: { label: 'Medium', color: '#d97706', bg: 'bg-amber-500' },
  HIGH: { label: 'High', color: '#dc2626', bg: 'bg-red-500' },
  CRITICAL: { label: 'Critical', color: '#7f1d1d', bg: 'bg-rose-700' },
}

export const DEPT_META: Record<AuthorityDept, { label: string; color: string; icon: string }> = {
  BBMP: { label: 'Municipal Corp (BBMP)', color: '#0ea5e9', icon: '🏛️' },
  TRAFFIC: { label: 'Traffic Police', color: '#3b82f6', icon: '🚦' },
  WATER_BOARD: { label: 'Water Board (BWSSB)', color: '#06b6d4', icon: '🚰' },
  ELECTRICITY: { label: 'Electricity (BESCOM)', color: '#f59e0b', icon: '⚡' },
  FIRE: { label: 'Fire & Emergency', color: '#ef4444', icon: '🚒' },
  POLICE: { label: 'City Police', color: '#1e40af', icon: '👮' },
}

export interface BadgeDef {
  code: string
  label: string
  description: string
  emoji: string
  color: string
}

export const BADGES: BadgeDef[] = [
  { code: 'FIRST_REPORT', label: 'First Report', description: 'Reported your first civic issue', emoji: '🌟', color: 'from-yellow-400 to-orange-500' },
  { code: 'POTHOLE_SLAYER', label: 'Pothole Slayer', description: 'Reported 3+ potholes', emoji: '🕳️', color: 'from-orange-400 to-red-500' },
  { code: 'NEIGHBORHOOD_WATCH', label: 'Neighborhood Watch', description: 'Verified 5+ issues in your area', emoji: '👀', color: 'from-cyan-400 to-blue-500' },
  { code: 'VERIFIED_REPORTER', label: 'Verified Reporter', description: 'Got 10+ community verifications', emoji: '✅', color: 'from-emerald-400 to-teal-500' },
  { code: 'CIVIC_HERO', label: 'Civic Hero', description: 'Helped resolve 3+ issues', emoji: '🦸', color: 'from-purple-400 to-pink-500' },
  { code: 'CITY_GUARDIAN', label: 'City Guardian', description: 'Reached level 10', emoji: '🛡️', color: 'from-indigo-400 to-purple-600' },
]

export const AVATARS = [
  { code: 'hero-1', label: 'Raptor', emoji: '🦖', color: 'from-emerald-400 to-cyan-500' },
  { code: 'hero-2', label: 'Tiger', emoji: '🐯', color: 'from-orange-400 to-red-500' },
  { code: 'hero-3', label: 'Phoenix', emoji: '🔥', color: 'from-amber-400 to-pink-500' },
  { code: 'hero-4', label: 'Elephant', emoji: '🐘', color: 'from-slate-400 to-slate-600' },
  { code: 'hero-5', label: 'Peacock', emoji: '🦚', color: 'from-blue-400 to-emerald-500' },
  { code: 'hero-6', label: 'Lion', emoji: '🦁', color: 'from-yellow-400 to-amber-600' },
]

export function avatarByCode(code: string) {
  return AVATARS.find((a) => a.code === code) || AVATARS[0]
}

export function badgeByCode(code: string) {
  return BADGES.find((b) => b.code === code)
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / 600) + 1
}

export function xpProgress(xp: number): { current: number; needed: number; pct: number } {
  const level = levelFromXp(xp)
  const baseXp = (level - 1) * 600
  const current = xp - baseXp
  const needed = 600
  return { current, needed, pct: Math.min(100, (current / needed) * 100) }
}

// Bengaluru fallback coordinates (Indiranagar)
export const DEFAULT_CENTER: [number, number] = [12.9719, 77.6412]
