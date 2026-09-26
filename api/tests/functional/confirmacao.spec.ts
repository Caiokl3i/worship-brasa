import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import { intervalsOverlap, localDates } from '#schedules/conflicts'

const password = 'senha-segura'

async function register(client: ApiClient, name: string, email: string) {
  const response = await client.post('/api/cadastrar').json({
    name,
    email,
    password,
    passwordConfirmation: password,
  })
  response.assertStatus(201)
}

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/entrar').json({ email, password })
  response.assertStatus(200)
}

async function createMinistry(client: ApiClient, name: string) {
  const response = await client.post('/api/ministerios').json({ name, functions: ['Vocal'] })
  response.assertStatus(201)
  return response.body().id as string
}

async function approve(client: ApiClient, ministryId: string, names: string[]) {
  const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
  invite.assertStatus(201)
  const code = invite.body().invite.code as string
  const ids: Record<string, string> = {}

  for (const name of names) {
    await register(client, name, `${name.toLowerCase()}@igreja.com`)
    const entered = await client.post('/api/convites/entrar').json({ code })
    entered.assertStatus(200)
    ids[name] = entered.body().membershipId as string
  }

  await login(client, 'ana@igreja.com')
  for (const membershipId of Object.values(ids)) {
    const approved = await client.post(
      `/api/ministerios/${ministryId}/pedidos/${membershipId}/aprovar`
    )
    approved.assertStatus(204)
  }

  return ids
}

