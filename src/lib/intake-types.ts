export type IntakeStatus = 'draft' | 'submitted' | 'confirmed' | 'expired'

export interface IntakeProductInput {
  name: string
  details: string
  price: string
}

export interface IntakeSubmissionInput {
  contractDate: string
  name: string
  email: string
  snsPurpose: string
  ngWords: string
  industry: string
  industryOther?: string
  companySize: 'individual' | 'small' | 'medium' | 'large'
  businessType: 'b2c' | 'b2b' | 'both'
  businessDescription: string
  targetMarket: string
  catchphrase: string
  initialFollowers: number
  products: IntakeProductInput[]
}

export interface IntakeInviteDoc {
  token: string
  status: IntakeStatus
  companyName: string
  registeredCompanyId?: string
  registeredCompanyName?: string
  contractStartDate: string
  planTier: 'basic' | 'standard' | 'pro'
  email: string
  createdByUid: string
  createdByEmail: string
  expiresAt: unknown
  submittedData?: IntakeSubmissionInput
  submittedAt?: unknown
  confirmedAt?: unknown
  confirmedByUid?: string
  confirmedByEmail?: string
  userId?: string
  createdAt?: unknown
  updatedAt?: unknown
}
