# Worship Brasa

Sistema do ministério. A primeira versão é web: React na pasta `web`, AdonisJS na pasta `api`, PostgreSQL no Docker.

## Subir em uma máquina nova

1. Tenha Node 24+ e Docker.
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