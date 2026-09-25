import { Link } from 'react-router-dom'
import { useSession } from '../session.tsx'

export function MinisteriosPage() {
  const { user } = useSession()

  return (
    <section>
      <p className="eyebrow">Etapa 1</p>
      <h1>Você entrou</h1>
      <p>
        {user?.name}, ainda não há ministério nesta conta.{' '}
        <Link to="/perfil">Abrir perfil</Link>
      </p>
    </section>
  )
}
