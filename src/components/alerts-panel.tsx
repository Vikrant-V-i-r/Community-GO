'use client'

import {
  Bell, CheckCircle2, AlertCircle, Shield, Trophy, Sparkles,
  Check,
} from 'lucide-react'
import type { Alert } from '@/lib/types'

export interface AlertsPanelProps {
  alerts: Alert[]
  onMarkAllRead: () => void
}

const ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  NEW_ISSUE: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
  STATUS_CHANGE: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  BADGE_EARNED: { icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-100' },
  VERIFICATION: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' },
  NEARBY: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
}

export default function AlertsPanel({ alerts, onMarkAllRead }: AlertsPanelProps) {
  const unread = alerts.filter((a) => !a.read).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500">
              <Bell className="h-5 w-5 text-white" />
            </div>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
          <span className="text-sm text-slate-500">{alerts.length} total</span>
        </div>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Mark all read
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
          <Bell className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No alerts yet. Start reporting to get notified!</p>
        </div>
      ) : (
        <div className="space-y-2">
            {alerts.map((a, i) => {
              const meta = ICONS[a.type] || ICONS.NEW_ISSUE
              const Icon = meta.icon
              return (
                <div
                  key={a.id}
                  className={`flex gap-3 rounded-2xl p-3 border ${
                    a.read ? 'bg-white border-slate-200' : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className={`shrink-0 h-9 w-9 rounded-xl ${meta.bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${a.read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                      {a.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                  </div>
                  {!a.read && <span className="shrink-0 h-2 w-2 rounded-full bg-rose-500 mt-1" />}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}
