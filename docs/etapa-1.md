# Etapa 1 — faça você mesmo

Siga na ordem. Cada passo termina com uma conferência. Se a conferência falhar, pare e corrija antes do próximo.

Você continua na pasta do repositório (`worship-brasa`). A Etapa 0 já subiu a API, o React, o Postgres e o cookie de sessão. Esta etapa coloca uma pessoa dentro desse cookie.

O que esta etapa produz:

- Conta com nome, e-mail e senha
- Entrar, sair e continuar autenticado por 30 dias
- Recuperação de senha por código de 6 dígitos
- Perfil com nome e data de nascimento
- A rota `/ministerios`, ainda vazia, mostrando só que a pessoa entrou

O que esta etapa não produz: Google, foto, apagar conta, ministério, música, escala. Data de nascimento fica guardada e ainda não avisa ninguém.

---

## 0. O mapa mental

O navegador nunca guarda a senha e nunca guarda o id da pessoa no `localStorage`. Quem guarda a identidade é o cookie `httpOnly` que a Etapa 0 já configurou.

```
/entrar  /cadastrar  /recuperar-senha     públicas, sem cookie
        │
        ▼
   POST na API  →  senha confere  →  cookie adonis-session
        │
        ▼
/ministerios  /perfil                     só com cookie válido
```

Dentro da API, a divisão continua a da Etapa 0:

| Pasta | Responsabilidade nesta etapa |
| --- | --- |
| `app/controllers` | Lê o JSON, chama o service, devolve status e JSON. |
| `app/services` | Cadastrar, conferir senha, gerar código, trocar senha, montar o perfil público. |
| `app/models` | Tabela `users` e tabela `password_resets`. O hash da senha acontece aqui, no `beforeSave` do Lucid. |
| `app/validators` | Formato do JSON: e-mail, tamanho da senha, confirmação igual. |
| `app/middleware` | Sem cookie, a rota protegida responde 401. Cookie de senha antiga também. |

O React só conhece este objeto. A senha não entra nele.

```ts
type PublicUser = {
  id: string
  name: string
  email: string
  birthDate: string | null
}
```

`birthDate` é `YYYY-MM-DD` ou `null`. É um dia de calendário, não um instante. Por isso a coluna é `date`, não `timestamptz`.

Dois jeitos de errar, e o React trata cada um de um modo:

| HTTP | Significado | O que a tela faz |
| --- | --- | --- |
| 422 | Formulário inválido. O corpo é `{ errors: [{ field, message }] }`. | Mostra a mensagem no campo. |
| 401 | Não há sessão, ou a sessão morreu porque a senha mudou. | Manda para `/entrar`. |

Login com senha errada é 422, não 401. A frase é sempre “E-mail ou senha inválidos.” 401 fica reservado para “você não está dentro”.

---

## 1. O que o kit do Adonis já criou

O comando da Etapa 0 instalou o guard de sessão e, junto, um login por token que esta etapa não usa.

Abra estes arquivos e reconheça o que vai sair:

- [api/config/auth.ts](../api/config/auth.ts) — o guard padrão se chama `api` e devolve token. O guard `web` é a sessão. Vamos ficar só com `web`.
- [api/start/routes.ts](../api/start/routes.ts) — `POST /api/v1/auth/signup` e `POST /api/v1/auth/login` devolvem token. Isso é o contrário do plano: o id não pode ir para o JavaScript.
- [api/database/migrations/1761885935168_create_users_table.ts](../api/database/migrations/1761885935168_create_users_table.ts) — `users` com id numérico e coluna `full_name`. O plano trava UUID e o campo `name`.
- [api/database/schema.ts](../api/database/schema.ts) — gerado pelo `migration:run`. Não edite este arquivo à mão. A migration nova recria a tabela e o Ace reescreve o schema.

Não altere as migrations antigas. Elas já podem ter rodado na sua máquina. Uma migration nova, com data mais recente, derruba a tabela de token e recria `users`. Não há conta de verdade ainda. Se você chegou a chamar o `/api/v1/auth/signup` do kit, esse usuário some. Isso é esperado.

A coluna da senha continua se chamando `password`. O Lucid e o `withAuthFinder` procuram esse nome. O que entra nela é o hash scrypt, nunca o texto. O [api/config/hash.ts](../api/config/hash.ts) já está em scrypt. Não instale bcrypt nem argon.

`User.verifyCredentials` já compara o hash em tempo constante: se o e-mail não existe, ele ainda calcula um hash, para a resposta não ficar mais rápida e denunciar a conta. Use esse método. Não escreva `===` na senha.

---

## 2. Sessão de 30 dias, só no guard web

Abra [api/config/session.ts](../api/config/session.ts). O `age` está `'30'`. Isso não são 30 dias. Troque para:

```ts
age: '30 days',
```

O restante do cookie fica como a Etapa 0 deixou: `httpOnly: true`, `secure: app.inProduction`, `sameSite: 'lax'`. Cada pedido autenticado renova esse prazo, porque o middleware de sessão regrava o cookie. Ficar 30 dias sem abrir o sistema é o que expira.

`SameSite=Lax` não manda o cookie num POST vindo de outro site. `localhost:5173` e `localhost:3333` são origens diferentes (por isso o CORS da Etapa 0 existe) e o mesmo site (a porta não entra nessa conta). O `fetch` com `credentials: 'include'` leva o cookie. Não ligue o CSRF do Shield nesta etapa: com Lax, o POST de outro site já não leva o cookie, e ligar o CSRF agora bloquearia o React sem um token a mais.

Abra [api/config/auth.ts](../api/config/auth.ts) e substitua o arquivo por este. Some o guard `api` e o import de token. O padrão passa a ser `web`.

```ts
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
import type { InferAuthenticators, InferAuthEvents, Authenticators } from '@adonisjs/auth/types'

const authConfig = defineConfig({
  default: 'web',

  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    }),
  },
})

export default authConfig

declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
```

`useRememberMeTokens: false` deixa a identidade só na sessão de 30 dias. Um segundo cookie de “lembrar de mim” seria outra sessão para derrubar na troca de senha, e esta etapa não precisa dele.

O cookie guarda a chave `auth_web` com o id do usuário. Papel de ministério não existe ainda e, quando existir, não entra no cookie. O id da URL continua sendo a fonte do ministério, como a Etapa 0 combinou.

