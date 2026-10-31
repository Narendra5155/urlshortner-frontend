import { useState } from 'react'
import { prettyUrl, type Link } from '../api'

interface Props {
  link: Link | null
  onCopy: (link: Link) => Promise<void>
}

const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export function ResultCard({ link, onCopy }: Props) {
  const [copied, setCopied] = useState(false)

  if (!link) {
    return (
      <div className="tag-stage">
        <div className="tag tag-empty" aria-hidden="true">
          <div className="tag-card">
            <div className="tag-stub">
              <span className="tag-hole" />
            </div>
            <div className="tag-body">
              <p className="tag-placeholder">Your short link will be printed on this tag.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  async function copy() {
    if (!link) return
    await onCopy(link)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="tag-stage" aria-live="polite">
      {/* key restarts the swing animation for every new link */}
      <article className="tag tag-live" key={link.code} aria-label="Your new short link">
        <div className="tag-card">
          <div className="tag-stub">
            <span className="tag-hole" />
            <span className="tag-host">{new URL(link.target_url).hostname.replace(/^www\./, '')}</span>
          </div>
          <div className="tag-body">
            <p className="tag-code">{link.code}</p>
            <p className="tag-short">{prettyUrl(link.short_url)}</p>
            <dl className="tag-meta">
              <div>
                <dt>Goes to</dt>
                <dd className="tag-target" title={link.target_url}>
                  {prettyUrl(link.target_url)}
                </dd>
              </div>
              <div>
                <dt>Stops working</dt>
                <dd>{link.expires_at ? dateFormat.format(new Date(link.expires_at)) : 'Never'}</dd>
              </div>
            </dl>
            <div className="tag-actions">
              <button className="button button-primary" type="button" onClick={copy}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <a className="button button-quiet" href={link.short_url} target="_blank" rel="noreferrer">
                Open
              </a>
            </div>
          </div>
        </div>
        <svg className="tag-string" viewBox="0 0 120 90" aria-hidden="true">
          <path d="M114 86 C 96 52, 58 18, 2 2" />
        </svg>
      </article>
    </div>
  )
}
