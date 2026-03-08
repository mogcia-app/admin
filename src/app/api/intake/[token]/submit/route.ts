import { randomBytes, randomUUID } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin-server'
import { IntakeSubmissionInput } from '@/lib/intake-types'
import { createSignalInviteLink } from '@/lib/signal-invite-link'

function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function toIsoDate(input: string): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}

function addOneYear(iso: string): string {
  const date = new Date(iso)
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString()
}

function buildRandomPassword(): string {
  const bytes = randomBytes(12).toString('base64url')
  return `Sg!${bytes}9a`
}

function mapPlanToBilling(planTier: string): 'light' | 'standard' | 'professional' {
  if (planTier === 'pro') return 'professional'
  if (planTier === 'standard') return 'standard'
  return 'light'
}

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params
    if (!token) {
      return NextResponse.json({ error: 'token が必要です' }, { status: 400 })
    }

    const body = (await request.json()) as IntakeSubmissionInput

    const contractDate = String(body.contractDate || '').trim()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()

    if (!contractDate || Number.isNaN(new Date(contractDate).getTime())) {
      return NextResponse.json({ error: '契約日を入力してください' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: '名前を入力してください' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: 'メールアドレスを入力してください' }, { status: 400 })
    }

    const docRef = adminFirestore().collection('intakeInvites').doc(token)
    const doc = await docRef.get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 })
    }

    const current = doc.data() as Record<string, unknown>
    const status = String(current.status || 'draft')
    if (status === 'confirmed') {
      return NextResponse.json({ ok: true, alreadyConfirmed: true })
    }

    const expiresAt = current.expiresAt as { toDate?: () => Date } | undefined
    const expiresAtDate = expiresAt?.toDate ? expiresAt.toDate() : null
    if (expiresAtDate && expiresAtDate.getTime() < Date.now()) {
      return NextResponse.json({ error: 'このリンクは有効期限切れです' }, { status: 410 })
    }

    const submission: IntakeSubmissionInput = {
      contractDate,
      name,
      email,
      snsPurpose: String(body.snsPurpose || '').trim(),
      ngWords: String(body.ngWords || '').trim(),
      industry: String(body.industry || '').trim(),
      industryOther: String(body.industryOther || '').trim(),
      companySize: body.companySize || 'small',
      businessType: body.businessType || 'b2c',
      businessDescription: String(body.businessDescription || '').trim(),
      targetMarket: splitLines(String(body.targetMarket || '')).join('\n'),
      catchphrase: String(body.catchphrase || '').trim(),
      initialFollowers: Number(body.initialFollowers || 0),
      products: Array.isArray(body.products)
        ? body.products
            .map((product) => ({
              name: String(product?.name || '').trim(),
              details: String(product?.details || '').trim(),
              price: String(product?.price || '').trim(),
            }))
            .filter((product) => product.name || product.details || product.price)
        : [],
    }

    const planTier = String(current.planTier || 'basic')
    const registeredCompanyId = String(current.registeredCompanyId || '').trim()
    const contractStartDate = toIsoDate(String(submission.contractDate || current.contractStartDate || new Date().toISOString()))
    const contractEndDate = addOneYear(contractStartDate)
    const randomPassword = buildRandomPassword()

    let userRecord
    try {
      userRecord = await adminAuth().getUserByEmail(email)
    } catch {
      userRecord = null
    }

    let uid = ''
    if (userRecord) {
      const existingUserDoc = await adminFirestore().collection('users').doc(userRecord.uid).get()
      const inviteUserId = String(current.userId || '').trim()
      const canRecoverPartialFailure = !existingUserDoc.exists || (inviteUserId && inviteUserId === userRecord.uid)

      if (!canRecoverPartialFailure) {
        return NextResponse.json({ error: '同じメールアドレスのユーザーがすでに存在します' }, { status: 409 })
      }

      await adminAuth().updateUser(userRecord.uid, {
        displayName: name,
        password: randomPassword,
        disabled: false,
      })
      uid = userRecord.uid
    } else {
      const createdUser = await adminAuth().createUser({
        email,
        password: randomPassword,
        displayName: name,
        emailVerified: false,
        disabled: false,
      })
      uid = createdUser.uid
    }

    const createdAtIso = new Date().toISOString()
    const snsPurpose = String(submission.snsPurpose || '').trim()
    const ngWords = String(submission.ngWords || '').trim()
    const industry = String(submission.industry || '').trim()
    const industryOther = String(submission.industryOther || '').trim()
    const industryResolved = industry === 'その他' && industryOther ? industryOther : industry
    const businessDescription = String(submission.businessDescription || '').trim()
    const targetMarket = splitLines(String(submission.targetMarket || ''))
    const catchphrase = String(submission.catchphrase || '').trim()
    const initialFollowers = Number(submission.initialFollowers || 0)

    const products = Array.isArray(submission.products)
      ? submission.products
          .map((product) => ({
            id: randomUUID(),
            name: String(product.name || '').trim(),
            details: String(product.details || '').trim(),
            price: String(product.price || '').trim(),
          }))
          .filter((product) => product.name || product.details || product.price)
      : []

    const userPayload: Record<string, unknown> = {
      id: uid,
      name,
      email,
      role: 'user',
      isActive: true,
      snsCount: 1,
      usageType: 'solo',
      contractType: 'annual',
      contractSNS: ['instagram'],
      snsAISettings: {
        instagram: {
          enabled: true,
          whyThisSNS: snsPurpose,
          snsGoal: snsPurpose,
          contentDirection: '',
          postFrequency: '',
          targetAction: '',
          tone: '',
          focusMetrics: [],
          strategyNotes: ngWords,
          manner: '',
          cautions: ngWords,
          goals: snsPurpose,
          motivation: '',
          additionalInfo: '',
        },
      },
      businessInfo: {
        industry: industryResolved,
        companySize: String(submission.companySize || 'small'),
        businessType: String(submission.businessType || 'b2c'),
        description: businessDescription,
        targetMarket,
        catchphrase,
        initialFollowers,
        productsOrServices: products,
        snsMainGoals: snsPurpose ? [snsPurpose] : [],
        brandMission: '',
        targetCustomer: targetMarket[0] || '',
        uniqueValue: '',
        brandVoice: '',
        kpiTargets: [],
        challenges: [],
        goals: snsPurpose ? [snsPurpose] : [],
      },
      goals: snsPurpose ? [snsPurpose] : [],
      status: 'active',
      contractStartDate,
      contractEndDate,
      planTier,
      billingInfo: {
        plan: mapPlanToBilling(planTier),
        monthlyFee: 0,
        currency: 'JPY',
        paymentMethod: 'invoice',
        nextBillingDate: contractEndDate,
        paymentStatus: 'pending',
      },
      notes: `intake token: ${token}\ncompany: ${String(current.companyName || '')}`,
      supportId: randomUUID(),
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
      ...(registeredCompanyId ? { companyId: registeredCompanyId } : {}),
    }
    await adminFirestore().collection('users').doc(uid).set(userPayload)

    const inviteLink = await createSignalInviteLink({
      userId: uid,
      userEmail: email,
      createdBy: 'intake.form',
      createdByRole: 'system',
      expiresInMinutes: 1440,
    })

    await adminFirestore().collection('users').doc(uid).set(
      {
        signalToolAccessUrl: inviteLink.inviteUrl,
        signalInviteExpiresAt: inviteLink.expiresAt,
        onboardingIntakeToken: token,
        updatedAt: createdAtIso,
      },
      { merge: true }
    )

    await Promise.all([
      docRef.set(
        {
          status: 'confirmed',
          submittedData: submission,
          submittedAt: FieldValue.serverTimestamp(),
          confirmedAt: FieldValue.serverTimestamp(),
          confirmedByUid: 'system:intake',
          confirmedByEmail: 'intake.form',
          userId: uid,
          signalInviteUrl: inviteLink.inviteUrl,
          signalInviteExpiresAt: inviteLink.expiresAt,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
      adminFirestore().collection('auditLogs').add({
        event: 'intake.auto.confirm',
        action: 'intake.auto.confirm',
        tenantType: 'hq',
        actor: {
          uid: 'system:intake',
          email: 'intake.form',
          role: 'system',
        },
        target: {
          type: 'user',
          id: uid,
          name,
        },
        metadata: {
          intakeToken: token,
          email,
          registeredCompanyId: registeredCompanyId || null,
        },
        createdAt: FieldValue.serverTimestamp(),
      }),
    ])

    return NextResponse.json({ ok: true, autoConfirmed: true })
  } catch (error) {
    console.error('[POST /api/intake/:token/submit] error', error)
    const message = error instanceof Error ? error.message : '申込の送信に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
