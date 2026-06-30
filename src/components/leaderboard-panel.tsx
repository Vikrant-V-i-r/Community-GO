'use client'

import { Trophy, Coins, TrendingUp, Shield } from 'lucide-react'
import { AVATARS, BADGES } from '@/lib/constants'
import type { User } from '@/lib/types'

export interface LeaderboardPanelProps {
  users: (User & { rank: number })[]
  currentUserId: string | null
}

export default function LeaderboardPanel({ users, currentUserId }: LeaderboardPanelProps) {
  const podium = users.slice(0, 3)
  const rest = users.slice(3, 20)
  const podiumHeights = ['h-24', 'h-20', 'h-16']
  const podiumColors = [
    'from-amber-300 to-yellow-500',
    'from-slate-300 to-slate-400',
    'from-orange-300 to-amber-600',
  ]
  const podiumOrder = [1, 0, 2] // visual order: 2nd, 1st, 3rd

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-black">City Leaderboard</h2>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-2 items-end">
        {podiumOrder.map((idx) => {
          const u = podium[idx]
          if (!u) return <div key={idx} />
          const avatar = AVATARS.find((a) => a.code === u.avatar) || AVATARS[0]
          return (
            <div
              key={u.id}
              className="flex flex-col items-center"
            >
              <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-2xl mb-1 ${idx === 0 ? 'ring-4 ring-amber-300' : ''}`}>
                {avatar.emoji}
                <div className={`absolute -top-2 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${podiumColors[idx]} flex items-center justify-center text-xs font-black text-white shadow`}>
                  {idx + 1}
                </div>
              </div>
              <div className="text-xs font-bold text-slate-900 max-w-[80px] truncate">@{u.handle}</div>
              <div className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                <Coins className="h-2.5 w-2.5" /> {u.coins}
              </div>
              <div className={`w-full ${podiumHeights[idx]} rounded-t-xl bg-gradient-to-b ${podiumColors[idx]} flex items-start justify-center pt-1`}>
                <span className="text-[10px] font-black text-white/80">LVL {u.level}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="space-y-1.5">
        {rest.map((u, i) => {
          const avatar = AVATARS.find((a) => a.code === u.avatar) || AVATARS[0]
          const isMe = u.id === currentUserId
          return (
            <div
              key={u.id}
              className={`flex items-center gap-3 rounded-2xl p-2.5 border ${
                isMe ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'
              }`}
            >
              <span className="w-6 text-center text-sm font-black text-slate-400">{u.rank}</span>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-base`}>
                {avatar.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-slate-900 truncate">@{u.handle}</span>
                  {u.isCivicAgent && (
                    <Shield className="h-3 w-3 text-violet-600 fill-violet-100" />
                  )}
                  {isMe && (
                    <span className="text-[10px] bg-rose-500 text-white rounded-full px-1.5 font-bold">YOU</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">
                  Level {u.level} · {u.badges.length} badges
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-amber-700 flex items-center gap-1 justify-end">
                  <Coins className="h-3 w-3" /> {u.coins}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-0.5 justify-end">
                  <TrendingUp className="h-2.5 w-2.5" /> {u.xp} XP
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Badge showcase */}
      <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
        <div className="text-xs font-bold uppercase text-slate-500 mb-2">All Earnable Badges</div>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((b) => (
            <div key={b.code} className="rounded-xl bg-white p-2 text-center border border-slate-100">
              <div className={`mx-auto w-10 h-10 rounded-full bg-gradient-to-br ${b.color} flex items-center justify-center text-lg mb-1`}>
                {b.emoji}
              </div>
              <div className="text-[10px] font-bold text-slate-900 leading-tight">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
