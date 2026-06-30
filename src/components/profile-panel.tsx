'use client'

import {
  Coins, Zap, TrendingUp, Shield, Trophy, BadgeCheck, Star,
} from 'lucide-react'
import { AVATARS, BADGES, xpProgress, CATEGORY_META, STATUS_META } from '@/lib/constants'
import type { User, Issue } from '@/lib/types'

export interface ProfilePanelProps {
  user: User
  userIssues: Issue[]
}

export default function ProfilePanel({ user, userIssues }: ProfilePanelProps) {
  const avatar = AVATARS.find((a) => a.code === user.avatar) || AVATARS[0]
  const xp = xpProgress(user.xp)
  const myBadges = user.badges.map((code) => BADGES.find((b) => b.code === code)).filter(Boolean)
  const unlockedCodes = new Set(user.badges)

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-5 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-rose-500/20 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-3xl ring-2 ring-white/30`}>
            {avatar.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-black">@{user.handle}</h2>
              {user.isCivicAgent && (
                <Shield className="h-4 w-4 text-violet-300 fill-violet-500/40" />
              )}
            </div>
            <p className="text-xs text-white/60">Level {user.level} · {user.neighborhood}</p>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold">Lvl {user.level}</span>
            <span className="text-white/60">{xp.current} / {xp.needed} XP</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-700"
              style={{ width: `${xp.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats bento */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 text-white">
          <Coins className="h-5 w-5 mb-1" />
          <div className="text-xl font-black">{user.coins}</div>
          <div className="text-[10px] font-bold opacity-80">CIVIC COINS</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-3 text-white">
          <Zap className="h-5 w-5 mb-1" />
          <div className="text-xl font-black">{user.xp}</div>
          <div className="text-[10px] font-bold opacity-80">TOTAL XP</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3 text-white">
          <Trophy className="h-5 w-5 mb-1" />
          <div className="text-xl font-black">{userIssues.length}</div>
          <div className="text-[10px] font-bold opacity-80">REPORTS</div>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BadgeCheck className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-black">Badges ({myBadges.length}/{BADGES.length})</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((b) => {
            const earned = unlockedCodes.has(b.code)
            return (
              <div
                key={b.code}
                className={`rounded-xl p-2 text-center border transition-all ${
                  earned
                    ? `bg-gradient-to-br ${b.color} border-transparent shadow-md`
                    : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
                }`}
              >
                <div className="text-2xl mb-1">{b.emoji}</div>
                <div className="text-[10px] font-black text-white leading-tight" style={earned ? {} : { color: '#475569' }}>
                  {b.label}
                </div>
                <div className="text-[8px] mt-0.5" style={earned ? { color: 'rgba(255,255,255,0.85)' } : { color: '#94a3b8' }}>
                  {b.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* My reports */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-rose-500 fill-rose-100" />
          <h3 className="text-sm font-black">My Reports</h3>
        </div>
        {userIssues.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No reports yet. Tap the + button to report your first issue!
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {userIssues.map((issue) => (
              <div key={issue.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                <span className="text-lg">{CATEGORY_META[issue.category as keyof typeof CATEGORY_META]?.emoji || '📍'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">{issue.title}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black text-white ${STATUS_META[issue.status as keyof typeof STATUS_META]?.bg}`}>
                  {issue.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
