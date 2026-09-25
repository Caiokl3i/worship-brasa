import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const HealthController = () => import('#controllers/health_controller')
const AccountController = () => import('#controllers/account_controller')
const SessionController = () => import('#controllers/session_controller')
const PasswordResetController = () => import('#controllers/password_reset_controller')
const ProfileController = () => import('#controllers/profile_controller')
const MinistriesController = () => import('#controllers/ministries_controller')
const InvitesController = () => import('#controllers/invites_controller')
const MembersController = () => import('#controllers/members_controller')
const MinistryFunctionsController = () => import('#controllers/ministry_functions_controller')

router.get('/health', [HealthController, 'show'])

router.post('/api/cadastrar', [AccountController, 'store'])
router.post('/api/entrar', [SessionController, 'store'])
router.post('/api/recuperar-senha', [PasswordResetController, 'store'])
router.post('/api/recuperar-senha/confirmar', [PasswordResetController, 'update'])

router
  .group(() => {
    router.get('/eu', [ProfileController, 'show'])
    router.patch('/perfil', [ProfileController, 'update'])
    router.post('/perfil/senha', [ProfileController, 'updatePassword'])
    router.post('/sair', [SessionController, 'destroy'])

    router.get('/ministerios', [MinistriesController, 'index'])
    router.post('/ministerios', [MinistriesController, 'store'])
    router.post('/convites/entrar', [InvitesController, 'enter'])
    router.delete('/pedidos/:membershipId', [MembersController, 'cancel'])

    router
      .group(() => {
        router.get('/ministerios/:ministryId', [MinistriesController, 'show'])
        router.patch('/ministerios/:ministryId', [MinistriesController, 'update'])
        router.post('/ministerios/:ministryId/sair', [MinistriesController, 'leave'])

        router.get('/ministerios/:ministryId/convite', [InvitesController, 'show'])
        router.post('/ministerios/:ministryId/convite', [InvitesController, 'store'])

        router.get('/ministerios/:ministryId/membros', [MembersController, 'index'])
        router.get('/ministerios/:ministryId/pedidos', [MembersController, 'pending'])
        router.post('/ministerios/:ministryId/pedidos/:membershipId/aprovar', [
          MembersController,
          'approve',
        ])
        router.post('/ministerios/:ministryId/pedidos/:membershipId/rejeitar', [
          MembersController,
          'reject',
        ])
        router.patch('/ministerios/:ministryId/membros/:membershipId', [
          MembersController,
          'update',
        ])
        router.put('/ministerios/:ministryId/membros/:membershipId/funcoes', [
          MembersController,
          'assignFunctions',
        ])

        router.get('/ministerios/:ministryId/funcoes', [MinistryFunctionsController, 'index'])
        router.post('/ministerios/:ministryId/funcoes', [MinistryFunctionsController, 'store'])
        router.post('/ministerios/:ministryId/funcoes/ordem', [
          MinistryFunctionsController,
          'reorder',
        ])
        router.patch('/ministerios/:ministryId/funcoes/:functionId', [
          MinistryFunctionsController,
          'update',
        ])
        router.post('/ministerios/:ministryId/funcoes/:functionId/arquivar', [
          MinistryFunctionsController,
          'archive',
        ])
      })
      .use(middleware.ministry())
  })
  .prefix('/api')
  .use([middleware.auth(), middleware.authVersion()])
