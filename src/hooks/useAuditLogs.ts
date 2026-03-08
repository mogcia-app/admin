'use client'

import { useEffect, useState } from 'react'
import { AuditLog } from '@/types'
import { getAuditLogs } from '@/lib/audit-logs'

export function useAuditLogs(agencyId?: string) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAuditLogs({ agencyId, max: 300 })
      setLogs(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '監査ログの取得に失敗しました'
      setError(errorMessage)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId])

  return {
    logs,
    loading,
    error,
    refreshLogs: fetchLogs,
  }
}
