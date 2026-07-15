import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from './ToastContext'

export const CollaborationContext = createContext(null)

const CHANNEL_PREFIX = 'workspace:'

// Module-level cooldown: StrictMode double-mount causes join→leave→join dalam ms.
// Debounce leave toast 5s — mencover reconnect window (koneksi putus lalu join lagi).
// Kalau user rejoin dalam window itu, cancel leave toast + skip join toast (reconnect).
// Join cooldown 2s: skip toast kalau user baru aja di-toast "joined" (genuine join flood guard).
const leaveToastCooldowns = new Map()
const recentJoinToastTimestamps = new Map()

export function CollaborationProvider({ workspaceId, user, children, itemUpdateHandlerRef, itemAddHandlerRef, itemRemoveHandlerRef, reorderHandlerRef, workspaceUpdateHandlerRef, collaboratorsGuardRef, bezierStateHandlerRef }) {
  const [collaborators, setCollaborators] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [collaboratorSelections, setCollaboratorSelections] = useState({})
  const channelRef = useRef(null)
  const cursorPositionsRef = useRef({})
  const { addToast } = useToast()
  // Track previous presence state from sync events to detect genuine joins/leaves.
  // Sync fires the full presence state (ground truth).
  // Join/leave events can include stale data after reconnection.
  const prevSyncStateRef = useRef([])
  // Reconnection key: increment on ERROR (not CLOSED from cleanup) to trigger
  // effect cleanup + resubscribe with exponential backoff
  const [reconnectKey, setReconnectKey] = useState(0)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)
  const sustainedTimeoutRef = useRef(null)
  const isUnmountingRef = useRef(false)
  const MAX_RECONNECT_ATTEMPTS = 10
  const RECONNECT_BASE_MS = 1000
  const RECONNECT_MAX_MS = 30000
  const SUSTAINED_CONNECTION_MS = 30000

  const getChannelName = useCallback((id) => {
    if (!id) return null
    return `${CHANNEL_PREFIX}${id}`
  }, [])

  useEffect(() => {
    if (!workspaceId || !user) return

    const channelName = getChannelName(workspaceId)
    if (!channelName) return

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: true },
        presence: { key: user.id },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const list = Object.values(state).flatMap((entry) => entry)
        const prev = prevSyncStateRef.current
        const prevIds = new Set(prev.map((c) => c.userId))
        const newIds = new Set(list.map((c) => c.userId))

        // Genuinely new users since last sync (handles reconnection where
        // join events fire for all existing presences, not just deltas)
        const joined = list.filter((c) => !prevIds.has(c.userId))
        // Users who genuinely left since last sync
        const left = prev.filter((c) => !newIds.has(c.userId))

        // Join toasts (only for genuinely new users)
        joined.forEach((p) => {
          if (p.userId === user.id) return
          // If user has a pending leave timeout (5s window), this is a
          // reconnect — cancel the leave toast AND suppress the join toast
          if (leaveToastCooldowns.has(p.userId)) {
            clearTimeout(leaveToastCooldowns.get(p.userId))
            leaveToastCooldowns.delete(p.userId)
            return
          }
          const now = Date.now()
          const lastToast = recentJoinToastTimestamps.get(p.userId) || 0
          if (now - lastToast > 2000) {
            recentJoinToastTimestamps.set(p.userId, now)
            addToast(`${p.displayName || p.username} joined the canvas`, { duration: 3000 })
          }
        })

        // Leave toasts (only for genuinely departed users)
        // 5s grace period: if user rejoins within 5s, cancel leave toast
        // AND join toast (both suppressed — it's just a reconnect cycle)
        left.forEach((p) => {
          if (leaveToastCooldowns.has(p.userId)) {
            clearTimeout(leaveToastCooldowns.get(p.userId))
          }
          leaveToastCooldowns.set(p.userId, setTimeout(() => {
            leaveToastCooldowns.delete(p.userId)
            addToast(`${p.displayName || p.username} left the canvas`, { duration: 3000 })
          }, 5000))
          delete cursorPositionsRef.current[p.userId]
        })

        prevSyncStateRef.current = list
        // Deduplicate: Supabase Realtime can return duplicate presence
        // entries for the same userId during reconnect cycles
        const seen = new Set()
        const deduped = list.filter((c) => {
          if (seen.has(c.userId)) return false
          seen.add(c.userId)
          return true
        })
        setCollaborators(deduped)
      })
      // Join/leave handlers: update state only (toasts handled by sync diffing
      // above, because Supabase join/leave events can include stale presences
      // after reconnection)
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setCollaborators((prev) => {
          const ids = new Set(prev.map((c) => c.userId))
          const toAdd = newPresences.filter((p) => !ids.has(p.userId))
          if (toAdd.length === 0) return prev
          // Deduplicate join payload itself (can contain same userId twice)
          const seen = new Set()
          const deduped = toAdd.filter((p) => {
            if (seen.has(p.userId)) return false
            seen.add(p.userId)
            return true
          })
          return [...prev, ...deduped]
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = new Set(leftPresences.map((p) => p.userId))
        leftPresences.forEach((p) => {
          delete cursorPositionsRef.current[p.userId]
        })
        setCollaborators((prev) => prev.filter((c) => !leftIds.has(c.userId)))
        setCollaboratorSelections((prev) => {
          const next = { ...prev }
          leftIds.forEach((id) => delete next[id])
          return next
        })
      })
      .on('broadcast', { event: 'cursor_move' }, (payload) => {
        // supabase-js v2 broadcast callback may wrap payload in { payload: ... }
        const data = payload.payload || payload
        if (data.userId === user.id) return
        // Stale cursor_move can arrive after user already left (Realtime
        // message ordering race). Skip if user is no longer a collaborator.
        if (!collaboratorsRef.current.some((c) => c.userId === data.userId)) return
        cursorPositionsRef.current[data.userId] = {
          x: data.x,
          y: data.y,
          username: data.username,
          displayName: data.displayName,
          lastSeen: Date.now(),
        }
      })
      .on('broadcast', { event: 'cursor_leave' }, (payload) => {
        const data = payload.payload || payload
        delete cursorPositionsRef.current[data.userId]
      })
      .on('broadcast', { event: 'selection_change' }, (payload) => {
        const data = payload.payload || payload
        if (data.userId === user.id) return
        setCollaboratorSelections((prev) => ({
          ...prev,
          [data.userId]: {
            selectedIds: data.selectedIds || [],
            displayName: data.displayName,
            username: data.username,
          },
        }))
      })
      .on('broadcast', { event: 'item_update' }, (payload) => {
        const data = payload.payload || payload
        if (data.userId === user.id) return
        itemUpdateHandlerRef?.current?.(data.itemId, data.patch)
      })
      .on('broadcast', { event: 'item_added' }, (payload) => {
        const data = payload.payload || payload
        if (data.userId === user.id) return
        itemAddHandlerRef?.current?.(data.item)
      })
      .on('broadcast', { event: 'item_removed' }, (payload) => {
        const data = payload.payload || payload
        if (data.userId === user.id) return
        itemRemoveHandlerRef?.current?.(data.itemId)
      })
      .on('broadcast', { event: 'layer_reorder' }, (payload) => {
        const data = payload.payload || payload
        if (data.userId === user.id) return
        reorderHandlerRef?.current?.(data.itemId, data.direction, data.activeIds)
      })
      .on('broadcast', { event: 'workspace_update' }, (payload) => {
        const data = payload.payload || payload
        if (data.userId === user.id) return
        workspaceUpdateHandlerRef?.current?.(data.patch)
      })
      .on('broadcast', { event: 'bezier_state' }, (payload) => {
        const data = payload.payload || payload
        if (data.userId === user.id) return
        bezierStateHandlerRef?.current?.(data)
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          await channel.track({
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.profile?.avatarUrl || null,
            onlineAt: new Date().toISOString(),
          })
          // Reset reconnect counter after sustained stable connection
          if (sustainedTimeoutRef.current) clearTimeout(sustainedTimeoutRef.current)
          sustainedTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current = 0
            sustainedTimeoutRef.current = null
            console.log('[COLLAB_SUB] Connection stable >30s, reconnect counter reset')
          }, SUSTAINED_CONNECTION_MS)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Ignore CLOSED triggered by our own cleanup (unsubscribe during effect unmount)
          if (isUnmountingRef.current) return
          // Ignore CHANNEL_ERROR that arrives after we've already scheduled a reconnect
          if (reconnectTimeoutRef.current) return
          setIsConnected(false)
          if (sustainedTimeoutRef.current) {
            clearTimeout(sustainedTimeoutRef.current)
            sustainedTimeoutRef.current = null
          }
          const attempts = reconnectAttemptsRef.current
          if (attempts >= MAX_RECONNECT_ATTEMPTS) {
            console.warn('[COLLAB] Gagal terhubung setelah ' + MAX_RECONNECT_ATTEMPTS + ' percobaan berturut-turut. Refresh halaman untuk mencoba lagi.')
            return
          }
          const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, attempts), RECONNECT_MAX_MS)
          reconnectAttemptsRef.current = attempts + 1
          console.warn('[COLLAB] Koneksi terputus (' + status + '). Reconnect dalam ' + Math.round(delay / 1000) + 's... (percobaan ke-' + (attempts + 1) + ')')
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null
            setReconnectKey((k) => k + 1)
          }, delay)
        }
      })

    channelRef.current = channel

    return () => {
      isUnmountingRef.current = true
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (sustainedTimeoutRef.current) {
        clearTimeout(sustainedTimeoutRef.current)
        sustainedTimeoutRef.current = null
      }
      setIsConnected(false)
      setCollaborators([])
      prevSyncStateRef.current = []
      channel.unsubscribe()
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [workspaceId, user?.id, getChannelName, user, reconnectKey])

  useEffect(() => {
    if (!workspaceId || !user) return

    const handleBeforeUnload = () => {
      const ch = channelRef.current
      if (ch) {
        ch.unsubscribe()
        supabase.removeChannel(ch)
        channelRef.current = null
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [workspaceId, user])

  const collaboratorsRef = useRef([])
  collaboratorsRef.current = collaborators
  if (collaboratorsGuardRef) collaboratorsGuardRef.current = collaborators
  const broadcast = useCallback((type, payload, { throttle } = {}) => {
    if (collaboratorsRef.current.length <= 1) return
    const ch = channelRef.current
    if (!ch) return
    ch.send({
      type: 'broadcast',
      event: type,
      payload,
    }).catch((err) => {
      console.error('[CURSOR] broadcast send error:', err)
    })
  }, [])

  const value = {
    collaborators,
    isConnected,
    collaboratorCount: collaborators.length,
    broadcast,
    cursorPositionsRef,
    currentUserId: user?.id,
    collaboratorSelections,
  }

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  )
}