async function publish(
  client: ApiClient,
  ministryId: string,
  title: string,
  startsAt: string,
  endsAt: string | null,
  membershipIds: string[],
  functionId: string,
  confirmationRequired = true
) {
  const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
    title,
    startsAt,
    endsAt,
    confirmationRequired,
  })
  created.assertStatus(201)
  const scheduleId = created.body().id as string
  const published = await client
    .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/publicar`)
    .json({
      version: 1,
      title,
      startsAt,
      endsAt,
      notes: '',
      dressCode: '',
      confirmationRequired,
      participants: membershipIds.map((membershipId) => ({
        membershipId,
        functionIds: [functionId],
      })),
      songs: [],
    })
  published.assertStatus(200)
  return published
}

test.group('Confirmação e indisponibilidade', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('intervalo que encosta conflita e o que termina um minuto antes não', ({ assert }) => {
    const zone = 'America/Sao_Paulo'
    const start = DateTime.fromISO('2027-06-01T19:00', { zone })
    const end = DateTime.fromISO('2027-06-01T21:00', { zone })
    const touching = DateTime.fromISO('2027-06-01T21:00', { zone })
    const before = DateTime.fromISO('2027-06-01T20:59', { zone })
    const overlap = DateTime.fromISO('2027-06-01T20:00', { zone })

    assert.isTrue(intervalsOverlap(start, end, touching, touching.plus({ hours: 1 })))
    assert.isTrue(intervalsOverlap(start, end, overlap, overlap.plus({ hours: 2 })))
    assert.isFalse(intervalsOverlap(start, before, touching, touching.plus({ hours: 1 })))
    assert.deepEqual(localDates(DateTime.fromISO('2026-10-05T02:00:00.000Z'), null, zone), [
      '2026-10-04',
    ])
  })

  test('membro confirma, a resposta permanece e some se sair da escala', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const ids = await approve(client, ministryId, ['Bia'])
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string

    const published = await publish(
      client,
      ministryId,
      'Culto de domingo',
      '2027-06-07T19:00',
      '2027-06-07T21:00',
      [anaId, ids.Bia],
      vocalId
    )
    const scheduleId = published.body().id as string

    await login(client, 'bia@igreja.com')
    const confirmed = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/confirmacao`)
      .json({ confirmation: 'confirmed' })
    confirmed.assertStatus(200)
    const bia = confirmed.body().participants.find((item: { name: string }) => item.name === 'Bia')
    assert.equal(bia.confirmation, 'confirmed')
    assert.isNull(
      confirmed.body().participants.find((item: { name: string }) => item.name === 'Ana')
        .confirmation
    )

    await login(client, 'ana@igreja.com')
    const opened = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    opened.assertStatus(200)
    assert.equal(
      opened.body().participants.find((item: { name: string }) => item.name === 'Bia').confirmation,
      'confirmed'
    )

    const onBehalf = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/confirmacao`)
      .json({ confirmation: 'declined', membershipId: anaId })
    onBehalf.assertStatus(200)
    assert.equal(
      onBehalf.body().participants.find((item: { name: string }) => item.name === 'Ana')
        .confirmation,
      'declined'
    )

    const draft = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/rascunho`)
      .json({
        version: opened.body().version,
        title: 'Culto de domingo',
        startsAt: '2027-06-07T19:00',
        endsAt: '2027-06-07T21:00',
        notes: '',
        dressCode: '',
        participants: [
          { membershipId: anaId, functionIds: [vocalId] },
          { membershipId: ids.Bia, functionIds: [vocalId] },
        ],
        songs: [],
      })
    draft.assertStatus(200)
    assert.equal(draft.body().status, 'draft')
    assert.equal(
      draft.body().participants.find((item: { name: string }) => item.name === 'Bia').confirmation,
      'confirmed'
    )

    const again = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/publicar`)
      .json({
        version: draft.body().version,
        title: 'Culto de domingo',
        startsAt: '2027-06-07T19:00',
        endsAt: '2027-06-07T21:00',
        notes: '',
        dressCode: '',
        participants: [
          { membershipId: anaId, functionIds: [vocalId] },
          { membershipId: ids.Bia, functionIds: [vocalId] },
        ],
        songs: [],
      })
    again.assertStatus(200)
    assert.equal(
      again.body().participants.find((item: { name: string }) => item.name === 'Bia').confirmation,
      'confirmed'
    )

    const removed = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
      .json({
        version: again.body().version,
        title: 'Culto de domingo',
        startsAt: '2027-06-07T19:00',
        endsAt: '2027-06-07T21:00',
        notes: '',
        dressCode: '',
        participants: [{ membershipId: anaId, functionIds: [vocalId] }],
        songs: [],
      })
    removed.assertStatus(200)
    assert.isUndefined(
      removed.body().participants.find((item: { name: string }) => item.name === 'Bia')
    )
  })

  test('depois do término a confirmação falha e a falta não apaga a resposta', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const ids = await approve(client, ministryId, ['Bia'])
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string

    const future = await publish(
      client,
      ministryId,
      'Culto futuro',
      '2027-08-01T19:00',
      '2027-08-01T21:00',
      [anaId],
      vocalId
    )
    const early = await client
      .post(`/api/ministerios/${ministryId}/escalas/${future.body().id}/falta`)
      .json({ membershipId: anaId, absent: true })
    early.assertStatus(422)
    early.assertBodyContains({
      errors: [{ message: 'A falta só pode ser marcada depois que a escala já passou.' }],
    })

    const past = await publish(
      client,
      ministryId,
      'Culto antigo',
      '2020-01-05T19:00',
      '2020-01-05T21:00',
      [anaId, ids.Bia],
      vocalId
    )
    const scheduleId = past.body().id as string
    await login(client, 'bia@igreja.com')
    const late = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/confirmacao`)
      .json({ confirmation: 'confirmed' })
    late.assertStatus(422)
    late.assertBodyContains({
      errors: [{ message: 'Não dá mais para confirmar. O horário desta escala já passou.' }],
    })

    await login(client, 'ana@igreja.com')
    const marked = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/falta`)
      .json({ membershipId: ids.Bia, absent: true })
    marked.assertStatus(200)
    const bia = marked.body().participants.find((item: { name: string }) => item.name === 'Bia')
    assert.isTrue(bia.absent)
    assert.equal(bia.confirmation, 'pending')

    await login(client, 'bia@igreja.com')
    const mine = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    const self = mine.body().participants.find((item: { name: string }) => item.name === 'Bia')
    const other = mine.body().participants.find((item: { name: string }) => item.name === 'Ana')
    assert.isTrue(self.absent)
    assert.isNull(other.absent)

    await login(client, 'ana@igreja.com')
    const optional = await publish(
      client,
      ministryId,
      'Sem pedido',
      '2027-09-01T19:00',
      '2027-09-01T21:00',
      [anaId],
      vocalId,
      false
    )
    await login(client, 'ana@igreja.com')
    const skipped = await client
      .post(`/api/ministerios/${ministryId}/escalas/${optional.body().id}/confirmacao`)
      .json({ confirmation: 'confirmed' })
    skipped.assertStatus(422)
    skipped.assertBodyContains({
      errors: [{ message: 'Esta escala não pede confirmação.' }],
    })
  })

  test('a descrição não aparece para outro membro e o domingo à noite no Brasil continua domingo', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const ids = await approve(client, ministryId, ['Bia'])
    const created = await client.post(`/api/ministerios/${ministryId}/indisponibilidades`).json({
      membershipId: ids.Bia,
      startsOn: '2026-10-04',
      endsOn: '2026-10-04',
      description: 'férias',
    })
    created.assertStatus(201)

    const monday = await client.post(`/api/ministerios/${ministryId}/indisponibilidades`).json({
      startsOn: '2026-10-05',
      endsOn: '2026-10-05',
      description: 'consulta',
    })
    monday.assertStatus(201)

    await login(client, 'bia@igreja.com')
    const list = await client.get(`/api/ministerios/${ministryId}/indisponibilidades`)
    list.assertStatus(200)
    assert.notInclude(JSON.stringify(list.body()), 'consulta')
    assert.include(
      list.body().unavailabilities.map((item: { description: string | null }) => item.description),
      'férias'
    )
    const hidden = list
      .body()
      .unavailabilities.find((item: { description: string | null }) => item.description === null)
    assert.exists(hidden)

    const own = await client.post(`/api/ministerios/${ministryId}/indisponibilidades`).json({
      membershipId: ids.Ana ?? '00000000-0000-4000-8000-000000000001',
      startsOn: '2026-11-01',
      endsOn: '2026-11-02',
      description: 'viagem',
    })
    own.assertStatus(403)

    await login(client, 'ana@igreja.com')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members.find((item: { name: string }) => item.name === 'Ana')
      .membershipId as string
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string
    const night = await publish(
      client,
      ministryId,
      'Culto de domingo à noite',
      '2026-10-05T02:00:00.000Z',
      '2026-10-05T02:30:00.000Z',
      [ids.Bia, anaId],
      vocalId
    )
    const bia = night
      .body()
      .participants.find((item: { membershipId: string }) => item.membershipId === ids.Bia)
    assert.isTrue(bia.conflicts.some((item: { kind: string }) => item.kind === 'unavailability'))
    const ana = night
      .body()
      .participants.find((item: { membershipId: string }) => item.membershipId === anaId)
    assert.isFalse(ana.conflicts.some((item: { kind: string }) => item.kind === 'unavailability'))
  })

  test('aviso não impede salvar e remover indisponíveis deixa quem só tem outra escala', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const ids = await approve(client, ministryId, ['Bia', 'Caio'])
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string

    await client.post(`/api/ministerios/${ministryId}/indisponibilidades`).json({
      membershipId: ids.Bia,
      startsOn: '2027-06-07',
      endsOn: '2027-06-07',
      description: 'férias',
    })

    const other = await publish(
      client,
      ministryId,
      'Ensaio',
      '2027-06-07T19:00',
      '2027-06-07T20:00',
      [ids.Caio],
      vocalId
    )

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2027-06-07T19:00',
      endsAt: '2027-06-07T21:00',
    })
    const scheduleId = created.body().id as string
    const checked = await client.post(`/api/ministerios/${ministryId}/conflitos`).json({
      startsAt: '2027-06-07T19:00',
      endsAt: '2027-06-07T21:00',
      ignoreScheduleId: scheduleId,
      membershipIds: [ids.Bia, ids.Caio, anaId],
    })
    checked.assertStatus(200)
    const bia = checked
      .body()
      .results.find((item: { membershipId: string }) => item.membershipId === ids.Bia)
    const caio = checked
      .body()
      .results.find((item: { membershipId: string }) => item.membershipId === ids.Caio)
    assert.isTrue(bia.conflicts.some((item: { kind: string }) => item.kind === 'unavailability'))
    assert.isTrue(caio.conflicts.some((item: { kind: string }) => item.kind === 'schedule'))

    const saved = await client.patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`).json({
      version: 1,
      title: 'Culto',
      startsAt: '2027-06-07T19:00',
      endsAt: '2027-06-07T21:00',
      notes: '',
      dressCode: '',
      participants: [
        { membershipId: ids.Bia, functionIds: [vocalId] },
        { membershipId: ids.Caio, functionIds: [vocalId] },
        { membershipId: anaId, functionIds: [vocalId] },
      ],
      songs: [],
    })
    saved.assertStatus(200)
    assert.lengthOf(saved.body().participants, 3)

    const cleared = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/remover-indisponiveis`)
      .json({ version: saved.body().version })
    cleared.assertStatus(200)
    const names = cleared.body().participants.map((item: { name: string }) => item.name)
    assert.notInclude(names, 'Bia')
    assert.include(names, 'Caio')
    assert.include(names, 'Ana')

    const both = await client.get(`/api/ministerios/${ministryId}/escalas/${other.body().id}`)
    const warned = both.body().participants.find((item: { name: string }) => item.name === 'Caio')
    assert.isTrue(
      warned.conflicts.some(
        (item: { kind: string; title?: string }) =>
          item.kind === 'schedule' && item.title === 'Culto'
      )
    )
    const reverse = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    assert.isTrue(
      reverse
        .body()
        .participants.find((item: { name: string }) => item.name === 'Caio')
        .conflicts.some((item: { title?: string }) => item.title === 'Ensaio')
    )
  })

  test('rascunho e escala excluída não avisam o membro, e o gestor vê o rascunho', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const ids = await approve(client, ministryId, ['Bia'])
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string

    const visible = await publish(
      client,
      ministryId,
      'Culto',
      '2027-06-07T19:00',
      '2027-06-07T21:00',
      [anaId, ids.Bia],
      vocalId
    )
    const draft = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Ensaio secreto',
      startsAt: '2027-06-07T19:30',
      endsAt: '2027-06-07T20:30',
    })
    await client.patch(`/api/ministerios/${ministryId}/escalas/${draft.body().id}`).json({
      version: 1,
      title: 'Ensaio secreto',
      startsAt: '2027-06-07T19:30',
      endsAt: '2027-06-07T20:30',
      notes: '',
      dressCode: '',
      participants: [{ membershipId: anaId, functionIds: [vocalId] }],
      songs: [],
    })

    const touching = await publish(
      client,
      ministryId,
      'Culto encostado',
      '2027-06-14T21:00',
      '2027-06-14T22:00',
      [anaId],
      vocalId
    )
    await publish(
      client,
      ministryId,
      'Culto anterior',
      '2027-06-14T19:00',
      '2027-06-14T21:00',
      [anaId],
      vocalId
    )
    const gap = await publish(
      client,
      ministryId,
      'Culto folgado',
      '2027-06-21T21:00',
      '2027-06-21T22:00',
      [anaId],
      vocalId
    )
    await publish(
      client,
      ministryId,
      'Culto que acaba antes',
      '2027-06-21T19:00',
      '2027-06-21T20:59',
      [anaId],
      vocalId
    )
    const removed = await publish(
      client,
      ministryId,
      'Culto apagado',
      '2027-06-07T19:00',
      '2027-06-07T21:00',
      [anaId],
      vocalId
    )
    await client.delete(`/api/ministerios/${ministryId}/escalas/${removed.body().id}`)

    const manager = await client.get(`/api/ministerios/${ministryId}/escalas/${visible.body().id}`)
    assert.isTrue(
      manager
        .body()
        .participants.find((item: { name: string }) => item.name === 'Ana')
        .conflicts.some((item: { title?: string }) => item.title === 'Ensaio secreto')
    )
    assert.notInclude(
      JSON.stringify(
        manager.body().participants.find((item: { name: string }) => item.name === 'Bia').conflicts
      ),
      'Ensaio secreto'
    )

    await login(client, 'bia@igreja.com')
    const member = await client.get(`/api/ministerios/${ministryId}/escalas/${visible.body().id}`)
    member.assertStatus(200)
    assert.notInclude(JSON.stringify(member.body()), 'Ensaio secreto')
    assert.notInclude(JSON.stringify(member.body()), 'Culto apagado')

    await login(client, 'ana@igreja.com')
    const touched = await client.get(`/api/ministerios/${ministryId}/escalas/${touching.body().id}`)
    assert.isTrue(
      touched
        .body()
        .participants[0].conflicts.some(
          (item: { title?: string }) => item.title === 'Culto anterior'
        )
    )
    const loose = await client.get(`/api/ministerios/${ministryId}/escalas/${gap.body().id}`)
    assert.isFalse(
      loose
        .body()
        .participants[0].conflicts.some(
          (item: { title?: string }) => item.title === 'Culto que acaba antes'
        )
    )
  })
})
