import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/users — guest login (creates or returns existing user by handle)
export async function POST(req: NextRequest) {
  const { handle, avatar } = await req.json()
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const cleanHandle = String(handle).trim().slice(0, 30)
  const cleanAvatar = String(avatar || 'hero-1').slice(0, 30)

  let user = await db.user.findUnique({ where: { handle: cleanHandle } })
  if (!user) {
    user = await db.user.create({
      data: {
        handle: cleanHandle,
        avatar: cleanAvatar,
        coins: 50,
        xp: 0,
        level: 1,
        badges: JSON.stringify(['FIRST_REPORT']),
      },
    })

    await db.alert.create({
      data: {
        userId: user.id,
        type: 'BADGE_EARNED',
        message: 'Welcome! You earned the "First Report" badge. Time to spot your first issue!',
      },
    })
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })
  }

  return NextResponse.json({ user })
}

// GET /api/users?leaderboard=true OR ?id=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('leaderboard') === 'true') {
    const users = await db.user.findMany({
      orderBy: { xp: 'desc' },
      take: 50,
      select: {
        id: true, handle: true, avatar: true, coins: true, xp: true,
        level: true, badges: true, isCivicAgent: true, neighborhood: true,
      },
    })
    const enriched = users.map((u, i) => ({
      ...u, badges: JSON.parse(u.badges || '[]'), rank: i + 1,
    }))
    return NextResponse.json({ leaderboard: enriched })
  }

  const userId = searchParams.get('id')
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        issues: {
          select: { id: true, title: true, status: true, category: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        alerts: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ user: { ...user, badges: JSON.parse(user.badges || '[]') } })
  }
  return NextResponse.json({ error: 'id or leaderboard required' }, { status: 400 })
}
