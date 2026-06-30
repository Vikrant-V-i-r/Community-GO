import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let zaiInstance: any = null
async function getZAI() {
  if (zaiInstance) return zaiInstance
  zaiInstance = await ZAI.create()
  return zaiInstance
}

const CATEGORIES = ['POTHOLE', 'WATER_LEAK', 'STREETLIGHT', 'GARBAGE', 'ROAD_DAMAGE', 'DRAINAGE', 'OTHER']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const DEPTS = ['BBMP', 'TRAFFIC', 'WATER_BOARD', 'ELECTRICITY', 'FIRE', 'POLICE']

export interface IssueAnalysis {
  category: string
  severity: string
  authorityDept: string
  title: string
  description: string
  confidence: number
  safetyTips: string
  estimatedImpact: string
}

function fileToDataUrl(filePath: string): string {
  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

async function analyzeIssueImage(imagePath: string): Promise<IssueAnalysis> {
  try {
    const zai = await getZAI()
    const dataUrl = fileToDataUrl(imagePath)

    const visionResponse = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'system',
          content: 'You are a civic infrastructure analysis agent for Indian cities. Analyze photos of community issues (potholes, water leaks, broken streetlights, garbage, road damage, drainage issues). Respond ONLY with valid JSON matching the requested schema. Do not include markdown fences or extra text.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this civic infrastructure photo taken in an Indian city.

Return STRICT JSON with this exact shape:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "severity": one of ${JSON.stringify(SEVERITIES)} (CRITICAL = immediate danger to life/safety, HIGH = serious risk or large waste, MEDIUM = noticeable inconvenience, LOW = minor),
  "authorityDept": one of ${JSON.stringify(DEPTS)} (BBMP = municipal corp / roads / garbage / drains, TRAFFIC = traffic signals & road safety, WATER_BOARD = water supply & leakage, ELECTRICITY = streetlights & power, FIRE = fire hazard, POLICE = crime/safety),
  "title": a punchy 6-12 word title describing the issue,
  "description": a 2-3 sentence factual description of what's visible and its impact,
  "confidence": float 0.0 to 1.0 representing your classification confidence,
  "safetyTips": one short safety tip for citizens encountering this issue,
  "estimatedImpact": one phrase describing who/what is affected (e.g. "Two-wheeler riders on morning commute", "500+ daily pedestrians")
}

Rules:
- category: POTHOLE = hole in road, WATER_LEAK = water pipe/seepage, STREETLIGHT = broken light, GARBAGE = waste pile, ROAD_DAMAGE = cracked/broken road surface, DRAINAGE = open/blocked drain, OTHER = anything else
- If the photo doesn't show a civic issue (e.g. a selfie, a product photo), return category="OTHER", severity="LOW", confidence=0.3, and explain in description that no civic issue is visible
- title: max 12 words, no quotes, no trailing period
- description: max 500 chars, factual, no opinions
- confidence: 0.0-1.0 (be honest — if unsure, return 0.5-0.7)`,
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = visionResponse?.choices?.[0]?.message?.content || ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in vision response: ' + raw.slice(0, 200))
    const parsed = JSON.parse(jsonMatch[0])

    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : 'OTHER',
      severity: SEVERITIES.includes(parsed.severity) ? parsed.severity : 'MEDIUM',
      authorityDept: DEPTS.includes(parsed.authorityDept) ? parsed.authorityDept : 'BBMP',
      title: String(parsed.title || 'Community Issue Reported').slice(0, 200),
      description: String(parsed.description || '').slice(0, 800),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
      safetyTips: String(parsed.safetyTips || 'Exercise caution near the affected area.').slice(0, 200),
      estimatedImpact: String(parsed.estimatedImpact || 'Local residents and commuters').slice(0, 200),
    }
  } catch (err: any) {
    console.error('[AI] analyzeIssueImage failed:', err.message)
    return {
      category: 'OTHER',
      severity: 'MEDIUM',
      authorityDept: 'BBMP',
      title: 'Community Issue Reported',
      description: 'AI analysis was unavailable. Please review the photo and add a manual description before submitting.',
      confidence: 0,
      safetyTips: 'Exercise caution near the affected area.',
      estimatedImpact: 'Local residents and commuters',
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })
    }
    const matches = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
    }
    const mime = matches[1]
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
    const buffer = Buffer.from(matches[2], 'base64')
    const tempDir = os.tmpdir()
    const fileName = `analyze-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = path.join(tempDir, fileName)
    fs.writeFileSync(filePath, buffer)

    try {
      const analysis = await analyzeIssueImage(filePath)
      return NextResponse.json({ analysis })
    } finally {
      try { fs.unlinkSync(filePath) } catch {}
    }
  } catch (err: any) {
    console.error('[/api/analyze] Top-level error:', err.message)
    return NextResponse.json({
      analysis: {
        category: 'OTHER',
        severity: 'MEDIUM',
        authorityDept: 'BBMP',
        title: 'Community Issue Reported',
        description: 'AI analysis was unavailable. Please review the photo and add a manual description before submitting.',
        confidence: 0,
        safetyTips: 'Exercise caution near the affected area.',
        estimatedImpact: 'Local residents and commuters',
      },
      warning: 'AI service unavailable — using fallback. ' + err.message,
    })
  }
}
