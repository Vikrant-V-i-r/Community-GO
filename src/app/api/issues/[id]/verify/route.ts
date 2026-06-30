import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/issues/[id]/verify — community "I also saw this" confirmation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const issue = await db.issue.findUnique({ where: { id } })
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    await db.verification.create({ data: { issueId: id, userId } })
  } catch {
    return NextResponse.json({ ok: true, alreadyVerified: true })
  }

  await db.issue.update({
    where: { id },
    data: { verificationsCount: { increment: 1 } },
  })

  // Reward the verifier (10 coins)
  const user = await db.user.findUnique({ where: { id: userId } })
  if (user) {
    const newCoins = user.coins + 10
    const newXp = user.xp + 20
    await db.user.update({
      where: { id: userId },
      data: { coins: newCoins, xp: newXp, level: Math.floor(newXp / 600) + 1 },
    })
  }

  // Alert the reporter
  await db.alert.create({
    data: {
      userId: issue.reporterId,
      type: 'VERIFICATION',
      message: `Someone verified your report "${issue.title.slice(0, 50)}…"`,
      issueId: id,
    },
  })

  return NextResponse.json({ ok: true, coins: 10 })
}
