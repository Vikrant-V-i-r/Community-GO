'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MapPin, Clock, Shield, Users, Loader2, Hammer, CheckCircle2,
  Share2, ThumbsUp, Sparkles, Navigation,
} from 'lucide-react'
import { STATUS_META, CATEGORY_META, SEVERITY_META, DEPT_META } from '@/lib/constants'
import type { IssueDetail, IssueStatus, User } from '@/lib/types'
import { getIssue, updateIssueStatus, verifyIssue } from '@/lib/local-db'

export interface IssueDetailSheetProps {
  issueId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onIssueChanged: () => void
  onShare: (issue: IssueDetail) => void
  onFlyTo: (lat: number, lng: number) => void
}

export default function IssueDetailSheet({
  issueId, open, onOpenChange, user, onIssueChanged, onShare, onFlyTo,
}: IssueDetailSheetProps) {
  const [issue, setIssue] = useState<IssueDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [newStatus, setNewStatus] = useState<IssueStatus>('WIP')
  const [newComment, setNewComment] = useState('')
  const [reward, setReward] = useState<{ coins: number; xp: number } | null>(null)

  useEffect(() => {
    if (!issueId) return
    setLoading(true)
    const detail = getIssue(issueId)
    setIssue(detail)
    setLoading(false)
  }, [issueId])

  function verify() {
    if (!issue || !user) return
    const result = verifyIssue(issue.id, user.id)
    onIssueChanged()
    setIssue(getIssue(issue.id))
    if (result.coins > 0) {
      setReward({ coins: result.coins, xp: 20 })
      setTimeout(() => setReward(null), 3000)
    }
  }

  function submitUpdate() {
    if (!issue || !user || !newComment.trim()) return
    const result = updateIssueStatus(issue.id, user.id, newStatus, newComment)
    setShowUpdateForm(false)
    setNewComment('')
    if (result.coinReward > 0) {
      setReward({ coins: result.coinReward, xp: result.xpReward })
      setTimeout(() => setReward(null), 3000)
    }
    onIssueChanged()
    setIssue(getIssue(issue.id))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto p-0 rounded-t-3xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{issue ? issue.title : 'Issue details'}</SheetTitle>
          <SheetDescription>{issue ? `Reported by @${issue.reporter?.handle || 'anonymous'}` : 'Loading issue details'}</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading issue card…</p>
          </div>
        )}

        {!loading && issue && (
          <>
            <div className="relative h-52 w-full overflow-hidden rounded-t-3xl">
              <img src={issue.imageUrl} alt={issue.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black text-white ${STATUS_META[issue.status].bg} flex items-center gap-1 ${STATUS_META[issue.status].glow}`}>
                {issue.status === 'FRESH' && <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                {issue.status === 'SOLVED' && <CheckCircle2 className="h-3 w-3" />}
                {issue.status === 'WIP' && <Hammer className="h-3 w-3" />}
                {STATUS_META[issue.status].label.toUpperCase()}
              </div>
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-bold text-white flex items-center gap-1">
                <span>{CATEGORY_META[issue.category].emoji}</span>
                <span>{CATEGORY_META[issue.category].label}</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h2 className="text-lg font-black leading-tight mb-1">{issue.title}</h2>
                <p className="text-xs text-white/70">Reported by @{issue.reporter?.handle || 'anonymous'} · {timeAgo(issue.createdAt)}</p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Severity</div>
                  <div className={`text-sm font-black ${severityColor(issue.severity)}`}>{SEVERITY_META[issue.severity].label}</div>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Verifications</div>
                  <div className="text-sm font-black text-slate-900 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {issue.verificationsCount}</div>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">AI Confidence</div>
                  <div className="text-sm font-black text-violet-600">{issue.aiConfidence > 0 ? `${Math.round(issue.aiConfidence * 100)}%` : '—'}</div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Description</div>
                <p className="text-sm text-slate-800 leading-relaxed">{issue.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onFlyTo(issue.lat, issue.lng)} className="rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 p-3 text-left hover:shadow-md transition-shadow">
                  <div className="text-[10px] uppercase font-bold text-rose-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</div>
                  <div className="text-xs font-semibold text-slate-800 line-clamp-2">{issue.address}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}</div>
                </button>
                <a href={`https://www.google.com/maps?q=${issue.lat},${issue.lng}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-3 text-left hover:shadow-md transition-shadow">
                  <div className="text-[10px] uppercase font-bold text-blue-500 mb-1 flex items-center gap-1"><Navigation className="h-3 w-3" /> Directions</div>
                  <div className="text-xs font-semibold text-slate-800">Open in Google Maps</div>
                  <div className="text-[10px] text-slate-500 mt-1">Live link to the spot</div>
                </a>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Routed to</div>
                  <div className="text-sm font-bold text-slate-900">{DEPT_META[issue.authorityDept]?.icon} {DEPT_META[issue.authorityDept]?.label}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onShare(issue)}><Share2 className="h-3.5 w-3.5 mr-1" /> Share</Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={verify} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"><ThumbsUp className="h-4 w-4 mr-1.5" /> Verify (+10🪙)</Button>
                <Button onClick={() => setShowUpdateForm(!showUpdateForm)} className="bg-slate-900 hover:bg-slate-800"><Hammer className="h-4 w-4 mr-1.5" /> Update Status</Button>
              </div>

              <AnimatePresence>
                {showUpdateForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-3 overflow-hidden">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">New status</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['FRESH', 'WIP', 'SOLVED'] as IssueStatus[]).map((s) => (
                          <button key={s} onClick={() => setNewStatus(s)} className={`rounded-xl px-2 py-2 text-xs font-bold border-2 transition-all ${newStatus === s ? `${STATUS_META[s].bg} text-white border-transparent` : 'bg-white border-slate-200 text-slate-600'}`}>{STATUS_META[s].label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Update note (required)</div>
                      <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} placeholder="e.g. BBMP team arrived, repair work starting now…" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowUpdateForm(false)} className="flex-1">Cancel</Button>
                      <Button onClick={submitUpdate} disabled={!newComment.trim()} className="flex-1 bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="h-4 w-4 mr-1" /> Post Update</Button>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">💡 Earn +10🪙 for WIP, +100🪙 for SOLVED updates</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-1.5"><Clock className="h-4 w-4" /> Timeline</h3>
                <div className="space-y-2">
                  {issue.updates.map((u, i) => (
                    <div key={u.id} className="relative pl-6">
                      <div className={`absolute left-0 top-2 h-3 w-3 rounded-full ${STATUS_META[u.status as IssueStatus].bg} ring-2 ring-white shadow`} />
                      {i < issue.updates.length - 1 && <div className="absolute left-[5px] top-5 bottom-0 w-0.5 bg-slate-200" />}
                      <div className="rounded-xl bg-white border border-slate-200 p-2.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-slate-900">@{u.user.handle}</span>
                          <span className="text-[10px] text-slate-500">{timeAgo(u.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-700">{u.comment}</p>
                        <div className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-black text-white ${STATUS_META[u.status as IssueStatus].bg}`}>{u.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {issue.verifications.length > 0 && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Verified by {issue.verifications.length}+ community members</div>
                  <div className="flex flex-wrap gap-1.5">
                    {issue.verifications.slice(0, 8).map((v) => (
                      <span key={v.id} className="text-[10px] bg-white rounded-full px-2 py-0.5 border border-emerald-200 text-emerald-800 font-semibold">@{v.user.handle}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {reward && (
                <motion.div initial={{ y: 100, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 100, opacity: 0, scale: 0.8 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 shadow-2xl border-2 border-white">
                  <span className="font-black text-white flex items-center gap-2"><Sparkles className="h-4 w-4" /> +{reward.coins}🪙 · +{reward.xp}XP</span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function severityColor(s: string): string {
  if (s === 'LOW') return 'text-lime-600'
  if (s === 'MEDIUM') return 'text-amber-600'
  if (s === 'HIGH') return 'text-red-600'
  return 'text-rose-800'
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
