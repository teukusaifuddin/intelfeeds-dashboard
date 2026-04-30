'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Feed } from '@/lib/supabase'

const NAV_ITEMS = [
  { id: 'all',          label: 'Intel Stream',   icon: '◈', sub: 'All Categories',    filterType: 'all',      filterCat: 'all' },
  { id: 'naval',        label: 'Naval',          icon: '⚓', sub: 'Maritime Ops',      filterType: 'all',      filterCat: 'naval' },
  { id: 'air',          label: 'Air Power',      icon: '✈', sub: 'Aerospace',         filterType: 'all',      filterCat: 'air' },
  { id: 'land',         label: 'Land',           icon: '⚔', sub: 'Ground Forces',     filterType: 'all',      filterCat: 'land' },
  { id: 'geopolitical', label: 'Geopolitical',   icon: '🌐', sub: 'Diplomacy & Intel', filterType: 'all',      filterCat: 'geopolitical' },
  { id: 'official',     label: 'MoD & Official', icon: '🏛', sub: 'Gov Press Release', filterType: 'official', filterCat: 'all' },
]

const ALL_COLS = [
  { key: 'naval',        label: 'Naval & Maritime', icon: '⚓', color: '#0ea5e9' },
  { key: 'air',          label: 'Air Power',        icon: '✈', color: '#8b5cf6' },
  { key: 'land',         label: 'Land Forces',      icon: '⚔', color: '#22c55e' },
  { key: 'geopolitical', label: 'Geo-Political',    icon: '🌐', color: '#f97316' },
]

