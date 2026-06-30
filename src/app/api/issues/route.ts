import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/issues — list all issues (optionally filter by bbox or status)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const limit = Number(searchParams.get('limit') || 200)

  const where: any = {}
  if (status) where.status = status
  if (category) where.category = category

  const issues = await db.issue.findMany({
    where,
    include: {
      reporter: { select: { id: true, handle: true, avatar: true } },
      _count: { select: { verifications: true, updates: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ issues })
}
