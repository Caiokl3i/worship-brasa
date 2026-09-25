import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout.tsx'
import { CadastrarPage } from './pages/CadastrarPage.tsx'
import { EntrarPage } from './pages/EntrarPage.tsx'
import { HomeGate } from './pages/HomeGate.tsx'
import { MinisteriosPage } from './pages/MinisteriosPage.tsx'
import { PerfilPage } from './pages/PerfilPage.tsx'
import { RecuperarSenhaPage } from './pages/RecuperarSenhaPage.tsx'
import { GuestOnly, RequireAuth } from './routes.tsx'
import { SessionProvider } from './session.tsx'

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeGate />} />

          <Route element={<GuestOnly />}>
            <Route path="/entrar" element={<EntrarPage />} />
            <Route path="/cadastrar" element={<CadastrarPage />} />
            <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/ministerios" element={<MinisteriosPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}
