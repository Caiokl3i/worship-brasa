export function TextField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  autoComplete,
  readOnly = false,
  message,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange?: (value: string) => void
  autoComplete?: string
  readOnly?: boolean
  message?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {message ? <small>{message}</small> : null}
    </label>
  )
}
