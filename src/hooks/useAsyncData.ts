import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import { cacheGet, cacheSet } from '../lib/queryCache'

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options?: { minDelay?: number; cacheKey?: string },
) {
  const location = useLocation()
  const fetcherId = fetcher.name || String(fetcher).slice(0, 48).replace(/[^a-zA-Z0-9]/g, '_')
  const cacheKey = options?.cacheKey ?? `view:${location.pathname}:${fetcherId}:${JSON.stringify(deps)}`
  const cached = cacheGet<T>(cacheKey)

  const [data, setDataState] = useState<T | null>(cached ?? null)
  const [loading, setLoading] = useState(cached == null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  const setData = useCallback((value: T | null | ((prev: T | null) => T | null)) => {
    setDataState((prev) => {
      const next = typeof value === 'function'
        ? (value as (prevState: T | null) => T | null)(prev)
        : value
      if (next != null) cacheSet(cacheKey, next)
      return next
    })
  }, [cacheKey])

  useEffect(() => {
    let cancelled = false
    const existing = cacheGet<T>(cacheKey)
    if (existing != null) {
      setDataState(existing)
      setLoading(false)
    } else {
      setLoading(true)
    }
    setError(null)

    const run = async () => {
      try {
        const result = await fetcher()
        const delay = existing == null ? (options?.minDelay ?? 0) : 0
        if (delay > 0) await new Promise((r) => setTimeout(r, delay))
        cacheSet(cacheKey, result)
        if (!cancelled) {
          setDataState(result)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled && existing == null) {
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
  }, [...deps, version, cacheKey])

  return { data, loading, error, setData, refetch }
}
