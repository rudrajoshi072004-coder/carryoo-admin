import { useEffect, useState } from 'react'
import { Button, StatusPill } from './ui'
import {
  blockPortalUser,
  fetchPortalUserBlockStatus,
  unblockPortalUser,
  type PortalBlockEvent,
} from '../api/services/portal'

export function UserBlockPanel({
  userId,
  onChanged,
}: {
  userId: string
  onChanged?: (blocked: boolean, reason: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [currentReason, setCurrentReason] = useState('')
  const [history, setHistory] = useState<PortalBlockEvent[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchPortalUserBlockStatus(userId)
      .then((status) => {
        if (cancelled) return
        setBlocked(Boolean(status.is_blocked))
        setCurrentReason(status.block_reason || '')
        setHistory(status.history ?? [])
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load block status.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  async function submit(action: 'block' | 'unblock') {
    const text = reason.trim()
    if (!text) {
      setError('A reason is required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const status = action === 'block' ? await blockPortalUser(userId, text) : await unblockPortalUser(userId, text)
      setBlocked(Boolean(status.is_blocked))
      setCurrentReason(status.block_reason || '')
      setReason('')
      const fresh = await fetchPortalUserBlockStatus(userId)
      setHistory(fresh.history ?? [])
      onChanged?.(Boolean(status.is_blocked), status.block_reason || '')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update this account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={{ margin: '0 0 16px', padding: '12px 14px', border: '1px solid var(--cy-border, #e6e8ee)', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Account block</h3>
        {loading ? null : <StatusPill status={blocked ? 'Blocked' : 'Active'} tone={blocked ? 'cancelled' : 'completed'} />}
      </div>
      {loading ? <p style={{ margin: '10px 0 0', fontSize: 13 }}>Loading block status…</p> : null}
      {!loading && blocked ? (
        <p style={{ margin: '10px 0 0', fontSize: 13 }}>
          Reason: {currentReason || '—'}
        </p>
      ) : null}
      <label style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
        Reason
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          placeholder={blocked ? 'Why is this account being unblocked?' : 'Why is this account being blocked?'}
          style={{ display: 'block', width: '100%', marginTop: 6, boxSizing: 'border-box' }}
        />
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {blocked ? (
          <Button variant="primary" disabled={busy || loading} onClick={() => void submit('unblock')}>
            {busy ? 'Saving…' : 'Unblock'}
          </Button>
        ) : (
          <Button variant="primary" disabled={busy || loading} onClick={() => void submit('block')}>
            {busy ? 'Saving…' : 'Block user'}
          </Button>
        )}
      </div>
      {error ? <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--cy-danger, #b42318)' }}>{error}</p> : null}
      {history.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <strong style={{ fontSize: 12 }}>Blocking history</strong>
          <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', fontSize: 12 }}>
            {history.map((event) => (
              <li key={event.id} style={{ padding: '6px 0', borderTop: '1px solid var(--cy-border, #e6e8ee)' }}>
                {event.action} · {event.reason} · {event.actor_phone || 'admin'} · {event.created_at || ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
