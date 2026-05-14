import { randomBytes, randomUUID } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'
import { createSignalInviteLink } from '@/lib/signal-invite-link'
import { createTermsAgreementLink } from '@/lib/terms-link'

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

function toTargetArray(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
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
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])

    const { token } = await context.params
    if (!token) {
      return NextResponse.json({ error: 'token が必要です' }, { status: 400 })
    }

    const inviteRef = adminFirestore().collection('intakeInvites').doc(token)
    const inviteDoc = await inviteRef.get()

    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'intakeリンクが見つかりません' }, { status: 404 })
    }

    const inviteData = inviteDoc.data() as Record<string, unknown>
    const status = String(inviteData.status || 'draft')
    if (status === 'confirmed') {
      return NextResponse.json({ error: 'すでに確定済みです' }, { status: 409 })
    }
    if (status !== 'submitted') {
      return NextResponse.json({ error: '本人送信が完了していません' }, { status: 400 })
    }

    const submission = (inviteData.submittedData as Record<string, unknown> | undefined) || {}
    const email = String(submission.email || inviteData.email || '').trim().toLowerCase()
    const name = String(submission.name || '').trim()

    if (!email || !name) {
      return NextResponse.json({ error: '送信データの必須項目が不足しています' }, { status: 400 })
    }

    const planTier = String(inviteData.planTier || 'basic')
    const registeredCompanyId = String(inviteData.registeredCompanyId || '').trim()
    const contractStartDate = toIsoDate(String(submission.contractDate || inviteData.contractStartDate || new Date().toISOString()))
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
      const inviteUserId = String(inviteData.userId || '').trim()
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
    const targetMarket = toTargetArray(String(submission.targetMarket || ''))
    const catchphrase = String(submission.catchphrase || '').trim()
    const initialFollowers = Number(submission.initialFollowers || 0)

    const products = Array.isArray(submission.products)
      ? (submission.products as Array<Record<string, unknown>>)
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
      notes: `intake token: ${token}\ncompany: ${String(inviteData.companyName || '')}`,
      supportId: randomUUID(),
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
      ...(registeredCompanyId ? { companyId: registeredCompanyId } : {}),
    }

    await adminFirestore().collection('users').doc(uid).set(userPayload)

    const inviteLink = await createSignalInviteLink({
      userId: uid,
      userEmail: email,
      createdBy: actor.email || actor.uid,
      createdByRole: actor.role,
      expiresInMinutes: 1440,
    })
    const termsLink = await createTermsAgreementLink({
      userId: uid,
      userEmail: email,
      createdBy: actor.email || actor.uid,
      createdByRole: actor.role,
      flowType: 'required',
      expiresInMinutes: 10080,
    })

    await adminFirestore().collection('users').doc(uid).set(
      {
        signalToolAccessUrl: inviteLink.inviteUrl,
        signalInviteExpiresAt: inviteLink.expiresAt,
        onboardingIntakeToken: token,
        salesChannel: 'direct',
        termsFlowType: 'required',
        termsAgreementStatus: 'pending',
        termsVersion: termsLink.version,
        termsAgreementUrl: termsLink.agreementUrl,
        termsAgreementExpiresAt: termsLink.expiresAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    await Promise.all([
      inviteRef.set(
        {
          status: 'confirmed',
          confirmedAt: FieldValue.serverTimestamp(),
          confirmedByUid: actor.uid,
          confirmedByEmail: actor.email,
          userId: uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
      adminFirestore().collection('auditLogs').add({
        event: 'admin.intake.confirm',
        action: 'admin.intake.confirm',
        tenantType: 'hq',
        actor: {
          uid: actor.uid,
          email: actor.email,
          role: actor.role,
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

    return NextResponse.json({
      ok: true,
      uid,
      email,
      signalInviteUrl: inviteLink.inviteUrl,
      signalInviteExpiresAt: inviteLink.expiresAt,
      termsAgreementUrl: termsLink.agreementUrl,
      termsAgreementExpiresAt: termsLink.expiresAt,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    console.error('[POST /api/admin/intake-links/:token/confirm] error', error)
    const message = error instanceof Error ? error.message : '確定処理に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
