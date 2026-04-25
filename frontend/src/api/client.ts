const BASE_URL = ''

export interface ApiError {
  status: number
  error_code?: string
  detail?: string
}

export class ApiRequestError extends Error {
  status: number
  error_code?: string
  detail?: string

  constructor(resp: ApiError) {
    super(resp.detail ?? `HTTP ${resp.status}`)
    this.status = resp.status
    this.error_code = resp.error_code
    this.detail = resp.detail
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
    let body: Record<string, unknown> = {}
    try {
      body = await response.json()
    } catch {
      // response wasn't JSON
    }
    throw new ApiRequestError({
      status: response.status,
      error_code: body.error_code as string | undefined,
      detail: body.detail as string | undefined,
    })
  }

  return response.json() as Promise<T>
}

export default customInstance
