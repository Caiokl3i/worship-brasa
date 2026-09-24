# Etapa 0 — faça você mesmo

Siga na ordem. Cada passo termina com uma conferência. Se a conferência falhar, pare e corrija antes do próximo.

Você está na pasta do repositório (`worship-brasa`), que já tem `docs/`. Os comandos abaixo rodam nessa pasta.

O que esta etapa produz:

- `api/` — AdonisJS, Lucid e PostgreSQL
- `web/` — React com Vite
- Postgres local no Docker
- Uma migration vazia, de propósito
- Um teste que prova que o Lucid conecta
- Uma página inicial que pergunta à API se ela está no ar

O que esta etapa não produz: conta, ministério, música, escala. Isso começa na Etapa 1.

---



## 0. O mapa mental

Duas pastas, dois processos.

```
navegador  →  web (React, porta 5173)  →  api (Adonis, porta 3333)  →  Postgres
```

O React desenha a tela e chama a API. O Adonis decide. O Lucid fala com o banco. O React nunca importa o Lucid.

Dentro da API, a partir de agora, a divisão é esta:


| Pasta                 | Responsabilidade                                                      |
| --------------------- | --------------------------------------------------------------------- |
| `app/controllers`     | Recebe o pedido HTTP e devolve a resposta. Não coloca regra aqui.     |
| `app/services`        | A regra. Hoje só existe “a API e o banco estão no ar?”.               |
| `app/models`          | Tabelas do Lucid. Continua vazia nesta etapa.                         |
| `database/migrations` | Histórico do banco. Uma migration vazia prova que o comando funciona. |


---



## 1. Conferir Node e Docker

No terminal:

```bash
node -v
docker --version
docker compose version
```

O AdonisJS 6 pede Node 20 ou mais novo. Se o Docker não abrir, inicie o Docker Desktop e rode de novo.

---



## 2. Criar a API

Ainda na raiz do repositório:

```bash
npm init adonisjs@latest api -- --kit=api --db=postgres --auth-guard=session
```

O que cada bandeira faz:

- `api` é o nome da pasta.
- `--kit=api` cria um servidor JSON, sem HTML do Adonis. A tela fica no React.
- `--db=postgres` instala e configura o Lucid para PostgreSQL.
- `--auth-guard=session` instala sessão em cookie. O login de verdade é a Etapa 1. Aqui só deixamos o cookie `httpOnly` pronto.

Se o comando perguntar alguma coisa que as bandeiras não cobriram, aceite ESLint. Não troque o banco para SQLite.

Quando terminar, existe a pasta `api/` com `package.json`, `adonisrc.ts`, `config/database.ts` e `.env`.

Abra `api/config/session.ts` e confira o cookie. O trecho importante é este:

```ts
cookie: {
  path: '/',
  httpOnly: true,
  secure: app.inProduction,
  sameSite: 'lax',
},
```

`httpOnly: true` impede o JavaScript da página de ler o cookie da sessão. `secure` só liga em produção, porque no seu computador a API ainda é `http://localhost`. `sameSite: 'lax'` serve para o navegador mandar o cookie do `localhost:5173` para o `localhost:3333`.

Se `age` estiver `'2h'`, troque para `'30 days'`. A Etapa 1 usa essa duração.

---



## 3. Criar o React

Na raiz do repositório:

```bash
npm create vite@latest web -- --template react-ts
```

Isso cria `web/` com React, TypeScript e Vite. Entre na pasta e instale o roteador:

```bash
cd web
npm install
npm install react-router-dom
cd ..
```

O roteador entra agora, com uma rota só (`/`), para o id do ministério morar na URL quando a Etapa 2 chegar. Não vamos guardar “ministério atual” só na memória do navegador.

---



## 4. Subir o PostgreSQL

Crie `docker-compose.yml` na raiz:

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: worship
      POSTGRES_PASSWORD: worship
      POSTGRES_DB: worship_brasa
      TZ: UTC
      PGTZ: UTC
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

