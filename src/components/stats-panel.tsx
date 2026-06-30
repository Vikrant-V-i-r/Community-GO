'use client'

import { TrendingUp, Users, Clock, CheckCircle2, AlertCircle, Hammer } from 'lucide-react'

export interface StatsData {
  totalIssues: number
  solved: number
  wip: number
  fresh: number
  totalUsers: number
  totalVerifications: number
  avgResolutionHours: number
  categories: { category: string; count: number }[]
}

export interface StatsPanelProps {
  stats: StatsData
}

const CAT_EMOJI: Record<string, string> = {
  POTHOLE: '🕳️', WATER_LEAK: '💧', STREETLIGHT: '💡', GARBAGE: '🗑️',
  ROAD_DAMAGE: '🚧', DRAINAGE: '🌊', OTHER: '📍',
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const resolveRate = stats.totalIssues > 0
    ? Math.round((stats.solved / stats.totalIssues) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-black">Community Impact</h2>
      </div>

      {/* Big stats bento */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
          <div className="text-3xl font-black">{stats.totalIssues}</div>
          <div className="text-xs font-bold opacity-80">TOTAL ISSUES REPORTED</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-4 text-white">
          <div className="text-3xl font-black">{resolveRate}%</div>
          <div className="text-xs font-bold opacity-80">RESOLUTION RATE</div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-center">
          <AlertCircle className="h-5 w-5 text-rose-500 mx-auto mb-1" />
          <div className="text-xl font-black text-rose-700">{stats.fresh}</div>
          <div className="text-[10px] font-bold text-rose-600">FRESH</div>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-center">
          <Hammer className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <div className="text-xl font-black text-amber-700">{stats.wip}</div>
          <div className="text-[10px] font-bold text-amber-600">FIXING</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <div className="text-xl font-black text-emerald-700">{stats.solved}</div>
          <div className="text-[10px] font-bold text-emerald-600">SOLVED</div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white border border-slate-200 p-3 text-center">
          <Users className="h-4 w-4 text-violet-500 mx-auto mb-1" />
          <div className="text-base font-black text-slate-900">{stats.totalUsers}</div>
          <div className="text-[9px] font-bold text-slate-500">HEROES</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-3 text-center">
          <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto mb-1" />
          <div className="text-base font-black text-slate-900">{stats.totalVerifications}</div>
          <div className="text-[9px] font-bold text-slate-500">VERIFIED</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-3 text-center">
          <Clock className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <div className="text-base font-black text-slate-900">{stats.avgResolutionHours}h</div>
          <div className="text-[9px] font-bold text-slate-500">AVG SOLVE</div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <div className="text-xs font-bold uppercase text-slate-500 mb-3">Issues by Category</div>
        <div className="space-y-2">
          {stats.categories
            .sort((a, b) => b.count - a.count)
            .map((c) => {
              const max = Math.max(...stats.categories.map((x) => x.count))
              const pct = (c.count / max) * 100
              return (
                <div key={c.category} className="flex items-center gap-2">
                  <span className="w-6 text-base">{CAT_EMOJI[c.category] || '📍'}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-lg"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-bold text-slate-700">{c.count}</span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
