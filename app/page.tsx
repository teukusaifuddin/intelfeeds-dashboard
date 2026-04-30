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
  { key: 'naval',        label: 'Naval & Maritime', icon: '⚓', color: '#0ea5e9', grad: 'linear-gradient(135deg,#071828,#0a3060,#1a6fa8)' },
  { key: 'air',          label: 'Air Power',        icon: '✈', color: '#8b5cf6', grad: 'linear-gradient(135deg,#120720,#2a1060,#6a3fa8)' },
  { key: 'land',         label: 'Land Forces',      icon: '⚔', color: '#22c55e', grad: 'linear-gradient(135deg,#071a0e,#0a4020,#1a7a40)' },
  { key: 'geopolitical', label: 'Geo-Political',    icon: '🌐', color: '#f97316', grad: 'linear-gradient(135deg,#1a0e04,#3a1a08,#a05010)' },
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
}function Card({ feed, theme }: { feed: Feed, theme: Theme }) {
  const t = T[theme]
  const alert = getAlert(feed.title)
  const color = srcColor(feed.source)
  const col = COLS.find(c => c.key === feed.category)

  return (
    <a href={feed.url} target="_blank" rel="noopener noreferrer" style={{display:'block',textDecoration:'none'}}>
      <div
        style={{margin:'8px',borderRadius:'10px',border:`1px solid ${t.border}`,background:t.card,overflow:'hidden',transition:'all 0.15s',cursor:'pointer'}}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = t.borderHover
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.2)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = t.border
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Gradient thumbnail */}
        <div style={{height:'64px',background:col?.grad || t.badge,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 14px'}}>
            <span style={{fontSize:'24px',opacity:0.6}}>{col?.icon}</span>
            {alert && (
              <span style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.12em',background:alert.color,color:'#fff',padding:'3px 8px',borderRadius:'4px'}}>
                {alert.label}
              </span>
            )}
          </div>
          {/* Gradient overlay bottom */}
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:'32px',background:`linear-gradient(transparent, ${t.card})`}} />
        </div>

        {/* Content */}
        <div style={{padding:'10px 12px 12px'}}>
          {/* Source + time */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',background:color,flexShrink:0}} />
              <span style={{fontSize:'9px',fontWeight:700,color:color,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                {feed.source.length > 20 ? feed.source.slice(0,20)+'…' : feed.source}
              </span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
              {feed.type === 'official' && (
                <span style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.1em',background:'rgba(245,158,11,0.15)',color:'#f59e0b',padding:'2px 5px',borderRadius:'3px',border:'1px solid rgba(245,158,11,0.3)'}}>
                  GOV
                </span>
              )}
              <span style={{fontSize:'9px',color:t.textDim}}>{timeAgo(feed.published_at || feed.created_at)}</span>
            </div>
          </div>

          {/* Title */}
          <p style={{fontSize:'13px',fontWeight:600,lineHeight:'1.45',color:t.text,margin:'0 0 8px',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {feed.title}
          </p>

          {/* Tags */}
          <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
            <span style={{fontSize:'8px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',background:t.badge,color:t.badgeText,padding:'2px 6px',borderRadius:'3px'}}>
              {feed.category}
            </span>
            {feed.type === 'media' && (
              <span style={{fontSize:'8px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',background:t.badge,color:t.badgeText,padding:'2px 6px',borderRadius:'3px'}}>
                media
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

function Column({ col, feeds, loading, theme }: {
  col: typeof COLS[0], feeds: Feed[], loading: boolean, theme: Theme
}) {
  const t = T[theme]
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',borderRight:`1px solid ${t.border}`,minWidth:0}}>
      {/* Header */}
      <div style={{padding:'12px 14px',borderBottom:`1px solid ${t.border}`,background:t.colHeader,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'15px'}}>{col.icon}</span>
          <span style={{fontSize:'11px',fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:col.color}}>
            {col.label}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <span style={{fontSize:'10px',color:t.textDim,fontFamily:'monospace'}}>{feeds.length}</span>
          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:col.color,boxShadow:`0 0 6px ${col.color}`}} className="animate-pulse" />
        </div>
      </div>

      {/* Scrollable feed */}
      <div style={{flex:1,overflowY:'auto',overflowX:'hidden'}}
        className="scrollbar-thin">
        {loading ? (
          <div style={{padding:'8px'}}>
            {[...Array(3)].map((_,i) => (
              <div key={i} style={{margin:'8px',borderRadius:'10px',background:t.card,border:`1px solid ${t.border}`,overflow:'hidden'}} className="animate-pulse">
                <div style={{height:'64px',background:t.badge}} />
                <div style={{padding:'10px 12px'}}>
                  <div style={{height:'8px',borderRadius:'4px',background:t.badge,width:'40%',marginBottom:'8px'}} />
                  <div style={{height:'12px',borderRadius:'4px',background:t.badge,width:'100%',marginBottom:'4px'}} />
                  <div style={{height:'12px',borderRadius:'4px',background:t.badge,width:'75%'}} />
                </div>
              </div>
            ))}
          </div>
        ) : feeds.length === 0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'120px',gap:'8px'}}>
            <span style={{fontSize:'24px',opacity:0.3}}>{col.icon}</span>
            <span style={{fontSize:'11px',color:t.textDim}}>No data</span>
          </div>
        ) : (
          feeds.map(f => <Card key={f.id} feed={f} theme={theme} />)
        )}
      </div>
    </div>
  )
}export default function Dashboard() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeNav, setActiveNav] = useState('all')
  const [theme, setTheme] = useState<Theme>('dark')
  const [search, setSearch] = useState('')

  const fetchFeeds = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('feeds').select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(600)
      if (error) throw error
      if (data) { setFeeds(data as Feed[]); setLastUpdate(new Date()) }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchFeeds()
    const t = setInterval(fetchFeeds, 60000)
    return () => clearInterval(t)
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

  const breakingFeeds = feeds.filter(f => {
    const a = getAlert(f.title)
    return a && (a.label === 'BREAKING' || a.label === 'URGENT')
  }).slice(0, 3)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:t.bg,fontFamily:"'Inter','system-ui',sans-serif",overflow:'hidden',transition:'background 0.3s'}}>

      {/* BREAKING BANNER */}
      {breakingFeeds.length > 0 && (
        <div style={{background:'#ef4444',padding:'6px 20px',display:'flex',alignItems:'center',gap:'12px',flexShrink:0}}>
          <span style={{fontSize:'9px',fontWeight:900,letterSpacing:'0.2em',color:'#fff',background:'rgba(0,0,0,0.2)',padding:'2px 8px',borderRadius:'3px',flexShrink:0}}>
            ⚡ BREAKING
          </span>
          <div style={{display:'flex',gap:'16px',overflow:'hidden'}}>
            {breakingFeeds.map(f => (
              <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer"
                style={{fontSize:'11px',color:'#fff',fontWeight:600,textDecoration:'none',whiteSpace:'nowrap',opacity:0.95}}>
                {f.title.length > 80 ? f.title.slice(0,80)+'…' : f.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* TOP NAV */}
      <div style={{height:'52px',borderBottom:`1px solid ${t.border}`,background:t.nav,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',flexShrink:0,gap:'16px'}}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 10px #ef4444'}} className="animate-pulse" />
            <span style={{fontSize:'14px',fontWeight:900,letterSpacing:'0.2em',color:t.text}}>INTELFEEDS</span>
          </div>
          <span style={{width:'1px',height:'16px',background:t.border}} />
          <span style={{fontSize:'10px',color:t.textSub,letterSpacing:'0.04em'}}>Defense & Geopolitical Intelligence</span>
        </div>

        {/* Search */}
        <div style={{flex:1,maxWidth:'360px'}}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search intel..."
            style={{width:'100%',padding:'7px 14px',borderRadius:'8px',border:`1px solid ${t.border}`,background:t.card,color:t.text,fontSize:'12px',outline:'none',fontFamily:'inherit'}}
          />
        </div>

        {/* Right controls */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',flexShrink:0}}>
          <span style={{fontSize:'10px',color:t.textSub}}>
            {feeds.length} feeds · {lastUpdate ? timeAgo(lastUpdate.toISOString())+' ago' : '...'}
          </span>

          {/* Theme toggle */}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{padding:'6px 12px',borderRadius:'6px',border:`1px solid ${t.border}`,background:t.card,color:t.text,fontSize:'11px',cursor:'pointer',fontWeight:600,transition:'all 0.2s'}}>
            {theme === 'dark' ? '☀ Light' : '◑ Dark'}
          </button>

          {/* Refresh */}
          <button onClick={() => { setLoading(true); fetchFeeds() }}
            style={{padding:'6px 10px',borderRadius:'6px',border:`1px solid ${t.border}`,background:t.card,color:t.textSub,fontSize:'13px',cursor:'pointer',transition:'all 0.2s'}}>
            ↻
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* SIDEBAR */}
        <div style={{width:'200px',flexShrink:0,borderRight:`1px solid ${t.border}`,background:t.sidebar,display:'flex',flexDirection:'column',overflowY:'auto'}}>
          <div style={{padding:'14px 12px 6px'}}>
            <span style={{fontSize:'9px',color:t.textDim,letterSpacing:'0.15em',textTransform:'uppercase',fontWeight:700}}>
              Categories
            </span>
          </div>

          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.id
            const count = getSidebarCount(item)
            return (
              <div key={item.id}>
                {item.id === 'official' && (
                  <div style={{margin:'6px 12px',borderTop:`1px solid ${t.border}`}} />
                )}
                <button onClick={() => setActiveNav(item.id)} style={{
                  display:'flex',alignItems:'center',gap:'10px',
                  padding:'9px 14px',width:'100%',textAlign:'left',
                  border:'none',cursor:'pointer',transition:'all 0.15s',
                  background: isActive ? (theme === 'dark' ? '#0e0e22' : '#eef0ff') : 'transparent',
                  borderLeft: isActive ? '2px solid #6060f0' : '2px solid transparent',
                }}>
                  <span style={{fontSize:'15px'}}>{item.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'12px',fontWeight:isActive ? 700 : 500,color:isActive ? t.text : t.textSub,transition:'color 0.15s'}}>
                      {item.label}
                    </div>
                    <div style={{fontSize:'9px',color:t.textDim}}>{item.sub}</div>
                  </div>
                  <span style={{fontSize:'9px',color:isActive ? '#8080c0' : t.textDim,background:t.badge,padding:'1px 6px',borderRadius:'4px',fontFamily:'monospace',fontWeight:700}}>
                    {count}
                  </span>
                </button>
              </div>
            )
          })}

          <div style={{margin:'10px 12px',borderTop:`1px solid ${t.border}`}} />

          {/* Status */}
          <div style={{padding:'8px 14px 14px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e'}} className="animate-pulse" />
              <span style={{fontSize:'10px',color:t.textSub,fontWeight:600}}>Live Monitoring</span>
            </div>
            <div style={{fontSize:'9px',color:t.textDim,lineHeight:'1.6'}}>
              Auto-refresh: 60s<br/>
              {feeds.filter(f=>f.type==='official').length} gov · {feeds.filter(f=>f.type==='media').length} media
            </div>
          </div>
        </div>

        {/* COLUMNS */}
        <div style={{flex:1,display:'grid',overflow:'hidden',gridTemplateColumns:`repeat(${columns.length}, 1fr)`}}>
          {columns.map(col => (
            <Column key={col.key} col={col} feeds={getFeeds(col.key)} loading={loading} theme={theme} />
          ))}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{height:'26px',borderTop:`1px solid ${t.border}`,background:t.nav,display:'flex',alignItems:'center',padding:'0 16px',gap:'16px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
          <div style={{width:'4px',height:'4px',borderRadius:'50%',background:'#22c55e'}} />
          <span style={{fontSize:'9px',color:t.textSub,letterSpacing:'0.05em'}}>SYSTEM OPERATIONAL</span>
        </div>
        <span style={{fontSize:'9px',color:t.textDim}}>|</span>
        <span style={{fontSize:'9px',color:t.textSub}}>
          {feeds.filter(f=>f.type==='official').length} OFFICIAL · {feeds.filter(f=>f.type==='media').length} MEDIA
        </span>
        {search && (
          <span style={{fontSize:'9px',color:'#6060f0',fontWeight:600}}>
            🔍 "{search}" — {columns.reduce((acc, col) => acc + getFeeds(col.key).length, 0)} results
          </span>
        )}
        <span style={{fontSize:'9px',color:t.textDim,marginLeft:'auto'}}>
          INTELFEEDS v1.0 · {new Date().toUTCString().slice(0,25)} UTC
        </span>
      </div>
    </div>
  )
}