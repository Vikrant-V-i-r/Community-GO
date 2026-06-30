/**
 * Cleanup script — removes test data so the demo starts clean.
 * Keeps the 6 seed users + 10 seed issues intact.
 *
 * Run: bun run /home/z/my-project/scripts/cleanup-test-data.ts
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const db = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up test data...')

  // 1. Find test users (any handle that's not in the seed list)
  const seedHandles = [
    'CivicRaptor', 'PotholeHunter', 'BengaluruBrave',
    'JungleRani', 'StreetWatch', 'FixItFox',
  ]
  const testUsers = await db.user.findMany({
    where: { handle: { notIn: seedHandles } },
    select: { id: true, handle: true },
  })
  console.log(`Found ${testUsers.length} test users to remove`)

  for (const u of testUsers) {
    // delete their issues (cascade handles updates, verifications, alerts)
    await db.issue.deleteMany({ where: { reporterId: u.id } })
    await db.issueUpdate.deleteMany({ where: { userId: u.id } })
    await db.verification.deleteMany({ where: { userId: u.id } })
    await db.alert.deleteMany({ where: { userId: u.id } })
    await db.user.delete({ where: { id: u.id } })
    console.log(`  ✓ removed @${u.handle}`)
  }

  // 2. Remove uploaded test images
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir)
    for (const f of files) {
      if (f.startsWith('issue-')) {
        fs.unlinkSync(path.join(uploadsDir, f))
        console.log(`  ✓ removed ${f}`)
      }
    }
  }

  console.log('\n✨ Cleanup complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
