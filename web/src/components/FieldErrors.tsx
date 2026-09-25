import type { FieldError } from '../lib/api.ts'

export function FieldErrors({ errors }: { errors: FieldError[] }) {
  if (errors.length === 0) {
    return null
  }

  return (
    <ul className="errors">
      {errors.map((error) => (
        <li key={`${error.field}-${error.message}`}>{error.message}</li>
      ))}
    </ul>
  )
}

export function fieldMessage(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message
}
