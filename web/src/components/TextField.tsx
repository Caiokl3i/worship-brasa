import { Icon, type IconName } from './Icon.tsx'

export function TextField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  autoComplete,
  readOnly = false,
  message,
  icon,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange?: (value: string) => void
  autoComplete?: string
  readOnly?: boolean
  message?: string
  icon?: IconName
}) {
  return (
    <label className={`field ${icon ? 'field-with-icon' : ''}`}>
      <span className="field-label">{label}</span>
      <div className="field-input-wrapper">
        {icon ? <Icon name={icon} size={18} className="field-icon" /> : null}
        <input
          name={name}
          type={type}
          value={value}
          autoComplete={autoComplete}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </div>
      {message ? <small className="field-error-msg">{message}</small> : null}
    </label>
  )
}
