export function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? 'mark mark-large' : 'mark'} aria-hidden="true">
      <span className="mark-stem" />
      <span className="mark-foot" />
    </span>
  )
}