`TZ` e `PGTZ` em UTC fazem o relógio do banco ficar em UTC. O instante continua sendo `timestamptz`. Quem formata para `America/Sao_Paulo` é a aplicação, não o Postgres. Assim um culto de domingo à noite não escorrega para sábado.

Suba o banco:

```bash
docker compose up -d
docker compose ps
```

O serviço `postgres` precisa estar `running`.

---



## 5. Apontar o Adonis para esse banco

Abra `api/.env`. Ajuste estas linhas para os mesmos valores do Docker:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=worship
DB_PASSWORD=worship
DB_DATABASE=worship_brasa
```

`SESSION_DRIVER` deve ser `cookie`. Se não existir, acrescente:

```env
SESSION_DRIVER=cookie
```

Copie esse arquivo para o exemplo, que pode ir para o git. A senha `worship` é só do Postgres da sua máquina.

```bash
cp api/.env api/.env.example
```

Abra `api/.env.example` e apague o valor de `APP_KEY`. Deixe a chave vazia:

```env
APP_KEY=
```

O `APP_KEY` do seu `.env` foi gerado na instalação e cifra o cookie. Ele não entra no git. Quem clonar o projeto gera outro com `node ace generate:key`.

Confira `api/.gitignore`. Ele já ignora `.env`. Rode na raiz:

```bash
git status
```

`api/.env` não pode aparecer como arquivo para commit. `api/.env.example` pode.

---



## 6. O fuso padrão e o formato de erro

Dois arquivos pequenos, para as próximas etapas não inventarem cada uma um jeito.

Crie `api/app/constants/timezone.ts`:

```ts
/**
 * Fuso usado enquanto o ministério ainda não existe.
 * Na Etapa 2 cada ministério ganha o próprio fuso.
 * O banco continua gravando o instante em UTC.
 */
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo'
```

Crie `api/app/types/form_error.ts`:

```ts
/**
 * Erro de formulário combinado para o projeto inteiro.
 * A Etapa 1 passa a devolver esta forma quando a senha ou o e-mail falham.
 */
export type FieldError = {
  field: string
  message: string
}

export type FormErrorResponse = {
  errors: FieldError[]
}
```

O Adonis importa pastas por apelido (`#services/...`). Pastas novas precisam do apelido no `package.json` da API. Abra `api/package.json` e, dentro de `"imports"`, acrescente estas duas linhas junto das outras:

```json
"#constants/*": "./app/constants/*.js",
"#types/*": "./app/types/*.js"
```

O `.js` no apelido é o jeito do Adonis, mesmo o arquivo sendo `.ts`. O compilador resolve.

---



## 7. A primeira regra: health

O controller não pergunta nada ao banco. Ele chama o service. O service usa o Lucid.

Crie `api/app/services/health_service.ts`:

```ts
import db from '@adonisjs/lucid/services/db'
import { DEFAULT_TIMEZONE } from '#constants/timezone'

export default class HealthService {
  /**
   * Prova que a API subiu e que o Lucid alcança o Postgres.
   * Se o banco estiver desligado, esta chamada falha e a tela mostra erro.
   */
  async check() {
    await db.rawQuery('select 1')

    return {
      status: 'ok' as const,
      timezone: DEFAULT_TIMEZONE,
    }
  }
}
```

`db.rawQuery('select 1')` não lê tabela nenhuma. Só abre uma conexão e executa um SQL mínimo. `as const` faz o TypeScript tratar `status` como o texto fixo `'ok'`, não como uma string qualquer.

Crie `api/app/controllers/health_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'
import HealthService from '#services/health_service'

export default class HealthController {
  async show({ response }: HttpContext) {
    const health = await new HealthService().check()

    return response.ok(health)
  }
}
```

`response.ok` responde HTTP 200 com JSON. O controller não conhece SQL.

Abra `api/start/routes.ts`. O arquivo gerado já importa o router. Deixe a rota assim:

```ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HealthController = () => import('#controllers/health_controller')

router.get('/health', [HealthController, 'show'])

router
  .group(() => {})
  .prefix('/api')
  .use(middleware.auth())
```

Leia com calma:

- `() => import(...)` carrega o controller só quando a rota é chamada.
- `GET /health` é pública. A página inicial precisa dela antes de existir login.
- O grupo `/api` com `middleware.auth()` está vazio de propósito. Na Etapa 1 as rotas de conta logada entram aí e já nascem protegidas. Não coloque `/health` dentro desse grupo.

Se o `kernel` gerado exportar o middleware com outro nome, abra `api/start/kernel.ts` e use o nome que estiver no `router.named`. No starter com sessão, `middleware.auth` é o usual. Se o TypeScript reclamar que `auth` não existe, olhe o objeto exportado em `kernel.ts` e use a chave que o arquivo realmente tem.

---



## 8. CORS, para o React poder chamar a API

O navegador bloqueia uma página em `localhost:5173` que chama `localhost:3333`, a menos que a API autorize. Com cookie, a autorização tem de ser a origem exata. `*` não combina com credencial.

Abra `api/config/cors.ts` e deixe o `defineConfig` assim:

```ts
const corsConfig = defineConfig({
  enabled: true,
  origin: ['http://localhost:5173'],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
```

`credentials: true` faz a API aceitar o cookie que o React vai mandar com `credentials: 'include'`.

---



## 9. Migration vazia

Na pasta `api`:

```bash
cd api
node ace make:migration foundation
```

O Ace cria `database/migrations/<timestamp>_create_foundations_table.ts` ou nome parecido. Abra esse arquivo e substitua o conteúdo por uma migration que não cria tabela:

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // A Etapa 0 só prova que o Ace aplica migration.
    // User, Ministry e o resto nascem nas etapas seguintes.
  }

  async down() {}
}
```

Por que vazia: criar `users` agora seria começar a Etapa 1 cedo, e uma tabela sem uso vira coluna errada depois.

Aplique:

```bash
node ace migration:run
```

A saída lista essa migration como executada. O Postgres grava o nome dela na tabela `adonis_schema`. Rodar de novo não executa a segunda vez.

---



## 10. O teste do Lucid

Crie `api/tests/functional/database.spec.ts`:

```ts
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

test.group('Banco', () => {
  test('o lucid conecta no postgres', async ({ assert }) => {
    const result = await db.rawQuery('select 1 as ok')

    assert.equal(Number(result.rows[0].ok), 1)
  })
})
```

`Number(...)` existe porque o driver devolve `ok` às vezes como texto `"1"`. O teste aceita os dois.

Rode, ainda dentro de `api`:

```bash
node ace test
```

O teste passa só com o Docker no ar e o `.env` apontando para ele. Este teste usa o banco de desenvolvimento. Um `select 1` não altera dado.

---



## 11. A página inicial

Crie `web/.env`:

```env
VITE_API_URL=http://localhost:3333
```

Crie `web/.env.example` com o mesmo conteúdo. Variável que começa com `VITE_` é a única que o Vite entrega ao navegador. Não coloque senha aí.

No `web/.gitignore` gerado, `.env` já está ignorado. O `.env.example` não deve estar.

Este Vite não cria `web/src/vite-env.d.ts`. O `web/tsconfig.app.json` já tem `"types": ["vite/client"]`, e o `include` é a pasta `src`. Crie o arquivo `web/src/vite-env.d.ts` com só o nome da variável. A interface se junta à do Vite. Não declare `ImportMeta` de novo.

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
}
```

Crie `web/src/lib/api.ts`:

```ts
const apiUrl = import.meta.env.VITE_API_URL

export type HealthResponse = {
  status: 'ok'
  timezone: string
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
```

`credentials: 'include'` pede ao navegador para enviar o cookie da sessão. Nesta etapa a rota `/health` ainda não cria sessão, mas o hábito fica certo para o login.