function timeAgo(d: string | null) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function getSourceColor(source: string): string {
  const map: Record<string,string> = {
    'war zone': '#ef4444', 'breaking defense': '#f97316',
    'usni': '#0ea5e9', 'defense one': '#8b5cf6',
    'military times': '#22c55e', 'naval news': '#0ea5e9',
    'nato': '#3b82f6', 'dod': '#3b82f6', 'pentagon': '#3b82f6',
    'uk mod': '#ef4444', 'idf': '#3b82f6', 'isw': '#f59e0b',
    'bellingcat': '#f59e0b', 'oryx': '#f59e0b',
  }
  const low = source.toLowerCase()
  for (const [k, v] of Object.entries(map)) {
    if (low.includes(k)) return v
  }
  return '#4a4a6a'
}function Card({ feed }: { feed: Feed }) {
  const srcColor = getSourceColor(feed.source)
  return (
    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="block group">
      <div
        style={{margin:'8px',borderRadius:'8px',border:'1px solid #1a1a2e',background:'#0e0e1c',padding:'12px',transition:'all 0.15s',cursor:'pointer'}}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a4e')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a2e')}
      >
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:srcColor,flexShrink:0}} />
            <span style={{fontSize:'10px',fontWeight:700,color:srcColor,textTransform:'uppercase',letterSpacing:'0.05em'}}>
              {feed.source.length > 22 ? feed.source.slice(0,22)+'…' : feed.source}
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            {feed.type === 'official' && (
              <span style={{fontSize:'8px',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',background:'rgba(245,158,11,0.1)',color:'#f59e0b',padding:'2px 5px',borderRadius:'3px',border:'1px solid rgba(245,158,11,0.2)'}}>
                GOV
              </span>
            )}
            <span style={{fontSize:'10px',color:'#3a3a5a'}}>
              {timeAgo(feed.published_at || feed.created_at)}
            </span>
          </div>
        </div>
        <p style={{fontSize:'13px',lineHeight:'1.5',color:'#9090b0',margin:0,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {feed.title}
        </p>
        <div style={{display:'flex',gap:'4px',marginTop:'8px',flexWrap:'wrap'}}>
          <span style={{fontSize:'9px',fontWeight:600,textTransform:'uppercase',background:'#12122a',color:'#4a4a6a',padding:'2px 6px',borderRadius:'3px'}}>
            {feed.category}
          </span>
          {feed.type === 'media' && (
            <span style={{fontSize:'9px',fontWeight:600,textTransform:'uppercase',background:'#12122a',color:'#4a4a6a',padding:'2px 6px',borderRadius:'3px'}}>
              media
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

function Column({ col, feeds, loading }: { col: {key:string,label:string,icon:string,color:string}, feeds: Feed[], loading: boolean }) {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',borderRight:'1px solid #0e0e1e',minWidth:0}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #0e0e1e',background:'#09091a',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'14px'}}>{col.icon}</span>
          <span style={{fontSize:'11px',fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:col.color}}>
            {col.label}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <span style={{fontSize:'10px',color:'#2a2a4a',fontFamily:'monospace'}}>{feeds.length}</span>
          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:col.color,opacity:0.6}} className="animate-pulse" />
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',scrollbarWidth:'thin',scrollbarColor:'#1a1a2e transparent'}}>
        {loading ? (
          <div style={{padding:'8px'}}>
            {[...Array(4)].map((_,i) => (
              <div key={i} style={{margin:'8px 0',padding:'12px',borderRadius:'8px',background:'#0e0e1c',border:'1px solid #1a1a2e'}} className="animate-pulse">
                <div style={{height:'8px',borderRadius:'4px',background:'#1a1a2e',width:'40%',marginBottom:'10px'}} />
                <div style={{height:'12px',borderRadius:'4px',background:'#1a1a2e',width:'100%',marginBottom:'6px'}} />
                <div style={{height:'12px',borderRadius:'4px',background:'#1a1a2e',width:'80%'}} />
              </div>
            ))}
          </div>
        ) : feeds.length === 0 ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'80px'}}>
            <span style={{fontSize:'11px',color:'#2a2a4a'}}>No data</span>
          </div>
        ) : (
          feeds.map(f => <Card key={f.id} feed={f} />)
        )}
      </div>
    </div>
  )
}export default function Dashboard() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeNav, setActiveNav] = useState('all')

  const activeItem = NAV_ITEMS.find(n => n.id === activeNav) || NAV_ITEMS[0]

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

  const getFeeds = (catKey: string) => {
    if (activeItem.filterType === 'official') return feeds.filter(f => f.type === 'official' && f.category === catKey)
    if (activeItem.filterCat !== 'all') return feeds.filter(f => f.category === activeItem.filterCat)
    return feeds.filter(f => f.category === catKey)
  }

  const columns = activeItem.filterCat !== 'all'
    ? ALL_COLS.filter(c => c.key === activeItem.filterCat)
    : ALL_COLS

  const getSidebarCount = (item: typeof NAV_ITEMS[0]) => {
    if (item.id === 'all') return feeds.length
    if (item.id === 'official') return feeds.filter(f => f.type === 'official').length
    return feeds.filter(f => f.category === item.id).length
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'#080814',fontFamily:'system-ui,sans-serif',overflow:'hidden'}}>

      {/* TOP NAV */}
      <div style={{height:'48px',borderBottom:'1px solid #0e0e1e',background:'#07070f',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 8px #ef4444'}} className="animate-pulse" />
            <span style={{fontSize:'13px',fontWeight:900,letterSpacing:'0.2em',color:'#e0e0f0'}}>INTELFEEDS</span>
          </div>
          <span style={{width:'1px',height:'16px',background:'#1a1a2e'}} />
          <span style={{fontSize:'10px',color:'#3a3a5a'}}>Defense & Geopolitical Intelligence</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <span style={{fontSize:'10px',color:'#3a3a5a'}}>
            {feeds.length} feeds · {lastUpdate ? timeAgo(lastUpdate.toISOString())+' ago' : 'loading...'}
          </span>
          <button onClick={() => { setLoading(true); fetchFeeds() }} style={{fontSize:'14px',color:'#3a3a5a',background:'none',border:'none',cursor:'pointer'}}>↻</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* SIDEBAR */}
        <div style={{width:'210px',flexShrink:0,borderRight:'1px solid #0e0e1e',background:'#07070f',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'16px 12px 8px'}}>
            <span style={{fontSize:'9px',color:'#2a2a4a',letterSpacing:'0.15em',textTransform:'uppercase',fontWeight:700}}>Categories</span>
          </div>

          {NAV_ITEMS.map((item, idx) => {
            const isActive = activeNav === item.id
            const count = getSidebarCount(item)
            const isMod = item.id === 'official'
            return (
              <div key={item.id}>
                {isMod && <div style={{margin:'8px 12px',borderTop:'1px solid #0e0e1e'}} />}
                <button onClick={() => setActiveNav(item.id)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',width:'100%',textAlign:'left',border:'none',cursor:'pointer',transition:'all 0.15s',background:isActive ? '#0e0e20' : 'transparent',borderLeft:isActive ? '2px solid #4a4af0' : '2px solid transparent'}}>
                  <span style={{fontSize:'14px'}}>{item.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'12px',fontWeight:isActive ? 700 : 500,color:isActive ? '#c0c0e0' : '#5a5a7a'}}>{item.label}</div>
                    <div style={{fontSize:'9px',color:'#3a3a5a'}}>{item.sub}</div>
                  </div>
                  <span style={{fontSize:'9px',color:isActive ? '#6060a0' : '#2a2a4a',background:'#0e0e1e',padding:'1px 5px',borderRadius:'3px',fontFamily:'monospace'}}>{count}</span>
                </button>
              </div>
            )
          })}

          <div style={{margin:'12px',borderTop:'1px solid #0e0e1e'}} />
          <div style={{padding:'8px 14px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#22c55e'}} className="animate-pulse" />
              <span style={{fontSize:'10px',color:'#4a4a6a'}}>Live Monitoring</span>
            </div>
            <div style={{fontSize:'9px',color:'#2a2a4a'}}>Auto-refresh: 60s</div>
            <div style={{fontSize:'9px',color:'#2a2a4a',marginTop:'2px'}}>
              {feeds.filter(f=>f.type==='official').length} gov · {feeds.filter(f=>f.type==='media').length} media
            </div>
          </div>
        </div>

        {/* COLUMNS */}
        <div style={{flex:1,display:'grid',overflow:'hidden',gridTemplateColumns:`repeat(${columns.length}, 1fr)`}}>
          {columns.map(col => (
            <Column key={col.key} col={col} feeds={getFeeds(col.key)} loading={loading} />
          ))}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{height:'24px',borderTop:'1px solid #0e0e1e',background:'#07070f',display:'flex',alignItems:'center',padding:'0 16px',gap:'16px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
          <div style={{width:'4px',height:'4px',borderRadius:'50%',background:'#22c55e'}} />
          <span style={{fontSize:'9px',color:'#3a3a5a',letterSpacing:'0.05em'}}>SYSTEM OPERATIONAL</span>
        </div>
        <span style={{fontSize:'9px',color:'#2a2a4a'}}>|</span>
        <span style={{fontSize:'9px',color:'#3a3a5a'}}>{feeds.filter(f=>f.type==='official').length} OFFICIAL · {feeds.filter(f=>f.type==='media').length} MEDIA</span>
        <span style={{fontSize:'9px',color:'#2a2a4a',marginLeft:'auto'}}>{new Date().toUTCString().slice(0,25)} UTC</span>
      </div>
    </div>
  )
}