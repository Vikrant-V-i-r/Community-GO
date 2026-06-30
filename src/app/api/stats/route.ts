import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats — impact dashboard numbers
export async function GET() {
  const totalIssues = await db.issue.count()
  const solved = await db.issue.count({ where: { status: 'SOLVED' } })
  const wip = await db.issue.count({ where: { status: 'WIP' } })
  const fresh = await db.issue.count({ where: { status: 'FRESH' } })
  const totalUsers = await db.user.count()
  const totalVerifications = await db.verification.count()

  const categories = await db.issue.groupBy({
    by: ['category'],
    _count: { _all: true },
  })

  const solvedIssues = await db.issue.findMany({
    where: { status: 'SOLVED', resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
  })
  const avgResolutionHours =
    solvedIssues.length > 0
      ? solvedIssues.reduce((sum, i) => {
          const hours = ((i.resolvedAt?.getTime() || 0) - i.createdAt.getTime()) / 3600000
          return sum + hours
        }, 0) / solvedIssues.length
      : 0

  return NextResponse.json({
    totalIssues, solved, wip, fresh, totalUsers, totalVerifications,
    avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
    categories: categories.map((c) => ({ category: c.category, count: c._count._all })),
  })
}
