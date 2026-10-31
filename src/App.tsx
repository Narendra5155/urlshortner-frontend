import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError, type Link } from './api'
import { LinkList } from './components/LinkList'
import { ResultCard } from './components/ResultCard'
import { ShortenForm } from './components/ShortenForm'
import { Toast } from './components/Toast'

const PAGE_SIZE = 10

export default function App() {
  const [latest, setLatest] = useState<Link | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const shownCount = useRef(PAGE_SIZE)

  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  // Reloads every row currently on screen so visit counts stay fresh.
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const page = await api.list(Math.min(shownCount.current, 100), 0)
      setLinks(page.items)
      setTotal(page.total)
      setListError(null)
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Your links could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    // Visiting a short link happens in another tab; update counts when the person comes back.
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  async function loadMore() {
    setLoading(true)
    try {
      const page = await api.list(PAGE_SIZE, links.length)
      shownCount.current = links.length + page.items.length
      setLinks((prev) => [...prev, ...page.items])
      setTotal(page.total)
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'More links could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  function handleCreated(link: Link) {
    setLatest(link)
    setLinks((prev) => [link, ...prev])
    setTotal((t) => t + 1)
    shownCount.current += 1
  }

  async function copy(link: Link) {
    try {
      await navigator.clipboard.writeText(link.short_url)
      notify(`Copied ${link.short_url}`)
    } catch {
      notify('Your browser blocked copying. Select the link and copy it manually.')
    }
  }

  async function remove(link: Link) {
    try {
      await api.remove(link.code)
      setLinks((prev) => prev.filter((l) => l.code !== link.code))
      setTotal((t) => Math.max(0, t - 1))
      shownCount.current = Math.max(PAGE_SIZE, shownCount.current - 1)
      if (latest?.code === link.code) setLatest(null)
      notify(`Deleted /${link.code}. It no longer redirects.`)
    } catch (err) {
      notify(err instanceof ApiError ? err.message : `/${link.code} could not be deleted.`)
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <span className="wordmark">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M9 4h19v24H9l-6-6V10z" />
            <circle cx="9" cy="16" r="2.5" />
          </svg>
          Linktag
        </span>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">Give a long link a short tag.</h1>
            <p className="lede">
              Paste any web address. You get a short link that sends people to it, and a count of every visit.
            </p>
            <ShortenForm onCreated={handleCreated} />
          </div>
          <ResultCard link={latest} onCopy={copy} />
        </section>

        <section className="history" aria-labelledby="history-title">
          <div className="history-head">
            <h2 id="history-title">Your links</h2>
            {total > 0 && <span className="history-count">{total.toLocaleString()} total</span>}
            <button className="button button-quiet button-small" type="button" onClick={refresh} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh counts'}
            </button>
          </div>
          <LinkList
            links={links}
            total={total}
            loading={loading}
            error={listError}
            highlight={latest?.code ?? null}
            onCopy={copy}
            onDelete={remove}
            onLoadMore={loadMore}
            onRetry={refresh}
          />
        </section>
      </main>

      <Toast message={toast} />
    </div>
  )
}