Conferência: em `auth.ts` não resta `tokensGuard` nem `access_tokens`. Em `session.ts`, `age` é `'30 days'`.

---

## 3. A migration de conta

O gerador de `database/schema.ts` roda na conexão padrão, que é `pg`. As regras extras hoje estão só no bloco `sqlite` de [api/config/database.ts](../api/config/database.ts), e este projeto não usa SQLite. Sem as regras no `pg`, a coluna `code_hash` nasceria visível para um `serialize()` futuro.

No bloco `pg`, depois de `debug: app.inDev`, acrescente:

```ts
schemaGeneration: {
  enabled: true,
  rulesPaths: ['./database/schema_rules.js'],
},
```

Substitua [api/database/schema_rules.ts](../api/database/schema_rules.ts) por:

```ts
import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * O gerador já esconde a coluna password.
 * code_hash é o outro segredo: o hash do código de 6 dígitos.
 */
export default {
  tables: {
    password_resets: {
      columns: {
        code_hash: {
          tsType: 'string',
          imports: [],
          decorators: [{ name: '@column', args: { serializeAs: null } }],
        },
      },
    },
  },
} satisfies SchemaRules
```

Na pasta `api`:

```bash
cd api
node ace make:migration account
```

O Ace cria `database/migrations/<timestamp>_create_accounts_table.ts` ou nome parecido. Abra esse arquivo e substitua o conteúdo. Não mexa nas migrations do kit.

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // O kit criou token e um users com id numérico.
    // Esta etapa ainda não tem conta em uso. Recriamos users no formato do plano.
    this.schema.dropTable('auth_access_tokens')
    this.schema.dropTable('users')

    this.schema.createTable('users', (table) => {
      table.uuid('id').primary()
      table.string('name', 120).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.date('birth_date').nullable()
      table.integer('auth_version').notNullable().defaultTo(1)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

    this.schema.createTable('password_resets', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('code_hash').notNullable()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('used_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index('user_id')
    })
  }

  async down() {
    this.schema.dropTable('password_resets')
    this.schema.dropTable('users')
  }
}
```

Leia as colunas com calma:

- `id` é UUID. O JavaScript gera o valor no model. O Postgres não preenche sozinho.
- `email` é único. A grafia canônica é minúscula, garantida no validator e de novo no model.
- `password` guarda o hash. O nome é o que o `withAuthFinder` espera.
- `birth_date` é `date`. Um aniversário não tem hora nem fuso. `timestamptz` aqui faria o dia escorregar.
- `auth_version` começa em 1. Sobe cada vez que a senha muda. A sessão grava o número que viu no login. Número velho no cookie derruba essa sessão. Assim o store `cookie` da Etapa 0 consegue encerrar as outras sessões sem uma tabela de sessões.
- `password_resets.code_hash` é o hash do código, não o código. O código em claro só existe na memória e, em desenvolvimento, no log do servidor.
- `expires_at` é `timestamptz`. Trinta minutos são um instante, não um dia de calendário.
- `used_at` nulo significa “ainda serve”. Preenchido significa “já gasto”.
- `down` não recria a tabela de token. Voltar o kit não é o caminho desta etapa.

Aplique, ainda em `api`:

```bash
node ace migration:run
```

O Ace lista a migration nova e reescreve `database/schema.ts`. Abra esse arquivo. Você deve encontrar `UserSchema` e `PasswordResetSchema`, e não deve restar `AuthAccessTokenSchema`. A coluna `password` continua com `serializeAs: null`. `codeHash` também. Não edite o schema à mão. Se o nome de uma propriedade vier diferente do que os próximos arquivos usam, use o nome que o schema gerou.

Conferência: no Postgres, `\d users` mostra `id` como `uuid` e `birth_date` como `date`. `\d password_resets` existe. `auth_access_tokens` não existe.

---

## 4. Os models

`database/schema.ts` é a fotografia das colunas. O model em `app/models` acrescenta o comportamento: gerar o id, normalizar o e-mail, hashear a senha.

Substitua [api/app/models/user.ts](../api/app/models/user.ts):

```ts
import { randomUUID } from 'node:crypto'
import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { beforeCreate, beforeSave } from '@adonisjs/lucid/orm'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @beforeCreate()
  static assignId(user: User) {
    user.id = randomUUID()
  }

  @beforeSave()
  static normalizeEmail(user: User) {
    if (user.email) {
      user.email = user.email.trim().toLowerCase()
    }
  }
}
```

`withAuthFinder(hash)` faz duas coisas que você não reimplementa: no `beforeSave`, se `password` mudou, troca o texto pelo hash scrypt; `User.verifyCredentials(email, password)` busca o usuário e compara em tempo constante. `user.verifyPassword(texto)` compara a senha atual na troca logada.

O `beforeSave` do e-mail convive com o do hash. Os dois rodam.

Crie `api/app/models/password_reset.ts`. O nome da classe gerada é `PasswordResetSchema`. Se o schema tiver outro nome, importe o que estiver lá.

O model de usuário não importa este arquivo, então não há ciclo. A relação existe para o Lucid conhecer a chave `user_id`. As rotas desta etapa não carregam `reset.user`. Elas usam `userId` direto.

```ts
import { randomUUID } from 'node:crypto'
import { PasswordResetSchema } from '#database/schema'
import User from '#models/user'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class PasswordReset extends PasswordResetSchema {
  @beforeCreate()
  static assignId(reset: PasswordReset) {
    reset.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
```

Conferência: `user.ts` não importa `AccessToken` nem `DbAccessTokensProvider`.

---

## 5. O usuário que a API devolve

Crie `api/app/users/public_user.ts`. A pasta `users` aqui não é a tabela. É o lugar do formato público, para nenhum controller montar esse objeto na mão e esquecer de tirar a senha.

O apelido `#users/*` ainda não existe. Abra `api/package.json` e, dentro de `"imports"`, acrescente:

```json
"#users/*": "./app/users/*.js"
```

O arquivo:

```ts
import type User from '#models/user'

export type PublicUser = {
  id: string
  name: string
  email: string
  birthDate: string | null
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    birthDate: user.birthDate ? user.birthDate.toISODate() : null,
  }
}
```

`toISODate()` devolve `YYYY-MM-DD`. `authVersion` e `password` ficam de fora de propósito.

---

## 6. O e-mail, atrás de uma interface

Não instale pacote de e-mail. Em desenvolvimento o código vai para o log do processo da API. A tela e o JSON nunca o recebem.

Crie `api/app/services/password_reset_mailer.ts`:

```ts
import logger from '@adonisjs/core/services/logger'

export interface PasswordResetMailer {
  sendCode(email: string, code: string): Promise<void>
}

class LogPasswordResetMailer implements PasswordResetMailer {
  async sendCode(email: string, code: string) {
    logger.info(`[recuperar-senha] ${email} código ${code}`)
  }
}

let current: PasswordResetMailer = new LogPasswordResetMailer()

export function getPasswordResetMailer() {
  return current
}

/** O teste troca o envio por uma lista em memória e depois devolve o log. */
export function setPasswordResetMailer(next: PasswordResetMailer) {
  current = next
}
```

O log tem o código porque, na sua máquina, é assim que você lê o e-mail. Não registre a senha nesse arquivo, nem no service. A senha não passa por aqui.

---

## 7. As regras

Três services. O controller não abre query.

### Cadastrar, autenticar, perfil e troca logada

Crie `api/app/services/account_service.ts`:

```ts
import { errors } from '@adonisjs/auth'
import { DateTime } from 'luxon'
import User from '#models/user'

type RegisterInput = {
  name: string
  email: string
  password: string
}

type ProfileInput = {
  name: string
  birthDate: DateTime | null
}

export default class AccountService {
  async register(input: RegisterInput) {
    return User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      authVersion: 1,
    })
  }

  /**
   * Devolve o usuário ou null.
   * null vira a mesma frase para e-mail desconhecido e senha errada.
   * verifyCredentials já gasta o tempo do hash nos dois casos.
   */
  async authenticate(email: string, password: string) {
    try {
      return await User.verifyCredentials(email, password)
    } catch (error) {
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        return null
      }
      throw error
    }
  }

  async updateProfile(user: User, input: ProfileInput) {
    user.name = input.name
    user.birthDate = input.birthDate
    await user.save()
    return user
  }

  /**
   * A senha atual precisa conferir.
   * authVersion sobe para as outras sessões caírem.
   * Quem chamou grava o número novo na sessão desta requisição.
   */
  async changePassword(user: User, currentPassword: string, nextPassword: string) {
    const matches = await user.verifyPassword(currentPassword)
    if (!matches) {
      return false
    }

    user.password = nextPassword
    user.authVersion += 1
    await user.save()
    return true
  }
}
```

`User.create` dispara o `beforeSave`. A senha que você passa ainda é texto. No banco chega o hash. Não chame `hash.make` aqui, senão o hash é hasheado de novo e o login nunca confere.

### Pedir código e confirmar

Crie `api/app/services/password_reset_service.ts`:

```ts
import { randomInt } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import PasswordReset from '#models/password_reset'
import { getPasswordResetMailer } from '#services/password_reset_mailer'

const CODE_MINUTES = 30

export default class PasswordResetService {
  /**
   * E-mail que não existe termina em silêncio.
   * A rota responde a mesma frase nos dois casos.
   */
  async requestCode(email: string) {
    const user = await User.findBy('email', email)
    if (!user) {
      return
    }

    await PasswordReset.query()
      .where('userId', user.id)
      .whereNull('usedAt')
      .update({ usedAt: DateTime.utc() })

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0')

    await PasswordReset.create({
      userId: user.id,
      codeHash: await hash.make(code),
      expiresAt: DateTime.utc().plus({ minutes: CODE_MINUTES }),
    })

    await getPasswordResetMailer().sendCode(user.email, code)
  }

  /**
   * Código errado, vencido ou já usado devolve false.
   * Código errado não gasta o verdadeiro: usedAt só muda depois do hash conferir.
   */
  async confirmCode(email: string, code: string, password: string) {
    const user = await User.findBy('email', email)
    if (!user) {
      return false
    }

    const reset = await PasswordReset.query()
      .where('userId', user.id)
      .whereNull('usedAt')
      .where('expiresAt', '>', DateTime.utc().toSQL()!)
      .orderBy('createdAt', 'desc')
      .first()

    if (!reset) {
      return false
    }

    const matches = await hash.verify(reset.codeHash, code)
    if (!matches) {
      return false
    }

    await db.transaction(async (trx) => {
      reset.useTransaction(trx)
      user.useTransaction(trx)

      reset.usedAt = DateTime.utc()
      user.password = password
      user.authVersion += 1

      await reset.save()
      await user.save()
    })

    return true
  }
}
```

Pedir um código novo marca os anteriores como usados. O e-mail antigo deixa de servir, que é o que a pessoa espera quando pede outro. A transação cobre as duas tabelas: ou a senha muda e o código gasta juntos, ou nada muda.

`hash.verify(hashGuardado, texto)` é a ordem do Adonis. É a mesma comparação de tempo constante do login.

---

## 8. Os validators, em português

O tipo [api/app/types/form_error.ts](../api/app/types/form_error.ts) já existe. O Vine devolve `{ errors: [{ field, message, rule }] }`. O React lê `field` e `message`. A chave `rule` a mais não atrapalha.

Substitua [api/app/validators/user.ts](../api/app/validators/user.ts). O teto de 32 caracteres do kit sai. Uma frase-senha passa de 32. O chão continua 8, como o plano pede. O e-mail passa por `toLowerCase()` antes da regra `unique`, senão `Ana@Igreja.com` e `ana@igreja.com` virariam duas contas.

```ts
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'name.required': 'Informe o nome.',
  'name.minLength': 'Informe o nome.',
  'email.required': 'Informe o e-mail.',
  'email.email': 'Informe um e-mail válido.',
  'email.unique': 'Este e-mail já está em uso.',
  'password.required': 'Informe a senha.',
  'password.minLength': 'A senha precisa ter no mínimo 8 caracteres.',
  'passwordConfirmation.required': 'Confirme a senha.',
  'passwordConfirmation.sameAs': 'A confirmação não é igual à senha.',
  'currentPassword.required': 'Informe a senha atual.',
  'code.required': 'Informe o código.',
  'code.fixedLength': 'O código tem 6 dígitos.',
  'birthDate.date': 'Informe a data no formato AAAA-MM-DD.',
})

const email = () => vine.string().trim().email().maxLength(254).toLowerCase()
const password = () => vine.string().minLength(8).maxLength(128)

export const registerValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: vine.string().sameAs('password'),
})
registerValidator.messagesProvider = messages

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
loginValidator.messagesProvider = messages

export const requestResetValidator = vine.create({
  email: email(),
})
requestResetValidator.messagesProvider = messages

export const confirmResetValidator = vine.create({
  email: email(),
  code: vine.string().trim().fixedLength(6),
  password: password(),
  passwordConfirmation: vine.string().sameAs('password'),
})
confirmResetValidator.messagesProvider = messages

export const updateProfileValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  birthDate: vine.date({ formats: ['yyyy-MM-dd'] }).nullable().optional(),
})
updateProfileValidator.messagesProvider = messages

export const changePasswordValidator = vine.create({
  currentPassword: vine.string(),
  password: password(),
  passwordConfirmation: vine.string().sameAs('password'),
})
changePasswordValidator.messagesProvider = messages
```

O login não usa `minLength` na senha. Senha curta demais cai na frase genérica, sem dizer que o formato é que falhou.

No cadastro, “este e-mail já está em uso” é permitido: a pessoa está tentando criar. Na recuperação, o service não usa `unique` e não diz se a conta existe.

`birthDate` aceita `null` e ausência. O [api/start/validator.ts](../api/start/validator.ts) já converte `Date` do Vine para `DateTime` do Luxon. O service recebe `DateTime | null`.

O perfil não tem campo `email`. E-mail nesta etapa é somente leitura. Se o JSON mandar `email`, o Vine ignora chave desconhecida no objeto compilado por padrão. Não copie `email` para o model no service. O código acima não lê essa chave.

---

## 9. Os controllers

Quatro controllers finos. Nenhum importa `db`.

Crie `api/app/controllers/account_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import AccountService from '#services/account_service'
import { registerValidator } from '#validators/user'
import { toPublicUser } from '#users/public_user'

export default class AccountController {
  async store({ request, response, auth, session }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const user = await new AccountService().register({
      name: payload.name,
      email: payload.email,
      password: payload.password,
    })

    await auth.use('web').login(user)
    session.put('auth_version', user.authVersion)

    return response.created(toPublicUser(user))
  }
}
```

O cookie só nasce depois de `User.create` ter gravado o hash. O cadastro já entra: a senha acabou de ser aceita no formulário, e a próxima tela é `/ministerios`.

Crie `api/app/controllers/session_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import AccountService from '#services/account_service'
import { loginValidator } from '#validators/user'
import { toPublicUser } from '#users/public_user'

const invalidLogin = {
  errors: [{ field: 'email', message: 'E-mail ou senha inválidos.' }],
}

export default class SessionController {
  async store({ request, response, auth, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await new AccountService().authenticate(email, password)

    if (!user) {
      return response.unprocessableEntity(invalidLogin)
    }

    await auth.use('web').login(user)
    session.put('auth_version', user.authVersion)

    return response.ok(toPublicUser(user))
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.noContent()
  }
}
```

`login` escreve `auth_web` na sessão. A linha seguinte escreve `auth_version`. As duas viajam no mesmo cookie cifrado. O JavaScript da página não lê nenhuma.

Crie `api/app/controllers/password_reset_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import PasswordResetService from '#services/password_reset_service'
import { confirmResetValidator, requestResetValidator } from '#validators/user'

const sent = {
  message: 'Se o e-mail existir, enviamos o código.',
}

const rejected = {
  errors: [{ field: 'code', message: 'Código inválido ou vencido.' }],
}

export default class PasswordResetController {
  async store({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(requestResetValidator)
    await new PasswordResetService().requestCode(email)
    return response.ok(sent)
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(confirmResetValidator)
    const ok = await new PasswordResetService().confirmCode(
      payload.email,
      payload.code,
      payload.password
    )

    if (!ok) {
      return response.unprocessableEntity(rejected)
    }

    return response.ok({ message: 'Senha atualizada. Entre com a senha nova.' })
  }
}
```

Confirmar não chama `auth.login`. A pessoa vai para `/entrar`. As sessões antigas morrem porque `authVersion` subiu, mesmo as que estavam abertas em outro navegador.

Substitua [api/app/controllers/profile_controller.ts](../api/app/controllers/profile_controller.ts). O arquivo do kit devolve token e `fullName`. Esse contrato acaba aqui.

```ts
import type { HttpContext } from '@adonisjs/core/http'
import AccountService from '#services/account_service'
import { changePasswordValidator, updateProfileValidator } from '#validators/user'
import { toPublicUser } from '#users/public_user'

const wrongCurrentPassword = {
  errors: [{ field: 'currentPassword', message: 'A senha atual não confere.' }],
}

export default class ProfileController {
  async show({ auth, response }: HttpContext) {
    return response.ok(toPublicUser(auth.getUserOrFail()))
  }

  async update({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateProfileValidator)
    const user = auth.getUserOrFail()

    await new AccountService().updateProfile(user, {
      name: payload.name,
      birthDate: payload.birthDate ?? null,
    })

    return response.ok(toPublicUser(user))
  }

  async updatePassword({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(changePasswordValidator)
    const user = auth.getUserOrFail()
    const ok = await new AccountService().changePassword(
      user,
      payload.currentPassword,
      payload.password
    )

    if (!ok) {
      return response.unprocessableEntity(wrongCurrentPassword)
    }

    session.put('auth_version', user.authVersion)
    return response.ok(toPublicUser(user))
  }
}
```

`getUserOrFail()` só funciona porque a rota passa pelo middleware `auth`. O id não vem do JSON. Essa é a regra que a etapa protege: o navegador não escolhe de quem é o perfil.

Depois da troca, `session.put` atualiza o cookie deste navegador para o número novo. Os outros cookies continuam com o número velho e caem no próximo pedido.

---

## 10. O middleware que derruba sessão velha

Crie `api/app/middleware/auth_version_middleware.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthVersionMiddleware {
  async handle({ auth, session, response }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()
    const version = Number(session.get('auth_version'))

    if (version !== user.authVersion) {
      await auth.use('web').logout()
      return response.unauthorized({ message: 'Sessão encerrada. Entre de novo.' })
    }

    return next()
  }
}
```

Ele roda depois do `auth`. Sem usuário, o `auth` já respondeu 401 e este arquivo nem executa.

`Number(...)` cobre o caso de o cookie devolver o inteiro como texto. `authVersion` no model é número.

Abra [api/start/kernel.ts](../api/start/kernel.ts). No `router.named`, deixe os dois:

```ts
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  authVersion: () => import('#middleware/auth_version_middleware'),
})
```

O `silent_auth_middleware` global chama `ctx.auth.check()` com o guard padrão. Como o padrão agora é `web`, essa checagem olha a sessão, não o token. Ela não aplica o `auth_version`. Quem aplica é a rota protegida. A tela descobre se ainda está dentro chamando `GET /api/eu`, que é protegida.

---

## 11. As rotas

Substitua [api/start/routes.ts](../api/start/routes.ts). Saem o `hello world`, o grupo `/api/v1` e o import de `#generated/controllers`.

```ts
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
```

`GET /health` continua pública. O grupo `/api` que a Etapa 0 deixou vazio agora tem as rotas de quem está dentro. A ordem do `use` importa: primeiro a sessão existe, depois o número confere.

Apague os arquivos do login por token. Eles compilariam contra coluna e tabela que não existem mais.

- `api/app/controllers/access_tokens_controller.ts`
- `api/app/controllers/new_account_controller.ts`
- `api/app/transformers/user_transformer.ts`

Conferência, com a API no ar (`npm run dev` na raiz, Docker no ar):

```bash
curl -i http://localhost:3333/api/eu
```

A resposta é 401. Sem cookie não há perfil.

```bash
curl -i -X POST http://localhost:3333/api/cadastrar \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana","email":"ana@igreja.com","password":"senha-segura","passwordConfirmation":"senha-segura"}'
```

O corpo tem `id`, `name`, `email`, `birthDate`. Não tem `password` nem `token`. O header `Set-Cookie` traz `adonis-session`.

---

## 12. Os testes

O [api/tests/bootstrap.ts](../api/tests/bootstrap.ts) já liga o cliente HTTP e a sessão. Cada teste enxerga o cookie que ele mesmo recebeu.

Crie `api/tests/functional/conta.spec.ts`:

```ts
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import PasswordReset from '#models/password_reset'
import {
  setPasswordResetMailer,
  type PasswordResetMailer,
} from '#services/password_reset_mailer'

const password = 'senha-segura'

test.group('Conta', (group) => {
  const codes: string[] = []

  group.each.setup(async () => {
    codes.length = 0
    const mailer: PasswordResetMailer = {
      async sendCode(_email, code) {
        codes.push(code)
      },
    }
    setPasswordResetMailer(mailer)
    return testUtils.db().withGlobalTransaction()
  })

  test('cadastra e entra com o cookie', async ({ client, assert }) => {
    const created = await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ANA@igreja.com',
      password,
      passwordConfirmation: password,
    })

    created.assertStatus(201)
    assert.equal(created.body().email, 'ana@igreja.com')
    assert.notProperty(created.body(), 'password')
    assert.notInclude(JSON.stringify(created.body()), password)

    const me = await client.get('/api/eu')
    me.assertStatus(200)
    me.assertBodyContains({ name: 'Ana', email: 'ana@igreja.com' })
  })

  test('não cria duas contas com o mesmo e-mail', async ({ client }) => {
    const body = {
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    }

    await client.post('/api/cadastrar').json(body)
    const again = await client.post('/api/cadastrar').json(body)

    again.assertStatus(422)
    again.assertBodyContains({
      errors: [{ field: 'email', message: 'Este e-mail já está em uso.' }],
    })
  })

  test('senha errada não diz qual campo falhou', async ({ client }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const login = await client.post('/api/entrar').json({
      email: 'ana@igreja.com',
      password: 'outra-senha',
    })

    login.assertStatus(422)
    login.assertBodyContains({
      errors: [{ field: 'email', message: 'E-mail ou senha inválidos.' }],
    })
  })

  test('rota interna sem cookie responde 401', async ({ client }) => {
    const me = await client.get('/api/eu')
    me.assertStatus(401)
  })

  test('troca a senha e mantém esta sessão', async ({ client }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const changed = await client.post('/api/perfil/senha').json({
      currentPassword: password,
      password: 'senha-nova-8',
      passwordConfirmation: 'senha-nova-8',
    })

    changed.assertStatus(200)

    const me = await client.get('/api/eu')
    me.assertStatus(200)
  })

  test('sessão com versão velha cai', async ({ client }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const User = (await import('#models/user')).default
    const user = await User.findByOrFail('email', 'ana@igreja.com')
    user.authVersion += 1
    await user.save()

    const me = await client.get('/api/eu')
    me.assertStatus(401)
  })

  test('código novo funciona uma vez e não volta no json', async ({ client, assert }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const asked = await client.post('/api/recuperar-senha').json({
      email: 'ana@igreja.com',
    })

    asked.assertStatus(200)
    asked.assertBodyContains({
      message: 'Se o e-mail existir, enviamos o código.',
    })
    assert.notInclude(JSON.stringify(asked.body()), codes[0])
    assert.lengthOf(codes, 1)

    const confirmed = await client.post('/api/recuperar-senha/confirmar').json({
      email: 'ana@igreja.com',
      code: codes[0],
      password: 'senha-nova-8',
      passwordConfirmation: 'senha-nova-8',
    })

    confirmed.assertStatus(200)

    const again = await client.post('/api/recuperar-senha/confirmar').json({
      email: 'ana@igreja.com',
      code: codes[0],
      password: 'senha-nova-9',
      passwordConfirmation: 'senha-nova-9',
    })

    again.assertStatus(422)
  })

  test('código vencido não troca a senha', async ({ client }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    await client.post('/api/recuperar-senha').json({ email: 'ana@igreja.com' })

    const reset = await PasswordReset.query().firstOrFail()
    reset.expiresAt = DateTime.utc().minus({ minutes: 1 })
    await reset.save()

    const confirmed = await client.post('/api/recuperar-senha/confirmar').json({
      email: 'ana@igreja.com',
      code: codes[0],
      password: 'senha-nova-8',
      passwordConfirmation: 'senha-nova-8',
    })

    confirmed.assertStatus(422)
  })

  test('e-mail desconhecido recebe a mesma frase e nenhum código', async ({ client, assert }) => {
    const asked = await client.post('/api/recuperar-senha').json({
      email: 'ninguem@igreja.com',
    })

    asked.assertStatus(200)
    asked.assertBodyContains({
      message: 'Se o e-mail existir, enviamos o código.',
    })
    assert.lengthOf(codes, 0)
  })
})
```

`withGlobalTransaction` desfaz os inserts no fim de cada teste. O banco de desenvolvimento não enche de Anas.

O teste da versão velha sobe `authVersion` direto na linha, sem passar pela troca de senha. É o mesmo efeito que outro navegador vê quando este troca a senha: o cookie ficou para trás.

O teste do código olha o corpo do HTTP, não o log. O log é para o seu olho no `npm run dev`. O teste prova que o JSON não devolveu o código.

Rode, dentro de `api`, com o Docker no ar:

```bash
node ace test
```

O teste do Lucid da Etapa 0 continua na mesma suíte. Os dois passam.

Conferência: `node ace test` verde. Se um teste de conta falhar com “relation users does not exist”, a migration do passo 3 não rodou.

---

## 13. O cliente HTTP do React

Abra [web/src/lib/api.ts](../web/src/lib/api.ts). O `getHealth` fica. Acrescente o resto no mesmo arquivo.

```ts
const apiUrl = import.meta.env.VITE_API_URL

export type HealthResponse = {
  status: 'ok'
  timezone: string
}

export type PublicUser = {
  id: string
  name: string
  email: string
  birthDate: string | null
}

export type FieldError = {
  field: string
  message: string
}

export class ApiError extends Error {
  status: number
  errors: FieldError[]

  constructor(status: number, errors: FieldError[]) {
    super(errors[0]?.message ?? 'Não foi possível concluir.')
    this.status = status
    this.errors = errors
  }
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiUrl}/health`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('A API não respondeu.')
  }

  return response.json() as Promise<HealthResponse>
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const body = (await response.json().catch(() => null)) as
    | (T & { errors?: FieldError[] })
    | null

  if (!response.ok) {
    throw new ApiError(response.status, body?.errors ?? [])
  }

  return body as T
}
```

`credentials: 'include'` em toda chamada é o que faz o navegador guardar e reenviar o `adonis-session`. Sem isso o login “funciona” e o pedido seguinte volta 401.

401 não é tratado aqui. Quem decide o redirect é a sessão da interface, no passo seguinte. Assim um formulário de login com 422 mostra o erro, e uma página interna com 401 sai para `/entrar`.

---

## 14. A sessão na interface

Crie `web/src/session.tsx`. Um contexto só: quem está dentro, e as ações que mudam isso. A página não chama `fetch` espalhado.

```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { api, ApiError, type PublicUser } from './lib/api.ts'

