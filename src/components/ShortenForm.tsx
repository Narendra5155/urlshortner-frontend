import { useState, type FormEvent } from 'react'
import { api, ApiError, type Link } from '../api'

const EXPIRY_OPTIONS = [
  { value: '', label: 'Never' },
  { value: '1', label: 'In 1 day' },
  { value: '7', label: 'In 7 days' },
  { value: '30', label: 'In 30 days' },
  { value: '90', label: 'In 90 days' },
]

interface Props {
  onCreated: (link: Link) => void
}

export function ShortenForm({ onCreated }: Props) {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [expiry, setExpiry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Paste a link to shorten.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const link = await api.create({
        url: /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
        custom_alias: alias.trim() || undefined,
        expires_in_days: expiry ? Number(expiry) : undefined,
      })
      onCreated(link)
      setUrl('')
      setAlias('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong while shortening.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="shorten" onSubmit={submit} noValidate>
      <label className="field-label" htmlFor="url">
        Long link
      </label>
      <div className="shorten-row">
        <input
          id="url"
          className="input input-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://example.com/a/very/long/path?with=parameters"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'shorten-error' : undefined}
          autoFocus
        />
        <button className="button button-primary" type="submit" disabled={busy}>
          {busy ? 'Shortening…' : 'Shorten link'}
        </button>
      </div>

      {error && (
        <p className="form-error" id="shorten-error" role="alert">
          {error}
        </p>
      )}

      <details className="options">
        <summary>Custom alias and expiry</summary>
        <div className="options-grid">
          <div>
            <label className="field-label" htmlFor="alias">
              Custom alias
            </label>
            <div className="alias-input">
              <span className="alias-prefix" aria-hidden="true">
                /
              </span>
              <input
                id="alias"
                className="input input-mono"
                placeholder="spring-sale"
                maxLength={32}
                autoComplete="off"
                spellCheck={false}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
            <p className="hint">Leave blank for a random 7-character code.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="expiry">
              Stops working
            </label>
            <select id="expiry" className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>
    </form>
  )
}
