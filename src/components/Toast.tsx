interface Props {
  message: string | null
}

export function Toast({ message }: Props) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && (
        <div className="toast" key={message}>
          {message}
        </div>
      )}
    </div>
  )
}
