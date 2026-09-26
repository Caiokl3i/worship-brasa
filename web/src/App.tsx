import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout.tsx'
import { MinistryLayout } from './layouts/MinistryLayout.tsx'
import { CadastrarPage } from './pages/CadastrarPage.tsx'
import { ConviteAdminPage } from './pages/ConviteAdminPage.tsx'
import { ConvitePage } from './pages/ConvitePage.tsx'
import { EscalaEditorPage } from './pages/EscalaEditorPage.tsx'
import { EscalasPage } from './pages/EscalasPage.tsx'
import { NovaEscalaPage } from './pages/NovaEscalaPage.tsx'
import { EntrarPage } from './pages/EntrarPage.tsx'
import { HomeGate } from './pages/HomeGate.tsx'
import { IndisponibilidadesPage } from './pages/IndisponibilidadesPage.tsx'
import { MembrosPage } from './pages/MembrosPage.tsx'
import { MinisteriosPage } from './pages/MinisteriosPage.tsx'
import { MinistryHomePage } from './pages/MinistryHomePage.tsx'
import { NovoMinisterioPage } from './pages/NovoMinisterioPage.tsx'
import { PerfilPage } from './pages/PerfilPage.tsx'
import { RepertorioFormPage } from './pages/RepertorioFormPage.tsx'
import { RepertorioPage } from './pages/RepertorioPage.tsx'
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
                <Route path="repertorio" element={<RepertorioPage />} />
                <Route path="repertorio/nova" element={<RepertorioFormPage />} />
                <Route path="repertorio/:songId" element={<RepertorioFormPage />} />
                <Route path="escalas" element={<EscalasPage />} />
                <Route path="escalas/nova" element={<NovaEscalaPage />} />
                <Route path="escalas/:scheduleId" element={<EscalaEditorPage />} />
                <Route path="indisponibilidades" element={<IndisponibilidadesPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}
