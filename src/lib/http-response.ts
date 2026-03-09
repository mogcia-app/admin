export async function parseJsonResponse<T = Record<string, unknown>>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const bodyText = await response.text()

  if (!bodyText) {
    return {} as T
  }

  try {
    return JSON.parse(bodyText) as T
  } catch {
    const snippet = bodyText.slice(0, 160).replace(/\s+/g, ' ').trim()
    const location = response.url || 'unknown URL'
    const typeInfo = contentType || 'unknown content-type'

    throw new Error(
      `Expected JSON but received ${typeInfo} from ${location} (status ${response.status}). Response starts with: ${snippet}`
    )
  }
}

export function getErrorMessage(payload: Record<string, unknown>, fallback: string): string {
  const message = payload.error
  return typeof message === 'string' && message.length > 0 ? message : fallback
}
