const BASE_URL = ''

export class ApiError extends Error {
  status: number
  errorCode: string | null
  detail: string | null

  constructor(status: number, errorCode: string | null, detail: string | null) {
    super(detail ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
    this.detail = detail
  }
}

export const customInstance = async <T>({
  url,
  method,
  params,
  data,
  headers,
}: {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, string>
  data?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}): Promise<T> => {
  const searchParams = new URLSearchParams(params)
  const queryString = searchParams.toString()
  const fullUrl = `${BASE_URL}${url}${queryString ? `?${queryString}` : ''}`

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  })

  if (!response.ok) {
    let errorCode: string | null = null
    let detail: string | null = null
    try {
      const body = await response.json()
      errorCode = body?.error_code ?? null
      detail = body?.detail ?? null
    } catch {
      // response body was not JSON
    }
    throw new ApiError(response.status, errorCode, detail)
  }

  return response.json() as Promise<T>
}

export default customInstance
