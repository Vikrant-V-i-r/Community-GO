'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Bell, User as UserIcon, BarChart3,
  Coins, Loader2, Sparkles, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import SplashScreen from '@/components/splash-screen'
import WelcomeModal from '@/components/welcome-modal'
import FabMenu from '@/components/fab-menu'
import ReportSheet from '@/components/report-sheet'
import IssueDetailSheet from '@/components/issue-detail-sheet'
import LeaderboardPanel from '@/components/leaderboard-panel'
import ProfilePanel from '@/components/profile-panel'
import AlertsPanel from '@/components/alerts-panel'
import StatsPanel, { type StatsData } from '@/components/stats-panel'
import ShareModal from '@/components/share-modal'
import { loadUser, saveUser } from '@/lib/storage'
import { DEFAULT_CENTER, AVATARS } from '@/lib/constants'
import type { User, Issue, IssueDetail, Alert as AlertT } from '@/lib/types'
import * as localDB from '@/lib/local-db'

const MapView = dynamic(() => import('@/components/map-view'), { ssr: false })

type Panel = 'leaderboard' | 'profile' | 'alerts' | 'stats'

const DEMO_CENTER: [number, number] = DEFAULT_CENTER
const DEMO_ADDRESS = 'Indiranagar, Bengaluru, Karnataka 560038, India'

