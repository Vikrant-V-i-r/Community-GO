'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export interface SplashScreenProps {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onFinish, 400)
    }, 2400)
    return () => clearTimeout(t)
  }, [onFinish])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute inset-0 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-white/5"
                style={{ width: 200 + i * 150, height: 200 + i * 150 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </div>

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {['🕳️', '💧', '💡', '🗑️', '🚧', '🌊'].map((emoji, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl opacity-20"
                style={{ left: `${15 + (i * 13) % 70}%`, top: `${20 + (i * 17) % 60}%` }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: [0, -15, 0], opacity: [0, 0.3, 0] }}
                transition={{ delay: 0.5 + i * 0.1, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              className="relative mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.2 }}
            >
              <motion.div
                className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-rose-500 to-amber-400 blur-2xl opacity-60"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative w-24 h-24 rounded-[28px] bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 flex items-center justify-center shadow-2xl">
                <div className="absolute inset-1 rounded-[24px] border-2 border-white/20" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                  className="text-5xl"
                >
                  🦸
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-[28px] border-2 border-white/40"
                  animate={{ scale: [1, 1.2], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl font-black tracking-tight text-white">
                Community{' '}
                <motion.span
                  className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent"
                  style={{ backgroundSize: '200% 100%' }}
                >
                  GO
                </motion.span>
              </h1>
              <motion.p
                className="text-sm text-white/60 mt-2 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                everyone is a HERO!
              </motion.p>
            </motion.div>

            <motion.div
              className="mt-8 h-1 w-32 rounded-full bg-white/10 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ delay: 1, duration: 1.2, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
