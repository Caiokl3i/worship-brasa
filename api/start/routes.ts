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
const SongsController = () => import('#controllers/songs_controller')
const FoldersController = () => import('#controllers/folders_controller')
const ClassificationsController = () => import('#controllers/classifications_controller')
const SchedulesController = () => import('#controllers/schedules_controller')

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

        router
          .group(() => {
            router.get('/ministerios/:ministryId/musicas', [SongsController, 'index'])
            router.post('/ministerios/:ministryId/musicas', [SongsController, 'store'])
            router.get('/ministerios/:ministryId/musicas/:songId', [SongsController, 'show'])
            router.patch('/ministerios/:ministryId/musicas/:songId', [SongsController, 'update'])
            router.delete('/ministerios/:ministryId/musicas/:songId', [SongsController, 'destroy'])

            router.get('/ministerios/:ministryId/pastas', [FoldersController, 'index'])
            router.post('/ministerios/:ministryId/pastas', [FoldersController, 'store'])
            router.patch('/ministerios/:ministryId/pastas/:folderId', [FoldersController, 'update'])
            router.delete('/ministerios/:ministryId/pastas/:folderId', [
              FoldersController,
              'destroy',
            ])

            router.get('/ministerios/:ministryId/classificacoes', [
              ClassificationsController,
              'index',
            ])
            router.post('/ministerios/:ministryId/classificacoes', [
              ClassificationsController,
              'store',
            ])
            router.post('/ministerios/:ministryId/classificacoes/:classificationId/arquivar', [
              ClassificationsController,
              'archive',
            ])
          })
          .use(middleware.repertoire())

        router.get('/ministerios/:ministryId/escalas', [SchedulesController, 'index'])
        router.post('/ministerios/:ministryId/escalas', [SchedulesController, 'store'])
        router.get('/ministerios/:ministryId/escalas/:scheduleId', [SchedulesController, 'show'])
        router.patch('/ministerios/:ministryId/escalas/:scheduleId', [
          SchedulesController,
          'update',
        ])
        router.delete('/ministerios/:ministryId/escalas/:scheduleId', [
          SchedulesController,
          'destroy',
        ])
        router.post('/ministerios/:ministryId/escalas/:scheduleId/publicar', [
          SchedulesController,
          'publish',
        ])
        router.post('/ministerios/:ministryId/escalas/:scheduleId/rascunho', [
          SchedulesController,
          'unpublish',
        ])
      })
      .use(middleware.ministry())
  })
  .prefix('/api')
  .use([middleware.auth(), middleware.authVersion()])
