import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/authorities
export async function GET() {
  const contacts = await db.authorityContact.findMany()
  return NextResponse.json({ contacts })
}
