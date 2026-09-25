import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const HealthController = () => import('#controllers/health_controller')
const AccountController = () => import('#controllers/account_controller')
const SessionController = () => import('#controllers/session_controller')
const PasswordResetController = () => import('#controllers/password_reset_controller')
const ProfileController = () => import('#controllers/profile_controller')

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
  })
  .prefix('/api')
  .use([middleware.auth(), middleware.authVersion()])
