type CacheEntry = {
  data: unknown
  at: number
  inflight?: Promise<unknown>
}

const memory = new Map<string, CacheEntry>()

const DEFAULT_TTL_MS = 30_000

export function cacheGet<T>(key: string): T | undefined {
  const hit = memory.get(key)
  if (!hit || hit.data === undefined) return undefined
  return hit.data as T
}

export function cacheSet<T>(key: string, data: T) {
  const current = memory.get(key)
  memory.set(key, { data, at: Date.now(), inflight: current?.inflight })
}

export async function cachedQuery<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const hit = memory.get(key)
  if (hit?.data !== undefined && ttlMs > 0 && Date.now() - hit.at < ttlMs) {
    return hit.data as T
  }
  if (hit?.inflight) {
    return hit.inflight as Promise<T>
  }

  const inflight = fn()
    .then((data) => {
      memory.set(key, { data, at: Date.now() })
      return data
    })
    .catch((error) => {
      const current = memory.get(key)
      if (current?.inflight === inflight) {
        memory.set(key, { data: current.data, at: current.at })
      }
      throw error
    })

  memory.set(key, { data: hit?.data, at: hit?.at ?? 0, inflight })
  return inflight as Promise<T>
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    memory.clear()
    return
  }
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key)
  }
}
