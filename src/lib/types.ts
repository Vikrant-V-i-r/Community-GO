// Shared types for Community Hero

export type IssueStatus = 'FRESH' | 'WIP' | 'SOLVED'
export type IssueCategory =
  | 'POTHOLE'
  | 'WATER_LEAK'
  | 'STREETLIGHT'
  | 'GARBAGE'
  | 'ROAD_DAMAGE'
  | 'DRAINAGE'
  | 'OTHER'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AuthorityDept =
  | 'BBMP' | 'TRAFFIC' | 'WATER_BOARD' | 'ELECTRICITY' | 'FIRE' | 'POLICE'

export interface User {
  id: string
  handle: string
  avatar: string
  coins: number
  xp: number
  level: number
  badges: string[]
  isCivicAgent: boolean
  neighborhood: string
  bio?: string
}

export interface Issue {
  id: string
  title: string
  description: string
  category: IssueCategory
  severity: Severity
  status: IssueStatus
  lat: number
  lng: number
  address: string
  imageUrl: string
  aiConfidence: number
  authorityDept: AuthorityDept
  reporterId: string
  reporter?: { id: string; handle: string; avatar: string }
  verificationsCount: number
  _count?: { verifications: number; updates: number }
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export interface IssueUpdate {
  id: string
  issueId: string
  userId: string
  user: { id: string; handle: string; avatar: string }
  status: IssueStatus
  comment: string
  imageUrl?: string | null
  createdAt: string
}

export interface IssueDetail extends Issue {
  updates: IssueUpdate[]
  verifications: { id: string; user: { id: string; handle: string; avatar: string }; createdAt: string }[]
}

export interface Alert {
  id: string
  type: string
  message: string
  issueId: string | null
  issue?: { id: string; title: string; status: string; category: string; imageUrl: string } | null
  read: boolean
  createdAt: string
}

export interface AuthorityContact {
  id: string
  name: string
  dept: string
  phone: string
  email: string
  area: string
  icon: string
}