Crie `web/src/pages/HomePage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { getHealth } from '../lib/api.ts'

type ApiStatus = 'carregando' | 'ok' | 'erro'

export function HomePage() {
  const [status, setStatus] = useState<ApiStatus>('carregando')
  const [timezone, setTimezone] = useState('')

  useEffect(() => {
    getHealth()
      .then((health) => {
        setStatus('ok')
        setTimezone(health.timezone)
      })
      .catch(() => {
        setStatus('erro')
      })
  }, [])

  return (
    <main className="page">
      <p className="eyebrow">Etapa 0</p>
      <h1>Worship Brasa</h1>
      <p>A fundação do sistema está no ar.</p>
      <p>
        API: <strong>{status}</strong>
        {timezone ? ` · fuso padrão ${timezone}` : null}
      </p>
    </main>
  )
}
```

Substitua `web/src/App.tsx` por:

```tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Uma rota só. Na Etapa 2 entra `/m/:ministryId`, lendo o id da URL.

Substitua `web/src/index.css` por um CSS curto, só para a página não ficar colada no canto:

```css
:root {
  font-family: Georgia, 'Times New Roman', serif;
  color: #1c1917;
  background: #faf7f2;
}

body {
  margin: 0;
}

.page {
  max-width: 36rem;
  margin: 4rem auto;
  padding: 0 1.5rem;
}

.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: system-ui, sans-serif;
  font-size: 0.75rem;
}

h1 {
  font-weight: 500;
  font-size: 3rem;
  margin: 0.25rem 0 1rem;
}
```

Não mexa em `web/src/main.tsx`. Ele já importa `./index.css` e `./App.tsx`. O `import './App.css'` está no `App.tsx` antigo. Ao substituir esse arquivo pelo código acima, o CSS do template deixa de ser usado. Apague `web/src/App.css`.

O `tsconfig.app.json` tem `allowImportingTsExtensions`. Por isso os imports locais levam o sufixo `.ts` ou `.tsx`, como o `main.tsx` já faz com `./App.tsx`. Sem o sufixo, o `npm run build` do Vite falha.

---



## 12. Scripts na raiz

Crie `package.json` na raiz do repositório:

```json
{
  "name": "worship-brasa",
  "private": true,
  "scripts": {
    "dev": "concurrently -n api,web -c blue,green \"npm run dev --prefix api\" \"npm run dev --prefix web\"",
    "test": "npm test --prefix api",
    "lint": "npm run lint --prefix api && npm run lint --prefix web",
    "migrate": "npm exec --prefix api ace migration:run"
  },
  "devDependencies": {
    "concurrently": "^9.2.1"
  }
}
```

Na raiz:

```bash
npm install
```

`npm run dev` sobe os dois processos. `concurrently` só junta os terminais. A API continua sendo Adonis e a tela continua sendo Vite.

Se `web/package.json` não tiver o script `"lint"`, o template do Vite não trouxe ESLint. Nesse caso, troque o script da raiz para lintar só a API:

```json
"lint": "npm run lint --prefix api"
```

Não invente um ESLint do zero nesta etapa.

---



## 13. README da raiz

Crie `README.md` na raiz:

```md
# Worship Brasa

Sistema do ministério. A primeira versão é web: React na pasta `web`, AdonisJS na pasta `api`, PostgreSQL no Docker.

## Subir em uma máquina nova

1. Tenha Node 20+ e Docker.
2. `docker compose up -d`
3. `cp api/.env.example api/.env` e preencha `APP_KEY` com `cd api && node ace generate:key`
4. `cp web/.env.example web/.env`
5. `npm install` na raiz, em `api` e em `web`
6. `npm run migrate`
7. `npm run dev`
8. Abra http://localhost:5173

## Conferir

- `npm test` conecta no banco
- `npm run lint` passa

A senha do `.env.example` é só do Postgres local.
```

---

