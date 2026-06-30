'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AVATARS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, MapPin, Zap } from 'lucide-react'

export interface WelcomeModalProps {
  open: boolean
  onSubmit: (handle: string, avatar: string) => void
}

export default function WelcomeModal({ open, onSubmit }: WelcomeModalProps) {
  const [handle, setHandle] = useState('')
  const [avatar, setAvatar] = useState('hero-1')

  const canSubmit = handle.trim().length >= 2

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white shadow-2xl border border-white/10"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Floating badges */}
            <div className="absolute -top-3 -right-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-900 shadow-lg rotate-6">
              +50 🪙 JOIN BONUS
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">Community <span className="bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">GO</span></h1>
                <p className="text-[11px] text-white/60 -mt-0.5">everyone is a HERO!</p>
              </div>
            </div>

            <p className="text-sm text-white/80 mb-5">
              Spot potholes, leaks, broken streetlights &amp; more. Report them in seconds. Watch your city fix them in real-time. Earn Civic Coins, climb the leaderboard, unlock badges.
            </p>

            <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">
              Choose your hero name
            </label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. PotholeHunter, CivicRaptor…"
              className="mb-4 bg-white/10 border-white/20 text-white placeholder:text-white/40"
              maxLength={30}
            />

            <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">
              Pick your avatar
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {AVATARS.map((a) => (
                <button
                  key={a.code}
                  onClick={() => setAvatar(a.code)}
                  className={`relative aspect-square rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-3xl transition-all ${
                    avatar === a.code
                      ? 'ring-4 ring-white scale-105 shadow-lg'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <span>{a.emoji}</span>
                  {avatar === a.code && (
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-300 fill-amber-300" />
                  )}
                </button>
              ))}
            </div>

            <Button
              disabled={!canSubmit}
              onClick={() => canSubmit && onSubmit(handle.trim(), avatar)}
              className="w-full h-12 text-base font-black bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-900 shadow-lg disabled:opacity-40"
            >
              <Zap className="mr-2 h-5 w-5" /> START YOUR JOURNEY
            </Button>
            <p className="mt-3 text-center text-[11px] text-white/50">
              No signup required. Guest mode. Your hero profile stays on this device.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
