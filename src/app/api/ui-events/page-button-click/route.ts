import { NextRequest, NextResponse } from 'next/server'
import { writeUiEventLog } from '@/lib/ui-event-server'
import { UI_EVENT_TYPE } from '@/lib/ui-event-types'

export async function POST(request: NextRequest) {
  try {
    await writeUiEventLog(request, UI_EVENT_TYPE.PAGE_BUTTON_CLICK)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('必須')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error('[POST /api/ui-events/page-button-click] error', error)
    return NextResponse.json({ error: 'ページ内ボタン押下の記録に失敗しました' }, { status: 500 })
  }
}