type SessionStatus = 'carregando' | 'anonimo' | 'dentro'

type SessionValue = {
  status: SessionStatus
  user: PublicUser | null
  refresh: () => Promise<void>
  setUser: (user: PublicUser | null) => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('carregando')
  const [user, setUserState] = useState<PublicUser | null>(null)

  async function refresh() {
    try {
      const me = await api<PublicUser>('/api/eu')
      setUserState(me)
      setStatus('dentro')
    } catch (error) {
      setUserState(null)
      setStatus('anonimo')
      if (error instanceof ApiError && error.status !== 401) {
        throw error
      }
    }
  }

  function setUser(next: PublicUser | null) {
    setUserState(next)
    setStatus(next ? 'dentro' : 'anonimo')
  }

  useEffect(() => {
    // Pergunta uma vez, ao abrir. O cookie, se existir, responde.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    void refresh()
  }, [])

  return (
    <SessionContext.Provider value={{ status, user, refresh, setUser }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) {
    throw new Error('useSession precisa ficar dentro de SessionProvider')
  }
  return value
}
```

`refresh` no carregamento pergunta `GET /api/eu`. Cookie válido: a pessoa está dentro. 401: anônima. Recarregar a página não perde a sessão, porque o cookie continua no navegador.

Crie `web/src/routes.tsx` com as duas cercas. Página interna sem sessão vai para `/entrar`. Página de entrada com sessão vai para `/ministerios`.

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from './session.tsx'

export function RequireAuth() {
  const { status } = useSession()

  if (status === 'carregando') {
    return <p className="page">Carregando…</p>
  }

  if (status === 'anonimo') {
    return <Navigate to="/entrar" replace />
  }

  return <Outlet />
}

export function GuestOnly() {
  const { status } = useSession()

  if (status === 'carregando') {
    return <p className="page">Carregando…</p>
  }

  if (status === 'dentro') {
    return <Navigate to="/ministerios" replace />
  }

  return <Outlet />
}
```

Crie `web/src/pages/HomeGate.tsx`. A rota `/` não tem tela própria.

```tsx
import { Navigate } from 'react-router-dom'
import { useSession } from '../session.tsx'

export function HomeGate() {
  const { status } = useSession()

  if (status === 'carregando') {
    return <p className="page">Carregando…</p>
  }

  if (status === 'dentro') {
    return <Navigate to="/ministerios" replace />
  }

  return <Navigate to="/entrar" replace />
}
```

---

## 15. O layout de quem está dentro

Crie `web/src/layouts/AppLayout.tsx`. Nome e sair ficam em toda página autenticada. Sair é `POST /api/sair`, que apaga a sessão neste navegador.

```tsx
import { Outlet, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'
import { useSession } from '../session.tsx'

export function AppLayout() {
  const { user, setUser } = useSession()
  const navigate = useNavigate()

  async function logout() {
    await api('/api/sair', { method: 'POST' })
    setUser(null)
    navigate('/entrar', { replace: true })
  }

  return (
    <div className="page">
      <header className="topbar">
        <span>{user?.name}</span>
        <button type="button" onClick={() => void logout()}>
          Sair
        </button>
      </header>
      <Outlet />
    </div>
  )
}
```

Crie `web/src/components/FieldErrors.tsx`. Um formulário inválido lista as mensagens do 422. Se o servidor mandou `field: 'email'`, a lista ainda aparece no alto, e o campo correspondente ganha a frase embaixo.

```tsx
import type { FieldError } from '../lib/api.ts'

export function FieldErrors({ errors }: { errors: FieldError[] }) {
  if (errors.length === 0) {
    return null
  }

  return (
    <ul className="errors">
      {errors.map((error) => (
        <li key={`${error.field}-${error.message}`}>{error.message}</li>
      ))}
    </ul>
  )
}

export function fieldMessage(errors: FieldError[], field: string) {
  return errors.find((error) => error.field === field)?.message
}
```

Crie `web/src/components/TextField.tsx` para os formulários não repetirem label, input e erro.

```tsx
export function TextField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  autoComplete,
  readOnly = false,
  message,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange?: (value: string) => void
  autoComplete?: string
  readOnly?: boolean
  message?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {message ? <small>{message}</small> : null}
    </label>
  )
}
```

`readOnly` é o e-mail do perfil. O input continua visível e não dispara `onChange`.

---

## 16. As telas

### Entrar

Crie `web/src/pages/EntrarPage.tsx`:

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError, type PublicUser } from '../lib/api.ts'
import { useSession } from '../session.tsx'

