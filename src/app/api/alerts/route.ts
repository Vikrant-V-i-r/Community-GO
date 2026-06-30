import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alerts?userId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const alerts = await db.alert.findMany({
    where: { userId },
    include: {
      issue: { select: { id: true, title: true, status: true, category: true, imageUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unread = alerts.filter((a) => !a.read).length
  return NextResponse.json({ alerts, unread })
}

// PATCH /api/alerts — mark as read
export async function PATCH(req: NextRequest) {
  const { userId, alertId, allRead } = await req.json()
  if (allRead && userId) {
    await db.alert.updateMany({ where: { userId, read: false }, data: { read: true } })
    return NextResponse.json({ ok: true })
  }
  if (alertId) {
    await db.alert.update({ where: { id: alertId }, data: { read: true } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'invalid' }, { status: 400 })
}
