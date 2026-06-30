/**
 * Seed script — populates the DB with realistic Indian civic issues,
 * dummy users, leaderboards, and authority contacts.
 *
 * Run: bun run /home/z/my-project/scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Bengaluru coordinates (Indiranagar area) as the demo city fallback
const BLR_CENTER = { lat: 12.9719, lng: 77.6412 }

// Helper to jitter coordinates around a center
const jitter = (base: number, spread = 0.02) =>
  base + (Math.random() - 0.5) * spread

// Realistic Bengaluru civic issues (lat/lng approx around Indiranagar/Koramangala/HSR)
const ISSUES = [
  {
    title: 'Deep pothole on 100 Feet Road near Indiranagar metro',
    description:
      'A large pothole has opened up near the Indiranagar metro station exit on 100 Feet Road. It is approximately 2 feet wide and 6 inches deep, posing a serious risk to two-wheeler riders, especially at night. Water has accumulated inside making it hard to judge depth. Multiple near-misses observed during morning rush hour.',
    category: 'POTHOLE',
    severity: 'CRITICAL',
    status: 'FRESH',
    lat: 12.9784,
    lng: 77.6408,
    address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    authorityDept: 'BBMP',
    imageUrl:
      'https://images.unsplash.com/photo-1597007069834-7b1c6fbf1c69?w=800&q=80',
    daysAgo: 1,
  },
  {
    title: 'Streetlight not working on Koramangala 5th block',
    description:
      'Three consecutive streetlights have been non-functional for the past week on the inner ring road stretch between Koramangala 5th block and Sony World signal. The area becomes pitch dark after 7 PM and there have been reports of snatching incidents. Pedestrians and women commuters feel unsafe walking through this stretch.',
    category: 'STREETLIGHT',
    severity: 'HIGH',
    status: 'WIP',
    lat: 12.9352,
    lng: 77.6245,
    address: 'Inner Ring Road, Koramangala 5th Block, Bengaluru 560095',
    authorityDept: 'ELECTRICITY',
    imageUrl:
      'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800&q=80',
    daysAgo: 4,
  },
  {
    title: 'Water leakage from main pipeline near HSR BDA Complex',
    description:
      'A major water leak has been reported from the BWSSB pipeline near HSR BDA Complex. Water has been continuously flowing onto the road for 3 days, creating a small pond and wasting thousands of litres of precious drinking water. The road surface has started eroding and there is a risk of vehicles skidding.',
    category: 'WATER_LEAK',
    severity: 'HIGH',
    status: 'WIP',
    lat: 12.9116,
    lng: 77.6474,
    address: 'HSR Layout, BDA Complex, Bengaluru 560102',
    authorityDept: 'WATER_BOARD',
    imageUrl:
      'https://images.unsplash.com/photo-1572865764715-9ba4b67c1d50?w=800&q=80',
    daysAgo: 2,
  },
  {
    title: 'Garbage pileup near Bellandur lake gate',
    description:
      'Large pile of unsegregated garbage has accumulated near the Bellandur lake entrance gate. Mixed plastic, construction debris and food waste is attracting stray dogs and rodents. Foul smell is affecting nearby residents. BBMP garbage truck has not visited this route in 5 days.',
    category: 'GARBAGE',
    severity: 'MEDIUM',
    status: 'FRESH',
    lat: 12.9317,
    lng: 77.6701,
    address: 'Bellandur Lake Gate Road, Bengaluru 560103',
    authorityDept: 'BBMP',
    imageUrl:
      'https://images.unsplash.com/photo-1604917626779-9a9d2079c8e6?w=800&q=80',
    daysAgo: 3,
  },
  {
    title: 'Damaged road divider on Outer Ring Road',
    description:
      'The concrete divider on ORR between Marathahalli and Bellandur has been broken in multiple places after a truck collision last week. The iron reinforcement rods are exposed and dangerous. Vehicles are crossing into oncoming traffic in the gaps, especially two-wheelers.',
    category: 'ROAD_DAMAGE',
    severity: 'HIGH',
    status: 'SOLVED',
    lat: 12.9545,
    lng: 77.6963,
    address: 'Outer Ring Road, Marathahalli, Bengaluru 560037',
    authorityDept: 'BBMP',
    imageUrl:
      'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80',
    daysAgo: 14,
  },
  {
    title: 'Open drain cover missing near Whitefield Main Road',
    description:
      'The concrete slab covering a stormwater drain has been missing for 2 weeks on Whitefield Main Road. The open drain is a death trap for pedestrians and two-wheeler riders, especially during rain when water level rises. A child narrowly avoided falling in yesterday.',
    category: 'DRAINAGE',
    severity: 'CRITICAL',
    status: 'FRESH',
    lat: 12.9698,
    lng: 77.7500,
    address: 'Whitefield Main Road, Bengaluru 560066',
    authorityDept: 'BBMP',
    imageUrl:
      'https://images.unsplash.com/photo-1574359411659-15673a2c1ba0?w=800&q=80',
    daysAgo: 1,
  },
  {
    title: 'Pothole cluster near EGL Park junction',
    description:
      'Cluster of 4 potholes near the EGL Park junction on Outer Ring Road causing major traffic slowdown during peak hours. Two-wheelers are forced to swerve dangerously into car lanes to avoid them. The situation worsens after every rain as the holes expand.',
    category: 'POTHOLE',
    severity: 'HIGH',
    status: 'WIP',
    lat: 12.9279,
    lng: 77.6271,
    address: 'EGL Park Junction, Outer Ring Road, Bengaluru 560071',
    authorityDept: 'BBMP',
    imageUrl:
      'https://images.unsplash.com/photo-1625229135355-9e3d5c1f7c2e?w=800&q=80',
    daysAgo: 6,
  },
  {
    title: 'Tree fallen on MG Road blocking cycle lane',
    description:
      'A large rain-tree branch has fallen across the cycle lane on MG Road near Trinity Metro. Cyclists are forced onto the main carriageway. BBMP forest cell has been informed but no action yet. Branch is also touching overhead power lines.',
    category: 'OTHER',
    severity: 'MEDIUM',
    status: 'SOLVED',
    lat: 12.9756,
    lng: 77.6168,
    address: 'MG Road, Trinity Circle, Bengaluru 560001',
    authorityDept: 'BBMP',
    imageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80',
    daysAgo: 10,
  },
  {
    title: 'Broken traffic signal at Silk Board junction',
    description:
      'The traffic signal at Silk Board Junction (one of the most congested in Bengaluru) has been stuck on amber for the past 2 days. Traffic police are manually managing signals during peak hours but chaos reigns off-peak. Estimated 30,000+ vehicles affected per hour.',
    category: 'OTHER',
    severity: 'CRITICAL',
    status: 'FRESH',
    lat: 12.9170,
    lng: 77.6223,
    address: 'Silk Board Junction, Bengaluru 560068',
    authorityDept: 'TRAFFIC',
    imageUrl:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    daysAgo: 1,
  },
  {
    title: 'Sewage overflow on CMH Road',
    description:
      'Sewage water is overflowing onto CMH Road in Indiranagar from a blocked manhole. The smell is unbearable for shopkeepers and pedestrians. Health risk is severe — possible cholera/dysentery outbreak if not fixed urgently.',
    category: 'DRAINAGE',
    severity: 'CRITICAL',
    status: 'FRESH',
    lat: 12.9784,
    lng: 77.6408,
    address: 'CMH Road, Indiranagar, Bengaluru 560038',
    authorityDept: 'BBMP',
    imageUrl:
      'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&q=80',
    daysAgo: 1,
  },
]

const AUTHORITY_CONTACTS = [
  {
    name: 'BBMP Control Room',
    dept: 'BBMP',
    phone: '+91802260000',
    email: 'mayor@bbmp.gov.in',
    area: 'Bengaluru',
    icon: 'municipal',
  },
  {
    name: 'Bengaluru Traffic Police',
    dept: 'TRAFFIC',
    phone: '+91802294300',
    email: 'cptraffic@ksp.gov.in',
    area: 'Bengaluru',
    icon: 'police',
  },
  {
    name: 'BWSSB Water Board',
    dept: 'WATER_BOARD',
    phone: '+91802226666',
    email: 'chairman@bwssb.gov.in',
    area: 'Bengaluru',
    icon: 'water',
  },
  {
    name: 'BESCOM Electricity',
    dept: 'ELECTRICITY',
    phone: '+91802287333',
    email: 'helpdesk@bescom.org',
    area: 'Bengaluru',
    icon: 'electric',
  },
  {
    name: 'Bengaluru Fire & Emergency',
    dept: 'FIRE',
    phone: '+91802210101',
    email: 'fire@karnataka.gov.in',
    area: 'Bengaluru',
    icon: 'fire',
  },
  {
    name: 'Bengaluru City Police',
    dept: 'POLICE',
    phone: '+91802294300',
    email: 'cpbcity@ksp.gov.in',
    area: 'Bengaluru',
    icon: 'police',
  },
]

const SEED_USERS = [
  { handle: 'CivicRaptor', avatar: 'hero-1', coins: 1250, xp: 4200, level: 8, badges: ['FIRST_REPORT', 'POTHOLE_SLAYER', 'NEIGHBORHOOD_WATCH', 'VERIFIED_REPORTER', 'CIVIC_HERO'], isCivicAgent: true },
  { handle: 'PotholeHunter', avatar: 'hero-2', coins: 980, xp: 3100, level: 6, badges: ['FIRST_REPORT', 'POTHOLE_SLAYER', 'VERIFIED_REPORTER'], isCivicAgent: false },
  { handle: 'BengaluruBrave', avatar: 'hero-3', coins: 740, xp: 2400, level: 5, badges: ['FIRST_REPORT', 'NEIGHBORHOOD_WATCH'], isCivicAgent: false },
  { handle: 'JungleRani', avatar: 'hero-4', coins: 520, xp: 1800, level: 4, badges: ['FIRST_REPORT', 'CIVIC_HERO'], isCivicAgent: false },
  { handle: 'StreetWatch', avatar: 'hero-5', coins: 410, xp: 1500, level: 3, badges: ['FIRST_REPORT', 'VERIFIED_REPORTER'], isCivicAgent: false },
  { handle: 'FixItFox', avatar: 'hero-6', coins: 290, xp: 1100, level: 3, badges: ['FIRST_REPORT'], isCivicAgent: false },
]

async function main() {
  console.log('🌱 Seeding Community Hero database...')

  // 1. Authority contacts
  await db.authorityContact.deleteMany()
  for (const c of AUTHORITY_CONTACTS) {
    await db.authorityContact.create({ data: c })
  }
  console.log(`✓ ${AUTHORITY_CONTACTS.length} authority contacts`)

  // 2. Users
  await db.user.deleteMany()
  const users: { id: string }[] = []
  for (const u of SEED_USERS) {
    const created = await db.user.create({
      data: {
        ...u,
        badges: JSON.stringify(u.badges),
        neighborhood: 'Bengaluru',
        lastActiveAt: new Date(Date.now() - Math.random() * 86400000 * 3),
      },
    })
    users.push(created)
  }
  console.log(`✓ ${users.length} seed users`)

  // 3. Issues
  await db.issue.deleteMany()
  for (let i = 0; i < ISSUES.length; i++) {
    const issue = ISSUES[i]
    const reporter = users[i % users.length]
    const createdAt = new Date(Date.now() - issue.daysAgo * 86400000)
    const created = await db.issue.create({
      data: {
        title: issue.title,
        description: issue.description,
        category: issue.category,
        severity: issue.severity,
        status: issue.status,
        lat: issue.lat,
        lng: issue.lng,
        address: issue.address,
        imageUrl: issue.imageUrl,
        authorityDept: issue.authorityDept,
        reporterId: reporter.id,
        verificationsCount: Math.floor(Math.random() * 15) + 1,
        aiConfidence: 0.85 + Math.random() * 0.13,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + Math.random() * 86400000),
        resolvedAt:
          issue.status === 'SOLVED'
            ? new Date(createdAt.getTime() + 86400000 * (1 + Math.random() * 3))
            : null,
      },
    })

    // Build a status timeline for non-FRESH issues
    if (issue.status !== 'FRESH') {
      const wipUser = users[(i + 2) % users.length]
      await db.issueUpdate.create({
        data: {
          issueId: created.id,
          userId: wipUser.id,
          status: 'WIP',
          comment:
            'On-site inspection done. Team dispatched with materials. ETA: 24 hours.',
          createdAt: new Date(createdAt.getTime() + 86400000 * 0.5),
        },
      })

      if (issue.status === 'SOLVED') {
        const solveUser = users[(i + 4) % users.length]
        await db.issueUpdate.create({
          data: {
            issueId: created.id,
            userId: solveUser.id,
            status: 'SOLVED',
            comment: 'Issue resolved. Site inspected and verified safe for public use.',
            createdAt: new Date(createdAt.getTime() + 86400000 * 2),
          },
        })
      }
    }

    // Add some verifications (community confirmations)
    const verifierCount = Math.min(3, Math.floor(Math.random() * 4))
    for (let v = 0; v < verifierCount; v++) {
      const verifier = users[(i + v + 1) % users.length]
      try {
        await db.verification.create({
          data: {
            issueId: created.id,
            userId: verifier.id,
            createdAt: new Date(createdAt.getTime() + v * 3600000),
          },
        })
      } catch (e) {
        // skip duplicates
      }
    }
  }
  console.log(`✓ ${ISSUES.length} seed issues with timelines`)

  // 4. Welcome alerts for all users
  for (const u of users) {
    await db.alert.create({
      data: {
        userId: u.id,
        type: 'NEW_ISSUE',
        message: 'Welcome to Community Hero! Be the change in your neighborhood.',
        read: false,
      },
    })
  }
  console.log(`✓ Welcome alerts created`)

  console.log('\n🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
