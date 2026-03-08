import { NextResponse } from 'next/server'
import { getPublicFeatureFlags } from '@/lib/server/feature-flags'
import { toIso } from '@/lib/server/maintenance-admin'

export async function GET() {
  try {
    const flags = await getPublicFeatureFlags()

    return NextResponse.json({
      success: true,
      data: {
        enabled: flags.enabled,
        loginBlocked: flags.loginBlocked,
        allowPasswordReset: flags.allowPasswordReset,
        sessionPolicy: flags.sessionPolicy,
        featureFlags: flags.featureFlags,
        version: flags.version,
        updatedAt: toIso(flags.updatedAt),
      },
    })
  } catch (error) {
    console.error('[GET /api/feature-flags] error', error)
    return NextResponse.json({ error: 'feature flags の取得に失敗しました' }, { status: 500 })
  }
}
