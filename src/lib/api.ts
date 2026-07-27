export interface PaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export async function fetchPaginated<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<PaginatedResponse<T>> {
  const url = new URL(endpoint, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value)
    }
  }
  const res = await fetch(url.toString())
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  if (!text.trim()) {
    throw new Error('Respuesta vacía del servidor')
  }
  return JSON.parse(text) as PaginatedResponse<T>
}
