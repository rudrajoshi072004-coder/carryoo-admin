import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../api/client'

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options?: { minDelay?: number },
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const run = async () => {
      try {
        const result = await fetcher()
        const delay = options?.minDelay ?? 0
        if (delay > 0) await new Promise((r) => setTimeout(r, delay))
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err))
          setLoading(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { data, loading, error, setData, refetch }
}
