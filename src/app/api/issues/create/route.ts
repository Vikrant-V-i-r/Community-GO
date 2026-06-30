import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyzeIssueImage } from '@/lib/ai-agent'
import fs from 'fs'
import path from 'path'

// POST /api/issues/create
// Body (multipart-like JSON): { userId, imageBase64, lat, lng, address, title?, description?, category?, severity?, authorityDept? }
// If title/description/category are missing, AI agent will analyze the image and fill them in.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    userId,
    imageBase64,
    lat,
    lng,
    address,
    title,
    description,
    category,
    severity,
    authorityDept,
  } = body as {
    userId: string
    imageBase64: string
    lat: number
    lng: number
    address: string
    title?: string
    description?: string
    category?: string
    severity?: string
    authorityDept?: string
  }

  if (!userId || !imageBase64 || lat == null || lng == null) {
    return NextResponse.json(
      { error: 'userId, imageBase64, lat, lng are required' },
      { status: 400 }
    )
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // 1) Persist the image to /public/uploads
  const matches = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/)
  if (!matches) {
    return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
  }
  const mime = matches[1]
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const buffer = Buffer.from(matches[2], 'base64')
  const fileName = `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, fileName)
  fs.writeFileSync(filePath, buffer)
  const imageUrl = `/uploads/${fileName}`

  // 2) Run the AI agentic pipeline on the image
  let aiTitle = title
  let aiDescription = description
  let aiCategory = category
  let aiSeverity = severity
  let aiAuthority = authorityDept
  let aiConfidence = 0
  let aiSafetyTips = ''
  let aiEstimatedImpact = ''

  if (!title || !description || !category) {
    const analysis = await analyzeIssueImage(filePath, {
      handle: user.handle,
      address,
    })
    aiTitle = title || analysis.title
    aiDescription = description || analysis.description
    aiCategory = category || analysis.category
    aiSeverity = severity || analysis.severity
    aiAuthority = authorityDept || analysis.authorityDept
    aiConfidence = analysis.confidence
    aiSafetyTips = analysis.safetyTips
    aiEstimatedImpact = analysis.estimatedImpact
  }

  // 3) Create the issue
  const issue = await db.issue.create({
    data: {
      title: aiTitle!,
      description: aiDescription!,
      category: aiCategory!,
      severity: aiSeverity!,
      status: 'FRESH',
      lat,
      lng,
      address,
      imageUrl,
      aiConfidence,
      authorityDept: aiAuthority!,
      reporterId: userId,
    },
  })

  // 4) First timeline entry (auto-creation)
  await db.issueUpdate.create({
    data: {
      issueId: issue.id,
      userId,
      status: 'FRESH',
      comment: `Issue reported by @${user.handle}. AI categorized as ${aiCategory} (${aiConfidence > 0 ? Math.round(aiConfidence * 100) + '% confidence' : 'low confidence'}).${aiSafetyTips ? ' Safety: ' + aiSafetyTips : ''}`,
    },
  })

  // 5) Reward the reporter (50 coins + 100 XP)
  const newCoins = user.coins + 50
  const newXp = user.xp + 100
  const newLevel = Math.floor(newXp / 600) + 1
  await db.user.update({
    where: { id: userId },
    data: { coins: newCoins, xp: newXp, level: newLevel },
  })

  // 6) Broadcast alert to top 10 nearby users (simplified: all civic agents + top leaderboard)
  const civicAgents = await db.user.findMany({
    where: { id: { not: userId }, isCivicAgent: true },
    take: 20,
  })
  for (const agent of civicAgents) {
    await db.alert.create({
      data: {
        userId: agent.id,
        type: 'NEW_ISSUE',
        message: `New ${aiCategory} issue reported near ${address.slice(0, 40)}…`,
        issueId: issue.id,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    issue,
    coinReward: 50,
    xpReward: 100,
    ai: {
      confidence: aiConfidence,
      safetyTips: aiSafetyTips,
      estimatedImpact: aiEstimatedImpact,
    },
  })
}
