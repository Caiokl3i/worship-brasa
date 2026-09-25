import { Link } from 'react-router-dom'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

export function EmptySectionPage({ title, message }: { title: string; message: string }) {
  const { ministry } = useMinistry()

  return (
    <section>
      <p className="eyebrow">{ministry.name}</p>
      <h1>{title}</h1>
      <p>{message}</p>
      <p>
        <Link to="..">Voltar</Link>
      </p>
    </section>
  )
}
