import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout.tsx'
import { MinistryLayout } from './layouts/MinistryLayout.tsx'
import { CadastrarPage } from './pages/CadastrarPage.tsx'
import { ConviteAdminPage } from './pages/ConviteAdminPage.tsx'
import { ConvitePage } from './pages/ConvitePage.tsx'
import { EmptySectionPage } from './pages/EmptySectionPage.tsx'
import { EntrarPage } from './pages/EntrarPage.tsx'
import { HomeGate } from './pages/HomeGate.tsx'
import { MembrosPage } from './pages/MembrosPage.tsx'
import { MinisteriosPage } from './pages/MinisteriosPage.tsx'
import { MinistryHomePage } from './pages/MinistryHomePage.tsx'
import { NovoMinisterioPage } from './pages/NovoMinisterioPage.tsx'
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
              <Route path="/ministerios/novo" element={<NovoMinisterioPage />} />
              <Route path="/convite/:codigo" element={<ConvitePage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/m/:ministryId" element={<MinistryLayout />}>
                <Route index element={<MinistryHomePage />} />
                <Route path="membros" element={<MembrosPage />} />
                <Route path="convite" element={<ConviteAdminPage />} />
                <Route
                  path="repertorio"
                  element={
                    <EmptySectionPage
                      title="Repertório"
                      message="Ainda não há repertório neste ministério."
                    />
                  }
                />
                <Route
                  path="escalas"
                  element={
                    <EmptySectionPage
                      title="Escalas"
                      message="Ainda não há escalas neste ministério."
                    />
                  }
                />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}
