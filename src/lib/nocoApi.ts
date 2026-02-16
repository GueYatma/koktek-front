export type NocoListResponse<T> = {
  list: T[]
  pageInfo?: unknown
}

const getEnv = () => {
  const baseUrl = import.meta.env.VITE_API_URL as string | undefined
  const token = import.meta.env.VITE_API_TOKEN as string | undefined
  const projectName = import.meta.env.VITE_PROJECT_NAME as string | undefined

  return { baseUrl, token, projectName }
}

type FetchTableOptions = {
  limit?: number
  where?: string
  params?: Record<string, string>
}

export const fetchTableRaw = async <T>(
  tableName: string,
  options: FetchTableOptions = {},
): Promise<NocoListResponse<T>> => {
  const { baseUrl, token, projectName } = getEnv()

  if (!baseUrl || !projectName) {
    console.warn('NocoDB env manquant: VITE_API_URL ou VITE_PROJECT_NAME')
    return { list: [] }
  }

  const endpoint = new URL(
    `/api/v1/db/data/v1/${projectName}/${tableName}`,
    baseUrl,
  )
  const limit = options.limit ?? 1000
  endpoint.searchParams.set('limit', String(limit))
  if (options.where) {
    endpoint.searchParams.set('where', options.where)
  }
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      endpoint.searchParams.set(key, value)
    })
  }

  const response = await fetch(endpoint.toString(), {
    headers: {
      'xc-token': token ?? '',
    },
  })

  if (!response.ok) {
    throw new Error(`NocoDB ${tableName} error: ${response.status}`)
  }

  const data = (await response.json()) as NocoListResponse<T>
  return data
}

export const fetchTable = async <T>(
  tableName: string,
  options?: FetchTableOptions,
): Promise<T[]> => {
  const data = await fetchTableRaw<T>(tableName, options)
  return Array.isArray(data.list) ? data.list : []
}
