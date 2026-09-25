export function effectiveKey(input: {
  keyOverride: string | null
  versionKey: string | null
  defaultKey: string | null
}) {
  return input.keyOverride || input.versionKey || input.defaultKey || ''
}
