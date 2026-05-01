'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Feed } from '@/lib/supabase'

type Theme = 'dark' | 'light'

const T = {
  dark: {
    bg: '#07070f', card: '#0d0d1a', sidebar: '#06060e', hover: '#12121f',
    border: '#1a1a2e', borderHover: '#2a2a4e', colHeader: '#08081a',
    text: '#c8c8e8', textSub: '#5a5a7a', textDim: '#2e2e4e',
    nav: '#06060e', badge: '#10102a', badgeText: '#5050a0',
  },
  light: {
    bg: '#f0f2f8', card: '#ffffff', sidebar: '#ffffff', hover: '#f5f6fc',
    border: '#e2e4f0', borderHover: '#c0c4e0', colHeader: '#f8f9fd',
    text: '#1a1a2e', textSub: '#7070a0', textDim: '#b0b4d0',
    nav: '#ffffff', badge: '#eef0fa', badgeText: '#6060a0',
  }
}

const NAV_ITEMS = [
  { id: 'all',          label: 'Intel Stream',   icon: '◈', sub: 'All Categories',    filterCat: 'all',          filterType: 'all'      },
  { id: 'naval',        label: 'Naval',          icon: '⚓', sub: 'Maritime Ops',      filterCat: 'naval',        filterType: 'all'      },
  { id: 'air',          label: 'Air Power',      icon: '✈', sub: 'Aerospace',         filterCat: 'air',          filterType: 'all'      },
  { id: 'land',         label: 'Land',           icon: '⚔', sub: 'Ground Forces',     filterCat: 'land',         filterType: 'all'      },
  { id: 'geopolitical', label: 'Geopolitical',   icon: '🌐', sub: 'Diplomacy & Intel', filterCat: 'geopolitical', filterType: 'all'      },
  { id: 'official',     label: 'MoD & Official', icon: '🏛', sub: 'Gov Press Release', filterCat: 'all',          filterType: 'official' },
]

const COLS = [
  { key: 'naval',        label: 'Naval & Maritime', icon: '⚓', color: '#0ea5e9', grad: 'linear-gradient(135deg,#070d14,#0a1a28,#0d2a40)' },
  { key: 'air',          label: 'Air Power',        icon: '✈', color: '#8b5cf6', grad: 'linear-gradient(135deg,#0a070f,#140e20,#1e1232)' },
  { key: 'land',         label: 'Land Forces',      icon: '⚔', color: '#22c55e', grad: 'linear-gradient(135deg,#070e09,#0a1a0e,#0d2614)' },
  { key: 'geopolitical', label: 'Geo-Political',    icon: '🌐', color: '#f97316', grad: 'linear-gradient(135deg,#0f0a06,#1a1008,#26160a)' },
  { key: 'cyber',        label: 'Cyber Warfare',    icon: '🔐', color: '#6366f1', grad: 'linear-gradient(135deg, #0f0720, #1e1040, #4c1d95)' },
]

const ALERTS: [string, string, string][] = [
  ['breaking', '#ef4444', 'BREAKING'],
  ['urgent', '#ef4444', 'URGENT'],
  ['attack', '#f97316', 'ALERT'],
  ['explosion', '#f97316', 'ALERT'],
  ['strike', '#f59e0b', 'BULLETIN'],
  ['launch', '#f59e0b', 'BULLETIN'],
  ['nuclear', '#f59e0b', 'BULLETIN'],
  ['ceasefire', '#3b82f6', 'ANALYSIS'],
  ['analysis', '#3b82f6', 'ANALYSIS'],
  ['report', '#6366f1', 'REPORT'],
]

function getAlert(title: string) {
  const low = title.toLowerCase()
  for (const [kw, color, label] of ALERTS) {
    if (low.includes(kw)) return { color, label }
  }
  return null
}

function timeAgo(d: string | null) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function srcColor(source: string): string {
  const m: Record<string, string> = {
    'war zone': '#ef4444', 'breaking defense': '#f97316',
    'usni': '#0ea5e9', 'defense one': '#8b5cf6',
    'military times': '#22c55e', 'naval news': '#0ea5e9',
    'nato': '#3b82f6', 'dod': '#3b82f6', 'pentagon': '#3b82f6',
    'uk mod': '#ef4444', 'idf': '#3b82f6', 'isw': '#f59e0b',
    'bellingcat': '#f59e0b', 'oryx': '#f59e0b',
    'reuters': '#f97316', 'ukrainian': '#3b82f6',
  }
  const low = source.toLowerCase()
  for (const [k, v] of Object.entries(m)) {
    if (low.includes(k)) return v
  }
  return '#6060a0'
}

