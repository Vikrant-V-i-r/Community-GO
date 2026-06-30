import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/issues/[id]/update — append a status update to the timeline
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { userId, status, comment, imageUrl } = body as {
    userId: string
    status: 'FRESH' | 'WIP' | 'SOLVED'
    comment: string
    imageUrl?: string
  }

  if (!userId || !status || !comment) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const issue = await db.issue.findUnique({ where: { id } })
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

  // Create timeline entry
  const update = await db.issueUpdate.create({
    data: { issueId: id, userId, status, comment, imageUrl },
  })

  // Update issue status + timestamps
  const updated = await db.issue.update({
    where: { id },
    data: {
      status,
      updatedAt: new Date(),
      resolvedAt: status === 'SOLVED' ? new Date() : issue.resolvedAt,
    },
  })

  // Reward the updater (WIP = 10 coins, SOLVED = 100 coins)
  let coinReward = 0
  let xpReward = 0
  if (status === 'WIP') {
    coinReward = 10
    xpReward = 50
  } else if (status === 'SOLVED') {
    coinReward = 100
    xpReward = 500
  }

  if (coinReward > 0) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (user) {
      const newCoins = user.coins + coinReward
      const newXp = user.xp + xpReward
      const newLevel = Math.floor(newXp / 600) + 1
      await db.user.update({
        where: { id: userId },
        data: { coins: newCoins, xp: newXp, level: newLevel },
      })
    }
  }

  // Broadcast an alert to the reporter + everyone who verified
  const verifiers = await db.verification.findMany({
    where: { issueId: id },
    select: { userId: true },
  })
  const alertTargets = new Set<string>([issue.reporterId, ...verifiers.map((v) => v.userId)])
  for (const targetId of alertTargets) {
    await db.alert.create({
      data: {
        userId: targetId,
        type: 'STATUS_CHANGE',
        message: `Update on "${issue.title.slice(0, 60)}…" — now ${status}`,
        issueId: id,
      },
    })
  }

  return NextResponse.json({ ok: true, update, issue: updated, coinReward, xpReward })
}
