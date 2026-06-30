'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Camera, ImagePlus, MapPin, Loader2, Sparkles, Wand2,
  AlertTriangle, CheckCircle2, X, BadgeCheck,
} from 'lucide-react'
import { CATEGORY_META, SEVERITY_META, DEPT_META } from '@/lib/constants'
import type { IssueCategory, Severity, AuthorityDept } from '@/lib/types'
import { createIssue } from '@/lib/local-db'

export interface ReportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userPos: [number, number] | null
  address: string
  userId: string
  onSubmitted: (issueId: string) => void
}

type Stage = 'capture' | 'review' | 'analyzing' | 'confirm' | 'submitting' | 'done'

interface AIAnalysis {
  category: string; severity: string; authorityDept: string;
  title: string; description: string; confidence: number;
  safetyTips: string; estimatedImpact: string;
}

export default function ReportSheet({
  open, onOpenChange, userPos, address, userId, onSubmitted,
}: ReportSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('capture')
  const [imageData, setImageData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<IssueCategory | ''>('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [authorityDept, setAuthorityDept] = useState<AuthorityDept | ''>('')
  const [aiConfidence, setAiConfidence] = useState<number>(0)
  const [aiSafetyTips, setAiSafetyTips] = useState<string>('')
  const [aiImpact, setAiImpact] = useState<string>('')
  const [coinReward, setCoinReward] = useState(0)

  function reset() {
    setStage('capture'); setImageData(null)
    setTitle(''); setDescription(''); setCategory(''); setSeverity(''); setAuthorityDept('')
    setAiConfidence(0); setAiSafetyTips(''); setAiImpact(''); setCoinReward(0); setError(null)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setImageData(dataUrl)
      setStage('review')
    }
    reader.readAsDataURL(file)
  }

  async function runAIAnalysis() {
    if (!imageData) return
    setStage('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI analysis failed')

      const a: AIAnalysis = data.analysis
      setTitle(a.title)
      setDescription(a.description)
      setCategory(a.category as IssueCategory)
      setSeverity(a.severity as Severity)
      setAuthorityDept(a.authorityDept as AuthorityDept)
      setAiConfidence(a.confidence)
      setAiSafetyTips(a.safetyTips)
      setAiImpact(a.estimatedImpact)
      setStage('confirm')
    } catch (e: any) {
      setError(e.message || 'AI analysis failed. You can still fill in the details manually.')
      setStage('confirm')
    }
  }

  function submit() {
    if (!imageData || !userPos) return
    setStage('submitting')
    try {
      const result = createIssue({
        userId, imageBase64: imageData, lat: userPos[0], lng: userPos[1], address,
        title: title || 'Community Issue Reported',
        description: description || 'No description provided.',
        category: (category || 'OTHER') as IssueCategory,
        severity: (severity || 'MEDIUM') as Severity,
        authorityDept: (authorityDept || 'BBMP') as AuthorityDept,
        aiConfidence, safetyTips: aiSafetyTips, estimatedImpact: aiImpact,
      })
      setCoinReward(result.coinReward)
      setStage('done')
      setTimeout(() => {
        onSubmitted(result.issue.id)
        onOpenChange(false)
        setTimeout(reset, 400)
      }, 2200)
    } catch (e: any) {
      setError(e.message)
      setStage('confirm')
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(reset, 400) }}>
      <DrawerContent className="max-h-[92vh] bg-white">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-xl font-black">
            <Camera className="h-5 w-5 text-rose-500" /> Report an Issue
          </DrawerTitle>
          <DrawerDescription>
            Snap a photo. AI will categorize &amp; describe it. You confirm before posting.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {stage === 'capture' && (
              <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-400">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-bold text-slate-800 mb-1">Snap the issue</p>
                  <p className="text-xs text-slate-500 mb-4">
                    Pothole, water leak, broken streetlight, garbage pile… get it in frame.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => cameraRef.current?.click()} className="bg-rose-500 hover:bg-rose-600">
                      <Camera className="mr-2 h-4 w-4" /> Take Photo
                    </Button>
                    <Button onClick={() => fileRef.current?.click()} variant="outline">
                      <ImagePlus className="mr-2 h-4 w-4" /> Gallery
                    </Button>
                  </div>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div><strong>Stay safe.</strong> Don't put yourself in danger to capture a photo.</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Location: <strong>{address || 'Detecting…'}</strong></span>
                </div>
              </motion.div>
            )}

            {stage === 'review' && imageData && (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden shadow-lg">
                  <img src={imageData} alt="captured" className="w-full h-64 object-cover" />
                  <button onClick={() => { setStage('capture'); setImageData(null) }} className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Button onClick={runAIAnalysis} className="w-full h-12 text-base font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400">
                  <Wand2 className="mr-2 h-5 w-5" /> ANALYZE WITH AI
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Gemini Vision will categorize the issue, suggest title &amp; description, and route to the right authority.
                </p>
              </motion.div>
            )}

            {stage === 'analyzing' && imageData && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8 space-y-4">
                <div className="relative rounded-2xl overflow-hidden shadow-lg">
                  <img src={imageData} alt="analyzing" className="w-full h-48 object-cover blur-sm" />
                  <div className="absolute inset-0 bg-violet-900/40 flex items-center justify-center">
                    <motion.div className="rounded-2xl bg-white/95 px-4 py-3 flex items-center gap-2 shadow-2xl" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
                      <Sparkles className="h-5 w-5 text-violet-600" />
                      <span className="font-bold text-slate-900 text-sm">AI is analyzing…</span>
                    </motion.div>
                  </div>
                </div>
                <div className="space-y-2 text-center text-sm text-slate-600">
                  <p className="flex items-center justify-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Identifying the issue type…</p>
                  <p className="flex items-center justify-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Estimating severity &amp; impact…</p>
                  <p className="flex items-center justify-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Routing to the right authority…</p>
                </div>
              </motion.div>
            )}

            {(stage === 'confirm' || stage === 'submitting') && imageData && (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-lg relative">
                  <img src={imageData} alt="preview" className="w-full h-44 object-cover" />
                  {aiConfidence > 0 && (
                    <div className="absolute top-2 left-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-black text-white flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI {Math.round(aiConfidence * 100)}%
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}

                <p className="text-xs text-slate-500 -mb-1">
                  {aiConfidence > 0 ? '✅ AI pre-filled the fields below. Edit anything before posting.' : 'Fill in the details below.'}
                </p>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold uppercase">Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pothole on 100 Feet Road" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's happening, who's affected…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold uppercase">Category</Label>
                      <select value={category} onChange={(e) => setCategory(e.target.value as IssueCategory)} className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
                        <option value="">Select…</option>
                        {Object.entries(CATEGORY_META).map(([k, v]) => (<option key={k} value={k}>{v.emoji} {v.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase">Severity</Label>
                      <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
                        <option value="">Select…</option>
                        {Object.entries(SEVERITY_META).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase">Authority Department</Label>
                    <select value={authorityDept} onChange={(e) => setAuthorityDept(e.target.value as AuthorityDept)} className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
                      <option value="">Select…</option>
                      {Object.entries(DEPT_META).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v.label}</option>))}
                    </select>
                  </div>

                  {aiSafetyTips && (
                    <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-xs text-violet-800 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                      <div><strong>AI Safety Tip:</strong> {aiSafetyTips}</div>
                    </div>
                  )}

                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div><strong>Location pinned:</strong> {address}</div>
                  </div>
                </div>

                <Button onClick={submit} disabled={stage === 'submitting' || !title.trim() || !category} className="w-full h-12 text-base font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400">
                  {stage === 'submitting' ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving to your device…</>) : (<><CheckCircle2 className="mr-2 h-5 w-5" /> POST &amp; EARN +50 🪙</>)}
                </Button>
                {(!title.trim() || !category) && <p className="text-center text-[10px] text-amber-600">Add at least a title and category to post.</p>}
              </motion.div>
            )}

            {stage === 'done' && imageData && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center space-y-4">
                <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 12 }} className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl">
                  <BadgeCheck className="h-14 w-14 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Issue Posted! 🎉</h3>
                  <p className="text-slate-600 text-sm">Your report is saved on your device &amp; live on the map.</p>
                </div>
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-amber-100 border-2 border-amber-300 px-4 py-2">
                  <span className="text-2xl">🪙</span>
                  <span className="font-black text-amber-900">+{coinReward} Civic Coins earned!</span>
                </div>
                <p className="text-xs text-slate-400">Opening issue card…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
