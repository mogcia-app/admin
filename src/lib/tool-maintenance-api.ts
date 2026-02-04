import { API_ENDPOINTS, apiGet, apiPost } from './api-config'

export interface ToolMaintenanceStatus {
  enabled: boolean
  message: string
  scheduledStart?: string | null
  scheduledEnd?: string | null
  updatedBy: string
  updatedAt: string | null
}

export interface SetMaintenanceModeRequest {
  enabled: boolean
  message?: string
  scheduledStart?: string
  scheduledEnd?: string
  updatedBy?: string
}

/**
 * Signal.ツール側のメンテナンス状態を取得
 */
export async function getToolMaintenanceStatus(): Promise<ToolMaintenanceStatus> {
  try {
    const response = await apiGet(API_ENDPOINTS.toolMaintenance.getStatus)

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch maintenance status')
    }

    return response.data
  } catch (error) {
    console.error('Error fetching tool maintenance status:', error)
    throw error
  }
}

/**
 * Signal.ツール側のメンテナンスモードを設定
 */
export async function setToolMaintenanceMode(
  request: SetMaintenanceModeRequest
): Promise<ToolMaintenanceStatus> {
  try {
    const response = await apiPost(API_ENDPOINTS.toolMaintenance.setMode, request)

    if (!response.success) {
      throw new Error(response.error || 'Failed to set maintenance mode')
    }

    return response.data
  } catch (error) {
    console.error('Error setting tool maintenance mode:', error)
    throw error
  }
}

