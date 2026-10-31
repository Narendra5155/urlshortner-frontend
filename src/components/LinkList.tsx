import { useState } from 'react'
import { isExpired, prettyUrl, type Link } from '../api'

interface Props {
  links: Link[]
  total: number
  loading: boolean
  error: string | null
  highlight: string | null
  onCopy: (link: Link) => Promise<void>
  onDelete: (link: Link) => Promise<void>
  onLoadMore: () => void
  onRetry: () => void
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function LinkList({ links, total, loading, error, highlight, onCopy, onDelete, onLoadMore, onRetry }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null)

  if (error && links.length === 0) {
    return (
      <div className="list-state">
        <p>{error}</p>
        <button className="button button-quiet" type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    )
  }

  if (!loading && links.length === 0) {
    return (
      <div className="list-state">
        <p>No links yet. Shorten one above and it will be listed here with its visit count.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="links" aria-busy={loading}>
        {links.map((link) => {
          const expired = isExpired(link)
          return (
            <li key={link.code} className={`link-row${link.code === highlight ? ' is-new' : ''}`}>
              <div className="link-main">
                <a className="link-code" href={link.short_url} target="_blank" rel="noreferrer">
                  /{link.code}
                </a>
                <span className="link-target" title={link.target_url}>
                  {prettyUrl(link.target_url)}
                </span>
              </div>
              <div className="link-stats">
                <span className="link-visits">
                  <strong>{link.clicks.toLocaleString()}</strong> {link.clicks === 1 ? 'visit' : 'visits'}
                </span>
                <span className="link-age">
                  {expired ? <span className="badge-expired">Expired</span> : `Made ${timeAgo(link.created_at)}`}
                </span>
              </div>
              <div className="link-actions">
                {confirming === link.code ? (
                  <>
                    <button
                      className="button button-danger button-small"
                      type="button"
                      onClick={() => onDelete(link).finally(() => setConfirming(null))}
                    >
                      Delete /{link.code}
                    </button>
                    <button className="button button-quiet button-small" type="button" onClick={() => setConfirming(null)}>
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    <button className="button button-quiet button-small" type="button" onClick={() => onCopy(link)}>
                      Copy
                    </button>
                    <button
                      className="button button-quiet button-small"
                      type="button"
                      onClick={() => setConfirming(link.code)}
                      aria-label={`Delete /${link.code}`}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {links.length < total && (
        <button className="button button-quiet load-more" type="button" onClick={onLoadMore} disabled={loading}>
          {loading ? 'Loading…' : `Show more (${total - links.length} left)`}
        </button>
      )}
    </>
  )
}
