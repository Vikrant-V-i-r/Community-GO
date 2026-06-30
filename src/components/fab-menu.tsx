'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Plus, History, ScanLine, X, ChevronUp } from 'lucide-react'

export interface FabMenuProps {
  onAddIssue: () => void
  onScanNearby: () => void
  onShowHistory: () => void
}

export default function FabMenu({ onAddIssue, onScanNearby, onShowHistory }: FabMenuProps) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <>
      {/* Backdrop when open — fixed full-screen, behind menu items but above map */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
        {/* Vertical stack of menu items — appears ABOVE the FAB, never overlapping */}
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex flex-col items-center gap-2 mb-3 pointer-events-auto"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.18 }}
            >
              {/* Primary: Add Issue */}
              <motion.button
                onClick={() => { onAddIssue(); close() }}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 pl-3 pr-4 py-2.5 shadow-[0_8px_25px_rgba(244,63,94,0.5)] active:scale-95 transition-transform"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: 0 }}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
                  <Camera className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-black text-white">Add Issue</span>
              </motion.button>

              {/* Secondary: Scan Nearby */}
              <motion.button
                onClick={() => { onScanNearby(); close() }}
                className="flex items-center gap-2 rounded-full bg-white pl-3 pr-4 py-2 shadow-lg border border-slate-200 active:scale-95 transition-transform"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: 0.05 }}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100">
                  <ScanLine className="h-3.5 w-3.5 text-cyan-600" />
                </div>
                <span className="text-sm font-bold text-slate-800">Scan Nearby</span>
              </motion.button>

              {/* Secondary: My Reports */}
              <motion.button
                onClick={() => { onShowHistory(); close() }}
                className="flex items-center gap-2 rounded-full bg-white pl-3 pr-4 py-2 shadow-lg border border-slate-200 active:scale-95 transition-transform"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
                  <History className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-slate-800">My Reports</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <button
          onClick={() => setOpen(!open)}
          className={`relative h-14 w-14 rounded-full bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 shadow-[0_8px_24px_rgba(244,63,94,0.5)] flex items-center justify-center pointer-events-auto active:scale-95 transition-transform`}
          aria-label={open ? 'Close menu' : 'Open action menu'}
        >
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-rose-500 to-amber-400 opacity-60 blur-md" />
          <div className="absolute inset-0 rounded-full border-[3px] border-white/30" />
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="h-6 w-6 text-white relative z-10" strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.div key="plus" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Plus className="h-7 w-7 text-white relative z-10" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* CTA hint when closed */}
        <AnimatePresence>
          {!open && (
            <motion.div
              className="absolute -top-8 whitespace-nowrap rounded-full bg-slate-900/95 px-3 py-1 text-[10px] font-bold text-white shadow-lg flex items-center gap-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              <ChevronUp className="h-2.5 w-2.5" /> Report an issue
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