export function EntrarPage() {
  const navigate = useNavigate()
  const { setUser } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      const user = await api<PublicUser>('/api/entrar', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setUser(user)
      navigate('/ministerios', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Conta</p>
      <h1>Entrar</h1>
      <form onSubmit={(event) => void submit(event)} className="form">
        <FieldErrors errors={errors} />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          message={fieldMessage(errors, 'email')}
        />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          message={fieldMessage(errors, 'password')}
        />
        <button type="submit">Entrar</button>
      </form>
      <p>
        <Link to="/cadastrar">Criar conta</Link>
        {' · '}
        <Link to="/recuperar-senha">Esqueci a senha</Link>
      </p>
    </main>
  )
}
```

### Cadastrar

Crie `web/src/pages/CadastrarPage.tsx`:

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError, type PublicUser } from '../lib/api.ts'
import { useSession } from '../session.tsx'

export function CadastrarPage() {
  const navigate = useNavigate()
  const { setUser } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      const user = await api<PublicUser>('/api/cadastrar', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, passwordConfirmation }),
      })
      setUser(user)
      navigate('/ministerios', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Conta</p>
      <h1>Cadastrar</h1>
      <form onSubmit={(event) => void submit(event)} className="form">
        <FieldErrors errors={errors} />
        <TextField label="Nome" name="name" autoComplete="name" value={name} onChange={setName} message={fieldMessage(errors, 'name')} />
        <TextField label="E-mail" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} message={fieldMessage(errors, 'email')} />
        <TextField label="Senha" name="password" type="password" autoComplete="new-password" value={password} onChange={setPassword} message={fieldMessage(errors, 'password')} />
        <TextField label="Confirmar senha" name="passwordConfirmation" type="password" autoComplete="new-password" value={passwordConfirmation} onChange={setPasswordConfirmation} message={fieldMessage(errors, 'passwordConfirmation')} />
        <button type="submit">Criar conta</button>
      </form>
      <p>
        <Link to="/entrar">Já tenho conta</Link>
      </p>
    </main>
  )
}
```

### Esqueci a senha

Uma página, dois momentos. Primeiro o e-mail. Depois o código e a senha nova. O código não aparece na tela. Você o lê no terminal da API.

Crie `web/src/pages/RecuperarSenhaPage.tsx`:

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'

export function RecuperarSenhaPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'codigo'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function askCode(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      const body = await api<{ message: string }>('/api/recuperar-senha', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setNotice(body.message)
      setStep('codigo')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function confirm(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      await api('/api/recuperar-senha/confirmar', {
        method: 'POST',
        body: JSON.stringify({ email, code, password, passwordConfirmation }),
      })
      navigate('/entrar', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Conta</p>
      <h1>Esqueci a senha</h1>
      {notice ? <p>{notice}</p> : null}
      {step === 'email' ? (
        <form onSubmit={(event) => void askCode(event)} className="form">
          <FieldErrors errors={errors} />
          <TextField label="E-mail" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} message={fieldMessage(errors, 'email')} />
          <button type="submit">Enviar código</button>
        </form>
      ) : (
        <form onSubmit={(event) => void confirm(event)} className="form">
          <FieldErrors errors={errors} />
          <TextField label="Código" name="code" autoComplete="one-time-code" value={code} onChange={setCode} message={fieldMessage(errors, 'code')} />
          <TextField label="Senha nova" name="password" type="password" autoComplete="new-password" value={password} onChange={setPassword} message={fieldMessage(errors, 'password')} />
          <TextField label="Confirmar senha" name="passwordConfirmation" type="password" autoComplete="new-password" value={passwordConfirmation} onChange={setPasswordConfirmation} message={fieldMessage(errors, 'passwordConfirmation')} />
          <button type="submit">Salvar senha</button>
        </form>
      )}
      <p>
        <Link to="/entrar">Voltar</Link>
      </p>
    </main>
  )
}
```

### Ministérios, ainda vazio

Crie `web/src/pages/MinisteriosPage.tsx`. A Etapa 2 troca o parágrafo por uma lista. O estado vazio já tem frase, não é uma tela em branco.

```tsx
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
```

O `h1` fica dentro do `AppLayout`, que já usa a classe `page`. Não crie outro `<main className="page">` aqui, senão a margem dobra.

### Perfil

Crie `web/src/pages/PerfilPage.tsx`. E-mail somente leitura. Data de nascimento opcional. Trocar senha é outro formulário, porque exige a senha atual e não mexe no nome.

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError, type PublicUser } from '../lib/api.ts'
import { useSession } from '../session.tsx'

export function PerfilPage() {
  const { user, setUser } = useSession()
  const [name, setName] = useState(user?.name ?? '')
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '')
  const [profileErrors, setProfileErrors] = useState<FieldError[]>([])
  const [profileNotice, setProfileNotice] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<FieldError[]>([])
  const [passwordNotice, setPasswordNotice] = useState('')

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setProfileErrors([])
    setProfileNotice('')

    try {
      const updated = await api<PublicUser>('/api/perfil', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          birthDate: birthDate === '' ? null : birthDate,
        }),
      })
      setUser(updated)
      setProfileNotice('Perfil salvo.')
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    setPasswordErrors([])
    setPasswordNotice('')

    try {
      const updated = await api<PublicUser>('/api/perfil/senha', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
      })
      setUser(updated)
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setPasswordNotice('Senha atualizada.')
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordErrors(error.errors)
        return
      }
      throw error
    }
  }

  return (
    <section>
      <p className="eyebrow">Conta</p>
      <h1>Perfil</h1>

      <form onSubmit={(event) => void saveProfile(event)} className="form">
        <FieldErrors errors={profileErrors} />
        {profileNotice ? <p>{profileNotice}</p> : null}
        <TextField label="Nome" name="name" value={name} onChange={setName} message={fieldMessage(profileErrors, 'name')} />
        <TextField label="E-mail" name="email" type="email" value={user?.email ?? ''} readOnly />
        <TextField label="Data de nascimento" name="birthDate" type="date" value={birthDate} onChange={setBirthDate} message={fieldMessage(profileErrors, 'birthDate')} />
        <button type="submit">Salvar</button>
      </form>

      <form onSubmit={(event) => void savePassword(event)} className="form">
        <h2>Alterar senha</h2>
        <FieldErrors errors={passwordErrors} />
        {passwordNotice ? <p>{passwordNotice}</p> : null}
        <TextField label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={setCurrentPassword} message={fieldMessage(passwordErrors, 'currentPassword')} />
        <TextField label="Senha nova" name="password" type="password" autoComplete="new-password" value={password} onChange={setPassword} message={fieldMessage(passwordErrors, 'password')} />
        <TextField label="Confirmar senha" name="passwordConfirmation" type="password" autoComplete="new-password" value={passwordConfirmation} onChange={setPasswordConfirmation} message={fieldMessage(passwordErrors, 'passwordConfirmation')} />
        <button type="submit">Atualizar senha</button>
      </form>

      <p>
        <Link to="/ministerios">Voltar</Link>
      </p>
    </section>
  )
}
```

O input `type="date"` envia `YYYY-MM-DD` ou string vazia. Vazio vira `null` no JSON. A coluna `date` guarda o dia, sem hora.

---

## 17. Amarrar as rotas e o CSS

Substitua [web/src/App.tsx](../web/src/App.tsx):

```tsx
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
```

`SessionProvider` fica fora do roteador porque a cerca e as páginas leem o mesmo contexto. `/` decide o destino. As rotas de formulário recusam quem já entrou. As rotas de dentro recusam quem não tem cookie.

Acrescente no fim de [web/src/index.css](../web/src/index.css). O visual da Etapa 0 permanece. Isto só dá forma a formulário, erro e barra.

```css
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  font-family: system-ui, sans-serif;
}

.form {
  display: grid;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.field {
  display: grid;
  gap: 0.25rem;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
}

.field input {
  font: inherit;
  padding: 0.5rem 0.6rem;
  border: 1px solid #d6d3d1;
  border-radius: 0.25rem;
  background: white;
}

.errors {
  margin: 0;
  padding-left: 1.1rem;
  color: #9f1239;
  font-family: system-ui, sans-serif;
}

button {
  font: inherit;
  width: fit-content;
  padding: 0.5rem 0.9rem;
  border: 0;
  border-radius: 0.25rem;
  background: #1c1917;
  color: #faf7f2;
  cursor: pointer;
}

a {
  color: inherit;
}

h2 {
  font-weight: 500;
  font-size: 1.4rem;
  margin: 2rem 0 0;
}
```

Os imports locais levam `.ts` ou `.tsx`, como na Etapa 0. Sem o sufixo, o `npm run build` do Vite falha.

Conferência visual, com `npm run dev` e o Docker no ar:

1. Abra `http://localhost:5173`. Sem cookie, a barra de endereço vai para `/entrar`.
2. Cadastre `Ana` com uma senha de 8 caracteres ou mais. A tela seguinte diz “Você entrou” e o nome Ana.
3. Recarregue. Continua em `/ministerios`. O cookie segurou a sessão.
4. Abra o perfil. O e-mail não edita. Salve um nome diferente e uma data. O nome da barra muda.
5. Troque a senha informando a atual. Esta aba continua dentro.
6. Saia. `/ministerios` digitado na barra volta para `/entrar`.
7. Entre de novo. Em outro fluxo, peça o código. O terminal da API mostra `[recuperar-senha]` e seis dígitos. A tela não mostra o código. Confirme, volte para entrar, e use a senha nova.
8. Tente cadastrar o mesmo e-mail. A frase é “Este e-mail já está em uso.”
9. Erre a senha no login. A frase é “E-mail ou senha inválidos.”

No log do servidor, durante esses cliques, a senha não aparece. O que pode aparecer é o código de recuperação.

---

## 18. Conferência final

Na raiz:

```bash
npm test
npm run lint
```

Os dois passam. `npm test` inclui o Lucid da Etapa 0 e a suíte `Conta`.

O `lint` da raiz chama a API e depois o `web`. O `web/package.json` que a Etapa 0 deixou aponta o script `lint` de volta para a API, e esse segundo comando pode falhar porque não existe `web/api`. Se isso acontecer, troque só o script da raiz para `"lint": "npm run lint --prefix api"`, como a Etapa 0 já previa quando o Vite não traz ESLint próprio. Não monte um ESLint novo nesta etapa.

Marque o aceite do plano:

- Cadastro, entrada e saída funcionam no navegador.
- A senha não aparece em log, banco nem JSON. No banco, a coluna `password` começa com o prefixo do scrypt, não com o texto que você digitou.
- Código vencido não troca a senha. Código usado uma vez não serve de novo. E-mail inexistente recebe a mesma frase e nenhum código no log.
- `GET /api/eu` e a rota `/ministerios`, sem cookie, não mostram o perfil. A página vai para `/entrar`.
- Dois cadastros com o mesmo e-mail, em qualquer maiúscula, não criam duas linhas.

O que esta etapa evitou, e que a próxima não deve reabrir:

- Sessão no `localStorage`, ou token no JSON.
- Senha em texto, ou hash feito duas vezes.
- Rota que acredita num `userId` mandado pelo navegador. O id sai de `auth.getUserOrFail()`.
