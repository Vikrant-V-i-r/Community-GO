'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Share2, Download, Phone, Mail, MessageCircle, Copy, Check, Loader2, FileText,
} from 'lucide-react'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import {
  STATUS_META, CATEGORY_META, SEVERITY_META, DEPT_META,
} from '@/lib/constants'
import type { IssueDetail, AuthorityContact } from '@/lib/types'
import { getAuthorities } from '@/lib/local-db'

export interface ShareModalProps {
  issue: IssueDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ShareModal({ issue, open, onOpenChange }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const authorities: AuthorityContact[] = typeof window !== 'undefined' ? getAuthorities() : []

  const shareUrl = issue && typeof window !== 'undefined'
    ? `${window.location.origin}/?issue=${issue.id}`
    : ''

  async function generatePDF() {
    if (!issue) return
    setGenerating(true)
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const W = doc.internal.pageSize.getWidth()
      const margin = 36
      const innerW = W - margin * 2

      // === Header bar ===
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, W, 80, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text('Community Hero', margin, 40)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(180, 180, 200)
      doc.text('Civic Issue Report Card', margin, 58)

      // Status badge top right
      const status = issue.status
      const statusColor =
        status === 'SOLVED' ? [22, 163, 74] : status === 'WIP' ? [245, 158, 11] : [220, 38, 38]
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
      doc.roundedRect(W - margin - 90, 22, 90, 26, 4, 4, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(status, W - margin - 45, 38, { align: 'center' })

      // === Title ===
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      const titleLines = doc.splitTextToSize(issue.title, innerW)
      doc.text(titleLines, margin, 110)

      // === Category / Severity / Authority pills ===
      let y = 110 + titleLines.length * 18 + 12
      const pills = [
        { label: CATEGORY_META[issue.category]?.label || issue.category, color: [220, 38, 38] },
        { label: `Severity: ${SEVERITY_META[issue.severity]?.label}`, color: [245, 158, 11] },
        { label: DEPT_META[issue.authorityDept]?.label || issue.authorityDept, color: [14, 165, 233] },
      ]
      let x = margin
      pills.forEach((p) => {
        const textW = doc.getTextWidth(p.label) + 16
        doc.setFillColor(p.color[0], p.color[1], p.color[2])
        doc.roundedRect(x, y, textW, 18, 9, 9, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(p.label, x + 8, y + 13)
        x += textW + 6
      })

      y += 32

      // === Description ===
      doc.setTextColor(50, 50, 50)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const descLines = doc.splitTextToSize(issue.description, innerW)
      doc.text(descLines, margin, y)
      y += descLines.length * 12 + 16

      // === Location box ===
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, y, innerW, 70, 6, 6, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('LOCATION', margin + 12, y + 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(issue.address, margin + 12, y + 36)
      doc.setTextColor(14, 165, 233)
      doc.textWithLink(
        `Open in Google Maps: https://maps.google.com/?q=${issue.lat},${issue.lng}`,
        margin + 12, y + 54, { url: `https://www.google.com/maps?q=${issue.lat},${issue.lng}` }
      )
      y += 86

      // === Timeline ===
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('TIMELINE', margin, y)
      y += 16

      issue.updates.forEach((u) => {
        const dt = new Date(u.createdAt).toLocaleString('en-IN')
        const sc =
          u.status === 'SOLVED' ? [22, 163, 74] : u.status === 'WIP' ? [245, 158, 11] : [220, 38, 38]
        doc.setFillColor(sc[0], sc[1], sc[2])
        doc.circle(margin + 4, y + 4, 4, 'F')
        doc.setTextColor(80, 80, 80)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text(`${u.status}  ·  @${u.user.handle}  ·  ${dt}`, margin + 14, y + 7)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        const cLines = doc.splitTextToSize(u.comment, innerW - 14)
        doc.text(cLines, margin + 14, y + 19)
        y += 22 + cLines.length * 10
      })

      // === QR code (bottom right) ===
      const qrData = await QRCode.toDataURL(shareUrl, { width: 120, margin: 1 })
      doc.addImage(qrData, 'PNG', W - margin - 80, doc.internal.pageSize.getHeight() - 110, 80, 80)
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('Scan to view live status', W - margin - 40, doc.internal.pageSize.getHeight() - 22, { align: 'center' })

      // === Footer ===
      doc.setFontSize(8)
      doc.setTextColor(140, 140, 140)
      doc.text(
        `Reported by @${issue.reporter?.handle || 'anonymous'} on ${new Date(issue.createdAt).toLocaleString('en-IN')}`,
        margin, doc.internal.pageSize.getHeight() - 30
      )
      doc.text(
        `Report ID: ${issue.id}  ·  Generated by Community Hero`,
        margin, doc.internal.pageSize.getHeight() - 18
      )

      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (e) {
      console.error('PDF generation failed', e)
    }
    setGenerating(false)
  }

  function copyLink() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function shareWhatsApp(contact?: AuthorityContact) {
    const text = `Community Hero Issue Report\n\n${issue?.title}\n\n${issue?.description}\n\nLocation: ${issue?.address}\nMaps: https://maps.google.com/?q=${issue?.lat},${issue?.lng}\n\nTrack live: ${shareUrl}`
    const phone = contact?.phone?.replace(/[^0-9]/g, '') || ''
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  function shareEmail(contact?: AuthorityContact) {
    const subject = `Community Hero: ${issue?.title}`
    const body = `Hi ${contact?.name || 'Team'},\n\nI would like to report the following civic issue via the Community Hero platform:\n\nTitle: ${issue?.title}\nCategory: ${CATEGORY_META[issue?.category || 'OTHER']?.label}\nSeverity: ${issue?.severity}\nAuthority: ${DEPT_META[issue?.authorityDept || 'BBMP']?.label}\n\nDescription:\n${issue?.description}\n\nLocation: ${issue?.address}\nGoogle Maps: https://maps.google.com/?q=${issue?.lat},${issue?.lng}\n\nTrack live status: ${shareUrl}\n\nThank you for your prompt attention.\n\n— Reported via Community Hero`
    window.open(
      `mailto:${contact?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    )
  }

  const relevantAuthorities = issue
    ? authorities.filter((a) => a.dept === issue.authorityDept)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-violet-600" /> Share to Authorities
          </DialogTitle>
          <DialogDescription>
            Send a polished report to the right department. Or share the live link.
          </DialogDescription>
        </DialogHeader>

        {issue && (
          <div className="space-y-4">
            {/* Issue preview */}
            <div className="rounded-2xl bg-slate-50 p-3 flex gap-3">
              <img src={issue.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{issue.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {CATEGORY_META[issue.category]?.emoji} {CATEGORY_META[issue.category]?.label} · {SEVERITY_META[issue.severity].label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Routed to {DEPT_META[issue.authorityDept]?.label}</div>
              </div>
            </div>

            {/* Generate PDF */}
            <Button
              onClick={generatePDF}
              disabled={generating}
              className="w-full h-11 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating PDF…</>
              ) : (
                <><FileText className="h-4 w-4 mr-2" /> Generate PDF Report Card</>
              )}
            </Button>

            {pdfUrl && (
              <a href={pdfUrl} download={`community-hero-${issue.id}.pdf`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </a>
            )}

            {/* Copy live link */}
            <div className="rounded-xl bg-slate-100 p-2 flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs text-slate-700 outline-none"
              />
              <Button size="sm" variant="ghost" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Direct share to relevant authorities */}
            <div>
              <div className="text-xs font-bold uppercase text-slate-500 mb-2">
                One-tap send to {DEPT_META[issue.authorityDept]?.label}
              </div>
              {relevantAuthorities.length === 0 ? (
                <p className="text-xs text-slate-400">No contacts on file for this department.</p>
              ) : (
                <div className="space-y-2">
                  {relevantAuthorities.map((c) => (
                    <div key={c.id} className="rounded-xl bg-white border border-slate-200 p-2.5">
                      <div className="text-sm font-bold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-500 mb-2">{c.phone} · {c.email}</div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => shareWhatsApp(c)} className="flex-1 text-emerald-700 border-emerald-300">
                          <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => shareEmail(c)} className="flex-1">
                          <Mail className="h-3.5 w-3.5 mr-1" /> Email
                        </Button>
                        <a href={`tel:${c.phone}`}>
                          <Button size="sm" variant="outline" className="px-3">
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generic share */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => shareWhatsApp()}
            >
              <MessageCircle className="h-4 w-4 mr-2" /> Share to WhatsApp (any contact)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
