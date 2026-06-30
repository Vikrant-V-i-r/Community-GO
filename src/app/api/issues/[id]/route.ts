import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/issues/[id] — full detail with timeline
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const issue = await db.issue.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, handle: true, avatar: true } },
      updates: {
        include: { user: { select: { id: true, handle: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
      verifications: {
        include: { user: { select: { id: true, handle: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ issue })
}
