const BASE_URL = '/api'

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
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export default customInstance
