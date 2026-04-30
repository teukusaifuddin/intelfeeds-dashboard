'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Feed } from '@/lib/supabase'

const CATEGORIES = [
  { id: 'naval',        label: 'NAVAL',        icon: '\u2693', color: '#38bdf8' },
  { id: 'air',          label: 'AIR POWER',    icon: '\u2708', color: '#a78bfa' },
  { id: 'land',         label: 'LAND',         icon: '\u2694', color: '#4ade80' },
  { id: 'geopolitical', label: 'GEOPOLITICAL', icon: '\U0001f310', color: '#fb923c' },
]

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

function FeedCard({ feed }: { feed: Feed }) {
  return (
    <a href={feed.url} target="_blank" rel="noopener noreferrer" className="block group">
      <div className="px-3 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/25 truncate max-w-[65%]">
            {feed.source}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {feed.type === 'official' && (
              <span className="text-[8px] font-bold uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                OFFICIAL
              </span>
            )}
            <span className="text-[9px] text-white/20">
              {timeAgo(feed.published_at || feed.created_at)}
            </span>
          </div>
        </div>
        <p className="text-[12px] leading-snug text-white/65 group-hover:text-white/90 transition-colors line-clamp-3 font-medium">
          {feed.title}
        </p>
      </div>
    </a>
  )
}

function Column({ cat, feeds, loading }: { cat: typeof CATEGORIES[0], feeds: Feed[], loading: boolean }) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{cat.icon}</span>
          <span className="text-[11px] font-black tracking-[0.2em] uppercase" style={{color: cat.color}}>
            {cat.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/20">{feeds.length}</span>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: cat.color}} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          [...Array(5)].map((_,i) => (
            <div key={i} className="px-3 py-3 border-b border-white/5 animate-pulse">
              <div className="h-2 bg-white/10 rounded w-1/3 mb-2" />
              <div className="h-3 bg-white/10 rounded w-full mb-1" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          ))
        ) : feeds.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <span className="text-xs text-white/20">No data</span>
          </div>
        ) : (
          feeds.map(f => <FeedCard key={f.id} feed={f} />)
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [filter, setFilter] = useState<'all'|'media'|'official'>('all')

  const fetchFeeds = useCallback(async () => {
    try {
      let q = supabase.from('feeds').select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(500)
      if (filter !== 'all') q = q.eq('type', filter)
      const { data, error } = await q
      if (error) throw error
      if (data) { setFeeds(data as Feed[]); setLastUpdate(new Date()) }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchFeeds()
    const t = setInterval(fetchFeeds, 60000)
    return () => clearInterval(t)
  }, [fetchFeeds])

  const byCategory = CATEGORIES.reduce((acc, c) => {
    acc[c.id] = feeds.filter(f => f.category === c.id)
    return acc
  }, {} as Record<string, Feed[]>)

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col" style={{fontFamily:"'IBM Plex Mono',monospace"}}>
      <header className="shrink-0 border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-black tracking-[0.3em] uppercase">INTELFEEDS</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-[9px] text-white/30 tracking-widest uppercase hidden md:block">
              Defense &amp; Geopolitical Intelligence
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-[9px] font-mono text-white/25 uppercase tracking-widest">
              <span>{feeds.length} feeds</span>
              <span className="text-amber-400/60">{feeds.filter(f=>f.type==='official').length} official</span>
              <span className="text-sky-400/60">{feeds.filter(f=>f.type==='media').length} media</span>
              {lastUpdate && <span>updated {timeAgo(lastUpdate.toISOString())}</span>}
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded p-0.5">
              {(['all','media','official'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded transition-all ${
                    filter===f ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => { setLoading(true); fetchFeeds() }}
              className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">
              &#8635;
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-3 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" style={{height:'calc(100vh - 60px)'}}>
          {CATEGORIES.map(cat => (
            <Column key={cat.id} cat={cat} feeds={byCategory[cat.id]||[]} loading={loading} />
          ))}
        </div>
      </main>
    </div>
  )
}