export default function Home() {
  const [splashDone, setSplashDone] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [issues, setIssues] = useState<Issue[]>([])
  const [panel, setPanel] = useState<Panel>('profile')
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [detailIssueId, setDetailIssueId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareIssue, setShareIssue] = useState<IssueDetail | null>(null)
  const [sideSheetOpen, setSideSheetOpen] = useState(false)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [alerts, setAlerts] = useState<AlertT[]>([])
  const [leaderboard, setLeaderboard] = useState<(User & { rank: number })[]>([])
  const [userIssues, setUserIssues] = useState<Issue[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    setHydrated(true)
    localDB.getIssues()
    const u = loadUser()
    if (u) {
      const data = localDB.getUser(u.id)
      if (data) { setUser(data.user); saveUser(data.user) } else { setUser(u) }
    } else {
      setWelcomeOpen(true)
    }
  }, [])

  const refreshIssues = useCallback(() => {
    setIssues(localDB.getIssues())
  }, [])

  useEffect(() => {
    if (user) refreshIssues()
  }, [user, refreshIssues])

  const refreshAlerts = useCallback(() => {
    if (!user) return
    const { alerts: a } = localDB.getAlerts(user.id)
    setAlerts(a)
  }, [user])

  useEffect(() => {
    refreshAlerts()
    const interval = setInterval(refreshAlerts, 8000)
    return () => clearInterval(interval)
  }, [refreshAlerts])

  const onWelcomeSubmit = (handle: string, avatar: string) => {
    const u = localDB.createUser(handle, avatar)
    setUser(u)
    saveUser(u)
    setWelcomeOpen(false)
    showToast(`Welcome @${handle}! +50 Civic Coins 🎉`)
    refreshIssues()
    refreshAlerts()
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const openIssue = (id: string) => {
    setDetailIssueId(id)
    setDetailOpen(true)
  }

  const onIssueChanged = () => {
    refreshIssues()
    if (user) {
      const data = localDB.getUser(user.id)
      if (data) { setUser(data.user); saveUser(data.user) }
    }
  }

  const openShare = (issue: IssueDetail) => {
    setShareIssue(issue)
    setShareOpen(true)
  }

  const switchPanel = (p: Panel) => {
    if (p === panel && sideSheetOpen) { setSideSheetOpen(false); return }
    setPanel(p)
    setSideSheetOpen(true)
    if (p === 'leaderboard') {
      setLeaderboard(localDB.getLeaderboard())
    } else if (p === 'profile' && user) {
      const data = localDB.getUser(user.id)
      if (data) setUserIssues(data.issues)
    } else if (p === 'alerts' && user) {
      refreshAlerts()
    } else if (p === 'stats') {
      setStats(localDB.getStats())
    }
  }

  const markAllRead = () => {
    if (!user) return
    localDB.markAlertsRead(user.id)
    refreshAlerts()
  }

  const recenter = () => { setFlyTo(DEMO_CENTER) }

  const scanNearby = () => {
    recenter()
    const active = issues.filter((i) => i.status !== 'SOLVED').length
    showToast(`Scanning ${active} active issues in Bengaluru…`)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const issueId = params.get('issue')
    if (issueId && user) setTimeout(() => openIssue(issueId), 800)
  }, [user])

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    )
  }

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />
  }

  const unreadAlerts = alerts.filter((a) => !a.read).length
  const activeCount = issues.filter((i) => i.status !== 'SOLVED').length
  const solvedCount = issues.filter((i) => i.status === 'SOLVED').length

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-slate-900">
      {user && (
        <MapView
          issues={issues}
          userPos={DEMO_CENTER}
          center={DEMO_CENTER}
          selectedIssueId={detailIssueId}
          onSelectIssue={openIssue}
          flyTo={flyTo}
          onFlyDone={() => setFlyTo(null)}
        />
      )}

      {!user && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center text-2xl">🦸</div>
            <p className="text-white/80 text-sm">Loading Community GO…</p>
          </div>
        </div>
      )}

      {user && (
        <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 pb-2 bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
          <div className="flex items-center justify-between gap-2 pointer-events-auto">
            <button onClick={() => switchPanel('profile')} className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur pl-1.5 pr-3 py-1.5 shadow-lg border border-white/40 active:scale-95 transition-transform">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATARS.find(a => a.code === user.avatar)?.color || 'from-slate-400 to-slate-600'} flex items-center justify-center text-base shadow-inner`}>
                {AVATARS.find(a => a.code === user.avatar)?.emoji || '🦸'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight text-slate-900 max-w-[90px] truncate">@{user.handle}</div>
                <div className="text-[10px] text-slate-500 leading-tight flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" /> Lvl {user.level}
                </div>
              </div>
            </button>

            {!sideSheetOpen && (
              <div className="hidden xs:flex items-center gap-2 rounded-full bg-slate-900/90 backdrop-blur px-3 py-1.5 text-white shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                <span className="text-xs font-bold">
                  {activeCount} active<span className="text-white/40"> · </span>
                  <span className="text-emerald-400">{solvedCount} solved</span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button onClick={() => switchPanel('profile')} className="flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1.5 shadow active:scale-95 transition-transform">
                <Coins className="h-3.5 w-3.5 text-amber-700" />
                <span className="text-xs font-black text-amber-900">{user.coins}</span>
              </button>
              <button onClick={() => switchPanel('alerts')} className="relative rounded-full bg-white/95 backdrop-blur p-2 shadow border border-white/40 active:scale-95 transition-transform" aria-label="View alerts">
                <Bell className="h-4 w-4 text-slate-700" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">{unreadAlerts}</span>
                )}
              </button>
            </div>
          </div>

          {!sideSheetOpen && (
            <div className="mt-2 flex items-center justify-center pointer-events-auto">
              <div className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1 shadow text-[11px] text-slate-700 border border-white/40">
                <span className="text-xs">🇮🇳</span>
                <span className="font-bold">Bengaluru Demo City</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{issues.length} issues live · offline</span>
              </div>
            </div>
          )}
        </div>
      )}

      {user && (
        <FabMenu
          onAddIssue={() => setReportOpen(true)}
          onScanNearby={scanNearby}
          onShowHistory={() => switchPanel('profile')}
        />
      )}

      {user && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white/95 backdrop-blur shadow-2xl border border-slate-200 p-1.5">
            <NavBtn icon={BarChart3} label="Stats" active={panel === 'stats' && sideSheetOpen} onClick={() => switchPanel('stats')} />
            <NavBtn icon={Trophy} label="Ranks" active={panel === 'leaderboard' && sideSheetOpen} onClick={() => switchPanel('leaderboard')} />
            <div className="w-14" aria-hidden />
            <NavBtn icon={Bell} label="Alerts" active={panel === 'alerts' && sideSheetOpen} onClick={() => switchPanel('alerts')} badge={unreadAlerts} />
            <NavBtn icon={UserIcon} label="Me" active={panel === 'profile' && sideSheetOpen} onClick={() => switchPanel('profile')} />
          </div>
        </div>
      )}

      <WelcomeModal open={welcomeOpen} onSubmit={onWelcomeSubmit} />

      <ReportSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        userPos={DEMO_CENTER}
        address={DEMO_ADDRESS}
        userId={user?.id || ''}
        onSubmitted={(id) => {
          refreshIssues()
          openIssue(id)
          showToast('Issue posted! +50 Civic Coins 🎉')
        }}
      />

      <IssueDetailSheet
        issueId={detailIssueId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        user={user}
        onIssueChanged={onIssueChanged}
        onShare={openShare}
        onFlyTo={(lat, lng) => { setFlyTo([lat, lng]); setDetailOpen(false) }}
      />

      <ShareModal issue={shareIssue} open={shareOpen} onOpenChange={setShareOpen} />

      <Sheet open={sideSheetOpen} onOpenChange={setSideSheetOpen}>
        <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2 sticky top-0 bg-white z-10">
            <SheetTitle className="capitalize flex items-center justify-between">
              <span>
                {panel === 'stats' && '📊 Impact Dashboard'}
                {panel === 'leaderboard' && '🏆 Leaderboard'}
                {panel === 'profile' && '🦸 Your Profile'}
                {panel === 'alerts' && '🔔 Live Alerts'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => setSideSheetOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
            <SheetDescription className="sr-only">
              {panel === 'stats' && 'Community impact statistics and dashboard'}
              {panel === 'leaderboard' && 'City-wide contributor rankings'}
              {panel === 'profile' && 'Your hero profile, stats, and badges'}
              {panel === 'alerts' && 'Live notifications and alerts'}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-10">
            {panel === 'stats' && stats && <StatsPanel stats={stats} />}
            {panel === 'leaderboard' && <LeaderboardPanel users={leaderboard} currentUserId={user?.id || null} />}
            {panel === 'profile' && user && <ProfilePanel user={user} userIssues={userIssues} />}
            {panel === 'alerts' && <AlertsPanel alerts={alerts} onMarkAllRead={markAllRead} />}
          </div>
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-slate-900 text-white px-4 py-2 shadow-2xl text-sm font-bold flex items-center gap-2 max-w-[90vw]"
          >
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function NavBtn({
  icon: Icon, label, active, onClick, badge,
}: { icon: any; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px] ${active ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:text-slate-700'}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-bold">{label}</span>
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">{badge}</span>
      )}
    </button>
  )
}
