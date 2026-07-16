import { Bell, Clock, Hash, LogOut, Menu, Settings, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/authState'
import { getSearchHistory, getSearchSuggestions, recordSearchHistory } from '../lib/api/search'
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from '../lib/api/notifications'
import SettingsModal from './SettingsModal'

const searchHistoryKey = 'moodspace_search_history'

const readSearchHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(searchHistoryKey) || '[]').filter(Boolean).slice(0, 6)
  } catch {
    return []
  }
}

const writeSearchHistory = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return
  const next = [trimmed, ...readSearchHistory().filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6)
  localStorage.setItem(searchHistoryKey, JSON.stringify(next))
}

const notificationLabels = {
  like: 'menyukai post Anda',
  save: 'menyimpan post Anda',
  comment: 'mengomentari post Anda',
  follow: 'mengikuti Anda',
  report_warning: 'Postingan Anda mendapat peringatan',
  post_deleted: 'Postingan Anda dihapus karena melanggar aturan',
  workspace_invite: 'mengundang Anda ke workspace',
}

function HeaderInner({ isSettingsOpen, setIsSettingsOpen, onToggleSidebar }) {
  const { user, isLoading, openLogin, openRegister, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [history, setHistory] = useState(() => (user ? [] : readSearchHistory()))
  const [suggestions, setSuggestions] = useState([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const searchRef = useRef(null)
  const [notifCount, setNotifCount] = useState(0)
  const [notifItems, setNotifItems] = useState([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const data = await getUnreadCount()
      setNotifCount(data.total || 0)
    } catch {}
  }, [user])

  useEffect(() => { fetchUnreadCount() }, [fetchUnreadCount])

  useEffect(() => {
    if (!user) return undefined
    const interval = window.setInterval(fetchUnreadCount, 30000)
    return () => window.clearInterval(interval)
  }, [user, fetchUnreadCount])

  useEffect(() => {
    if (!isNotifOpen) return undefined
    const handlePointerDown = (event) => {
      if (notifRef.current?.contains(event.target)) return
      setIsNotifOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isNotifOpen])

  const openNotif = async () => {
    setIsNotifOpen(true)
    try {
      const data = await getNotifications({ pageSize: 20 })
      setNotifItems(data.items || [])
    } catch {}
  }

  const handleNotifClick = async (item) => {
    if (!item.readAt) {
      await markAsRead(item.id).catch(() => {})
      setNotifCount((c) => Math.max(0, c - 1))
    }
    setIsNotifOpen(false)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead().catch(() => {})
    setNotifCount(0)
  }

  useEffect(() => {
    if (location.pathname === '/search') setQuery(searchParams.get('q') || '')
  }, [location.pathname, searchParams])

  useEffect(() => {
    if (!user) {
      setHistory(readSearchHistory())
      return
    }
    setHistory([])
    getSearchHistory({ limit: 6 })
      .then((payload) => setHistory((payload.items || []).map((item) => item.query).filter(Boolean)))
      .catch(() => setHistory([]))
  }, [user])

  useEffect(() => {
    if (!isSearchOpen && !isSearchExpanded) return undefined
    const handlePointerDown = (event) => {
      if (searchRef.current?.contains(event.target)) return
      setIsSearchOpen(false)
      setIsSearchExpanded(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isSearchOpen, isSearchExpanded])

  useEffect(() => {
    const trimmed = query.trim()
    if (!isSearchOpen || !trimmed) {
      setSuggestions([])
      return undefined
    }
    const timer = window.setTimeout(() => {
      getSearchSuggestions({ q: trimmed, limit: 8 })
        .then((payload) => setSuggestions(payload.items || []))
        .catch(() => setSuggestions([]))
    }, 180)
    return () => window.clearTimeout(timer)
  }, [isSearchOpen, query])

  const runSearch = (value) => {
    const trimmed = value.trim()
    if (!trimmed) {
      navigate('/feed')
      setIsSearchOpen(false)
      return
    }
    if (user) {
      recordSearchHistory(trimmed).catch(() => {})
    } else {
      writeSearchHistory(trimmed)
    }
    setHistory((current) => [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6))
    setQuery(trimmed)
    setIsSearchOpen(false)
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const runTagSearch = (value) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setQuery(trimmed)
    setIsSearchOpen(false)
    navigate(`/search?tags=${encodeURIComponent(trimmed)}`)
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    runSearch(query)
  }

  const handleClearSearch = () => {
    setQuery('')
    setSuggestions([])
    setIsSearchOpen(false)
    setIsSearchExpanded(false)
    navigate('/feed')
  }

  const visibleHistory = history.filter((item) => (
    !query.trim() || item.toLowerCase().includes(query.trim().toLowerCase())
  )).slice(0, 4)
  const shouldShowDropdown = isSearchOpen && (visibleHistory.length > 0 || suggestions.length > 0)

  return (
    <header className="layout-header">
      <div className="header-bar">
        <button className="icon-btn hamburger-btn" type="button" aria-label="Menu" onClick={onToggleSidebar}>
          <Menu size={18} strokeWidth={1.6} />
        </button>
        <form className={`search${isSearchExpanded ? ' expanded' : ''}`} onSubmit={handleSearchSubmit} ref={searchRef}>
          <button type="button" className="search-expand-trigger" aria-label="Toggle search" onClick={() => setIsSearchExpanded(true)}>
            <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M16.5 16.5 21 21"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Search inspiration, artists, or boards..."
            aria-label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (user) {
                getSearchHistory({ limit: 6 })
                  .then((payload) => setHistory((payload.items || []).map((item) => item.query).filter(Boolean)))
                  .catch(() => setHistory([]))
              } else {
                setHistory(readSearchHistory())
              }
              setIsSearchOpen(true)
            }}
          />
          {query && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={handleClearSearch}>
              <X size={15} />
            </button>
          )}
          {shouldShowDropdown && (
            <div className="search-suggestions">
              {visibleHistory.length > 0 && (
                <div className="search-suggestion-group">
                  <span className="search-suggestion-label">Recent</span>
                  {visibleHistory.map((item) => (
                    <button type="button" className="search-suggestion-item" onClick={() => runSearch(item)} key={`history-${item}`}>
                      <Clock size={14} />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="search-suggestion-group">
                  <span className="search-suggestion-label">Suggestions</span>
                  {suggestions.map((item) => (
                    <button
                      type="button"
                      className="search-suggestion-item"
                      onClick={() => item.type === 'tag' ? runTagSearch(item.value) : runSearch(item.value)}
                      key={`${item.type}-${item.value}`}
                    >
                      {item.type === 'tag' ? <Hash size={14} /> : <svg className="search-suggestion-dot" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="3" /></svg>}
                      <span>{item.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
        <div className="top-actions" ref={notifRef}>
          {user && (
            <>
              <button className="icon-btn notif-btn" type="button" aria-label="Notifications" onClick={openNotif}>
                <Bell size={18} strokeWidth={1.6} />
                {notifCount > 0 && <span className="notif-badge">{notifCount > 99 ? '99+' : notifCount}</span>}
              </button>
              {isNotifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <span>Notifications</span>
                    {notifCount > 0 && (
                      <button type="button" className="notif-mark-all" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-dropdown-list">
                    {notifItems.length === 0 ? (
                      <p className="notif-empty">Tidak ada notifikasi.</p>
                    ) : (
                      notifItems.map((item) => (
                        <Link
                          key={item.id}
                          to={item.targetType === 'post' ? `/post/${item.targetId}` : item.targetType === 'workspace' ? `/workspace?projectId=${item.targetId}` : '#'}
                          className={`notif-item ${!item.readAt ? 'unread' : ''}`}
                          onClick={() => handleNotifClick(item)}
                        >
                          <div className="notif-item-content">
                            <span className="notif-item-text">
                              {item.actorDisplayName && <strong>{item.actorDisplayName}</strong>}
                              {' '}{notificationLabels[item.type] || item.type}
                              {item.metadata?.postTitle && (
                                <>: <em>"{item.metadata.postTitle}"</em></>
                              )}
                            </span>
                            <span className="notif-item-time">
                              {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
              <button className="icon-btn settings-btn" type="button" aria-label="Settings" onClick={() => setIsSettingsOpen(true)}>
                <Settings size={18} strokeWidth={1.6} />
              </button>
            </>
          )}
          {user ? (
            <div className="header-auth-user">
              <div className="header-user-profile" onClick={() => navigate('/profile')} role="button" tabIndex={0}>
                <div className="header-user-avatar" style={user.profile?.avatarUrl ? { backgroundImage: `url("${user.profile.avatarUrl}")` } : undefined}>
                {!user.profile?.avatarUrl && <span className="avatar-initial" style={{ fontSize: '12px' }}>{(user.displayName || user.username || '?')[0].toUpperCase()}</span>}
              </div>
                <span className="header-auth-username">@{user.username}</span>
              </div>
              <button type="button" className="header-logout-btn" onClick={logout}>
                <LogOut size={16} className="header-logout-icon" />
                <span className="header-logout-label">Logout</span>
              </button>
            </div>
          ) : (
            <div className="header-auth-actions">
              <button type="button" onClick={openLogin} disabled={isLoading}>Login</button>
              <button type="button" onClick={openRegister} disabled={isLoading}>Register</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default function HeaderWithModal({ onToggleSidebar }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  return (
    <>
      <HeaderInner isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} onToggleSidebar={onToggleSidebar} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  )
}