function Card({ feed, theme, col }: { feed: Feed, theme: Theme, col: typeof COLS[0] | undefined }) {
  const t = T[theme]
  const alert = getAlert(feed.title)
  const color = srcColor(feed.source)

  return (
    <a href={feed.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
      <div
        style={{ margin: '8px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.card, overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = t.borderHover
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = t.border
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Gradient thumbnail */}
        <div style={{ height: '56px', background: col?.grad || t.badge, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
            <span style={{ fontSize: '22px', opacity: 0.5 }}>{col?.icon}</span>
            {alert && (
              <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.12em', background: alert.color, color: '#fff', padding: '3px 8px', borderRadius: '4px' }}>
                {alert.label}
              </span>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28px', background: `linear-gradient(transparent, ${t.card})` }} />
        </div>

        {/* Content */}
        <div style={{ padding: '8px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '9px', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {feed.source.length > 20 ? feed.source.slice(0, 20) + '…' : feed.source}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {feed.type === 'official' && (
                <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.1em', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 5px', borderRadius: '3px', border: '1px solid rgba(245,158,11,0.3)' }}>
                  GOV
                </span>
              )}
              <span style={{ fontSize: '9px', color: t.textDim }}>{timeAgo(feed.published_at || feed.created_at)}</span>
            </div>
          </div>

          <p style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.45', color: t.text, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {feed.title}
          </p>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: t.badge, color: t.badgeText, padding: '2px 6px', borderRadius: '3px' }}>
              {feed.category}
            </span>
            {feed.type === 'media' && (
              <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', background: t.badge, color: t.badgeText, padding: '2px 6px', borderRadius: '3px' }}>
                media
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

function Column({ col, feeds, loading, theme }: { col: typeof COLS[0], feeds: Feed[], loading: boolean, theme: Theme }) {
  const t = T[theme]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: `1px solid ${t.border}`, minWidth: 0, minHeight: 0 }}>
      <div style={{ padding: '11px 14px', borderBottom: `1px solid ${t.border}`, background: t.colHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>{col.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: col.color }}>
            {col.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: t.textDim, fontFamily: 'monospace' }}>{feeds.length}</span>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}` }} className="animate-pulse" />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {loading ? (
          <div style={{ padding: '8px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ margin: '8px', borderRadius: '10px', background: t.card, border: `1px solid ${t.border}`, overflow: 'hidden' }} className="animate-pulse">
                <div style={{ height: '56px', background: t.badge }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ height: '8px', borderRadius: '4px', background: t.badge, width: '40%', marginBottom: '8px' }} />
                  <div style={{ height: '12px', borderRadius: '4px', background: t.badge, width: '100%', marginBottom: '4px' }} />
                  <div style={{ height: '12px', borderRadius: '4px', background: t.badge, width: '75%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : feeds.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', gap: '8px' }}>
            <span style={{ fontSize: '24px', opacity: 0.3 }}>{col.icon}</span>
            <span style={{ fontSize: '11px', color: t.textDim }}>No data</span>
          </div>
        ) : (
          feeds.map(f => <Card key={f.id} feed={f} theme={theme} col={COLS.find(c => c.key === f.category)} />)
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeNav, setActiveNav] = useState('all')
  const [theme, setTheme] = useState<Theme>('dark')
  const [search, setSearch] = useState('')
  const [bannerIdx, setBannerIdx] = useState(0)

  const fetchFeeds = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('feeds').select('*')
        .order('priority_score', { ascending: false, nullsFirst: false })
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(600)
      if (error) throw error
      if (data) { setFeeds(data as Feed[]); setLastUpdate(new Date()) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchFeeds()
    const timer = setInterval(fetchFeeds, 60000)
    return () => clearInterval(timer)
  }, [fetchFeeds])

  const t = T[theme]
  const activeItem = NAV_ITEMS.find(n => n.id === activeNav) || NAV_ITEMS[0]

  const getFeeds = (catKey: string) => {
    let result = feeds
    if (activeItem.filterType === 'official') result = result.filter(f => f.type === 'official')
    if (activeItem.filterCat !== 'all') result = result.filter(f => f.category === activeItem.filterCat)
    else result = result.filter(f => f.category === catKey)
    if (search.trim()) result = result.filter(f => f.title.toLowerCase().includes(search.toLowerCase()))
    return result
  }

  const columns = activeItem.filterCat !== 'all' ? COLS.filter(c => c.key === activeItem.filterCat) : COLS

  const getSidebarCount = (item: typeof NAV_ITEMS[0]) => {
    if (item.id === 'all') return feeds.length
    if (item.id === 'official') return feeds.filter(f => f.type === 'official').length
    return feeds.filter(f => f.category === item.id).length
  }

  // ── HOT TOPIC DETECTION ──────────────────────────────────────────
  // 1 jam terakhir
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const recentFeeds = feeds.filter(f => {
    const t2 = f.published_at || f.created_at
    return t2 && new Date(t2).getTime() > oneHourAgo
  })

  // Extract keywords penting dari judul (3+ karakter, bukan stopword)
  const STOPWORDS = new Set(['the','and','for','are','was','has','have','with','from','that','this','its','not','but','than','they','been','will','into','over','more','also','when','after','who','what','where','about','says','said','amid','new'])
  function extractKeywords(title: string): string[] {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w))
  }

  // Group artikel by keyword — cari topik yang muncul di 3+ source berbeda
  const keywordMap: Record<string, { feeds: Feed[], sources: Set<string> }> = {}
  for (const f of recentFeeds) {
    const kws = extractKeywords(f.title)
    for (const kw of kws) {
      if (!keywordMap[kw]) keywordMap[kw] = { feeds: [], sources: new Set() }
      keywordMap[kw].feeds.push(f)
      keywordMap[kw].sources.add(f.source)
    }
  }

  // Hot topics = keyword yang muncul di 3+ source berbeda
  const hotTopics = Object.entries(keywordMap)
    .filter(([, v]) => v.sources.size >= 3)
    .sort((a, b) => b[1].sources.size - a[1].sources.size)

  // Ambil artikel terbaik per hot topic (yang paling baru)
  const hotFeeds: Feed[] = []
  const seenIds = new Set<string>()
  for (const [, v] of hotTopics) {
    const best = v.feeds.sort((a, b) => {
      const ta = new Date(a.published_at || a.created_at || 0).getTime()
      const tb = new Date(b.published_at || b.created_at || 0).getTime()
      return tb - ta
    })[0]
    if (best && !seenIds.has(best.id)) {
      hotFeeds.push(best)
      seenIds.add(best.id)
    }
    if (hotFeeds.length >= 8) break
  }

  // Fallback: kalau tidak ada hot topic, pakai artikel terbaru 1 jam dengan alert keyword
  const breakingFeeds = hotFeeds.length > 0 ? hotFeeds : recentFeeds.filter(f => {
    const a = getAlert(f.title)
    return a && (a.label === 'BREAKING' || a.label === 'URGENT' || a.label === 'ALERT')
  }).slice(0, 8)


  useEffect(() => {
    if (breakingFeeds.length === 0) return
    const iv = setInterval(() => {
      setBannerIdx(i => (i + 1) % breakingFeeds.length)
    }, 5000)
    return () => clearInterval(iv)
  }, [breakingFeeds.length])

  const bannerFeed = breakingFeeds[bannerIdx]
  // ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: t.bg, fontFamily: "'IBM Plex Mono', monospace", overflow: 'hidden', transition: 'background 0.3s, color 0.3s' }}>

      {/* BREAKING BANNER — Hot Topic Auto-Scroll */}
      {bannerFeed && (
        <div style={{ background: hotFeeds.length > 0 ? '#b91c1c' : '#ef4444', padding: '5px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, transition: 'all 0.3s' }}>
          <span style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.2em', color: '#fff', background: 'rgba(0,0,0,0.25)', padding: '2px 8px', borderRadius: '3px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {hotFeeds.length > 0 ? '🔥 HOT' : '⚡ BREAKING'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
            <a href={bannerFeed.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: '#fff', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
              {bannerFeed.title.length > 120 ? bannerFeed.title.slice(0, 120) + '…' : bannerFeed.title}
            </a>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
              {bannerIdx + 1}/{breakingFeeds.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            {breakingFeeds.slice(0, 8).map((_, i) => (
              <div key={i} onClick={() => setBannerIdx(i)}
                style={{ width: i === bannerIdx ? '16px' : '5px', height: '5px', borderRadius: '3px', background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      )}

      {/* TOP NAV */}
      <div style={{ height: '50px', borderBottom: `1px solid ${t.border}`, background: t.nav, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} className="animate-pulse" />
            <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.25em', color: t.text }}>INTELFEEDS</span>
          </div>
          <span style={{ width: '1px', height: '16px', background: t.border }} />
          <span style={{ fontSize: '10px', color: t.textSub, letterSpacing: '0.04em' }}>Defense & Geopolitical Intelligence</span>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '340px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search intel..."
            style={{ width: '100%', padding: '6px 14px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: '11px', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
            onFocus={e => (e.target.style.borderColor = '#6060f0')}
            onBlur={e => (e.target.style.borderColor = t.border)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', color: t.textSub }}>
            {feeds.length} feeds · {lastUpdate ? timeAgo(lastUpdate.toISOString()) + ' ago' : '...'}
          </span>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: '10px', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.05em', transition: 'all 0.2s' }}>
            {theme === 'dark' ? '☀ LIGHT' : '◑ DARK'}
          </button>
          <button onClick={() => { setLoading(true); fetchFeeds() }}
            style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.card, color: t.textSub, fontSize: '13px', cursor: 'pointer' }}>
            ↻
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* SIDEBAR */}
        <div style={{ width: '200px', flexShrink: 0, borderRight: `1px solid ${t.border}`, background: t.sidebar, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '14px 12px 6px' }}>
            <span style={{ fontSize: '9px', color: t.textDim, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
              Categories
            </span>
          </div>

          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.id
            const count = getSidebarCount(item)
            return (
              <div key={item.id}>
                {item.id === 'official' && <div style={{ margin: '6px 12px', borderTop: `1px solid ${t.border}` }} />}
                <button onClick={() => setActiveNav(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 14px', width: '100%', textAlign: 'left',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: isActive ? (theme === 'dark' ? '#0e0e22' : '#eef0ff') : 'transparent',
                  borderLeft: isActive ? '2px solid #6060f0' : '2px solid transparent',
                }}>
                  <span style={{ fontSize: '15px' }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? t.text : t.textSub }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '9px', color: t.textDim }}>{item.sub}</div>
                  </div>
                  <span style={{ fontSize: '9px', color: isActive ? '#8080c0' : t.textDim, background: t.badge, padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                    {count}
                  </span>
                </button>
              </div>
            )
          })}

          <div style={{ margin: '10px 12px', borderTop: `1px solid ${t.border}` }} />
          <div style={{ padding: '8px 14px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} className="animate-pulse" />
              <span style={{ fontSize: '10px', color: t.textSub, fontWeight: 600 }}>Live Monitoring</span>
            </div>
            <div style={{ fontSize: '9px', color: t.textDim, lineHeight: '1.6' }}>
              Auto-refresh: 60s<br />
              {feeds.filter(f => f.type === 'official').length} gov · {feeds.filter(f => f.type === 'media').length} media
            </div>
          </div>
        </div>

        {/* COLUMNS */}
        <div style={{ flex: 1, display: 'grid', overflow: 'hidden', minHeight: 0, gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map(col => (
            <Column key={col.key} col={col} feeds={getFeeds(col.key)} loading={loading} theme={theme} />
          ))}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{ height: '26px', borderTop: `1px solid ${t.border}`, background: t.nav, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: '9px', color: t.textSub, letterSpacing: '0.05em' }}>SYSTEM OPERATIONAL</span>
        </div>
        <span style={{ fontSize: '9px', color: t.textDim }}>|</span>
        <span style={{ fontSize: '9px', color: t.textSub }}>
          {feeds.filter(f => f.type === 'official').length} OFFICIAL · {feeds.filter(f => f.type === 'media').length} MEDIA
        </span>
        {search && (
          <span style={{ fontSize: '9px', color: '#6060f0', fontWeight: 700 }}>
            🔍 "{search}" — {columns.reduce((acc, col) => acc + getFeeds(col.key).length, 0)} results
          </span>
        )}
        <span style={{ fontSize: '9px', color: t.textDim, marginLeft: 'auto' }}>
          INTELFEEDS v1.0 · {new Date().toUTCString().slice(0, 25)} UTC
        </span>
      </div>
    </div>
  )
}