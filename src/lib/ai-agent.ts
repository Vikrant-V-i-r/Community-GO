/**
 * AI Agent Service — wraps z-ai-web-dev-sdk for Gemini-style vision + chat.
 *
 * Agentic pipeline:
 *  1. Vision model classifies the photo (category, severity, authority dept)
 *  2. LLM generates a clean title + concise description from the classification
 *  3. LLM suggests follow-up verification questions for the reporter
 *  4. On-demand: "freshness check" agent decides if a stale issue is still active
 */
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

let zaiInstance: any = null

async function getZAI() {
  if (zaiInstance) return zaiInstance
  zaiInstance = await ZAI.create()
  return zaiInstance
}

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

const CATEGORIES = [
  'POTHOLE',
  'WATER_LEAK',
  'STREETLIGHT',
  'GARBAGE',
  'ROAD_DAMAGE',
  'DRAINAGE',
  'OTHER',
] as const

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

const DEPTS = ['BBMP', 'TRAFFIC', 'WATER_BOARD', 'ELECTRICITY', 'FIRE', 'POLICE'] as const

/**
 * Convert a local file path or buffer to a base64 data URL for vision API.
 */
export function fileToDataUrl(filePath: string): string {
  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mime =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

/**
 * Main agentic pipeline: feed the photo to vision + chat and get structured output.
 */
export async function analyzeIssueImage(
  imagePath: string,
  userContext?: { handle: string; address?: string }
): Promise<IssueAnalysis> {
  try {
    const zai = await getZAI()
    const dataUrl = fileToDataUrl(imagePath)

    // === AGENT 1: Vision model — classify the infrastructure problem ===
    const visionResponse = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'system',
          content:
            'You are a civic infrastructure analysis agent for Indian cities. Analyze photos of community issues (potholes, water leaks, broken streetlights, garbage, road damage, drainage issues). Respond ONLY with valid JSON matching the requested schema. Do not include markdown fences or extra text.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this civic infrastructure photo taken in an Indian city${userContext?.address ? ` near ${userContext.address}` : ''}.

Return STRICT JSON with this exact shape:
{
  "category": one of ${JSON.stringify([...CATEGORIES])},
  "severity": one of ${JSON.stringify([...SEVERITIES])} (CRITICAL = immediate danger to life/safety, HIGH = serious risk or large waste, MEDIUM = noticeable inconvenience, LOW = minor),
  "authorityDept": one of ${JSON.stringify([...DEPTS])} (BBMP = municipal corp / roads / garbage / drains, TRAFFIC = traffic signals & road safety, WATER_BOARD = water supply & leakage, ELECTRICITY = streetlights & power, FIRE = fire hazard, POLICE = crime/safety),
  "title": a punchy 6-12 word title describing the issue,
  "description": a 2-3 sentence factual description of what's visible and its impact,
  "confidence": float 0.0 to 1.0 representing your classification confidence,
  "safetyTips": one short safety tip for citizens encountering this issue,
  "estimatedImpact": one phrase describing who/what is affected (e.g. "Two-wheeler riders on morning commute", "500+ daily pedestrians")
}`,
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = visionResponse?.choices?.[0]?.message?.content || ''

    // Extract JSON from response (handles ```json fences + bare JSON)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON in vision response: ' + raw.slice(0, 200))
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate + clamp
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'OTHER'
    const severity = SEVERITIES.includes(parsed.severity) ? parsed.severity : 'MEDIUM'
    const authorityDept = DEPTS.includes(parsed.authorityDept)
      ? parsed.authorityDept
      : 'BBMP'

    return {
      category,
      severity,
      authorityDept,
      title: String(parsed.title || 'Community Issue Reported').slice(0, 200),
      description: String(parsed.description || '').slice(0, 800),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
      safetyTips: String(parsed.safetyTips || 'Exercise caution near the affected area.').slice(0, 200),
      estimatedImpact: String(parsed.estimatedImpact || 'Local residents and commuters').slice(0, 200),
    }
  } catch (err: any) {
    console.error('[AI] analyzeIssueImage failed:', err.message)
    // Graceful fallback so the report flow never dead-ends
    return {
      category: 'OTHER',
      severity: 'MEDIUM',
      authorityDept: 'BBMP',
      title: 'Community Issue Reported',
      description:
        'AI analysis was unavailable. Please review the photo and add a manual description before submitting.',
      confidence: 0,
      safetyTips: 'Exercise caution near the affected area.',
      estimatedImpact: 'Local residents and commuters',
    }
  }
}

/**
 * AGENT 2: Freshness check — given an issue's photo + age + last status,
 * decide whether it's likely still active or has likely been resolved.
 * Used to suggest "verify this issue" prompts to passersby.
 */
export async function checkIssueFreshness(params: {
  category: string
  severity: string
  daysOld: number
  lastStatus: string
}): Promise<{ likelyStillActive: boolean; suggestedAction: string }> {
  try {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a civic issue triage agent. Decide whether a reported issue is likely still active based on its metadata. Reply in valid JSON only.',
        },
        {
          role: 'user',
          content: `Issue metadata:
- Category: ${params.category}
- Severity: ${params.severity}
- Days since reported: ${params.daysOld}
- Last known status: ${params.lastStatus}

Return JSON: { "likelyStillActive": boolean, "suggestedAction": "one short sentence" }`,
        },
      ],
      thinking: { type: 'disabled' },
    })
    const raw = completion?.choices?.[0]?.message?.content || ''
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('no json')
    const p = JSON.parse(m[0])
    return {
      likelyStillActive: Boolean(p.likelyStillActive),
      suggestedAction: String(p.suggestedAction || 'Verify on-site if you pass by.'),
    }
  } catch (e: any) {
    // Heuristic fallback
    const stillActive =
      params.lastStatus !== 'SOLVED' && params.daysOld < 14
    return {
      likelyStillActive: stillActive,
      suggestedAction: stillActive
        ? 'Issue is recent — please verify if you are nearby.'
        : 'Issue is older — confirm it is still active before acting.',
    }
  }
}
