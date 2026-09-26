import { useEffect, useState } from 'react'
import { FieldErrors } from './FieldErrors.tsx'
import { TextField } from './TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { GenerationDefaults, Proposal } from '../lib/generation.ts'
import type { MemberItem, MinistryFunctionItem } from '../lib/ministry.ts'

type VacancyDraft = { functionId: string; quantity: string }

type CurrentPerson = {
  membershipId: string
  name: string
  functions: Array<{ id: string }>
}

const PEOPLE = [
  ['balanced', 'Equilibrada'],
  ['most_active', 'Mais ativos'],
  ['least_active', 'Menos ativos'],
  ['weekday', 'Padrão do dia'],
] as const

const SONGS = [
  ['rotation', 'Rodízio'],
  ['most_played', 'Mais tocadas'],
  ['balanced', 'Equilibrada'],
] as const

function vacanciesFromTeam(people: CurrentPerson[]) {
  const counts = new Map<string, number>()
  for (const member of people) {
    for (const item of member.functions) {
      counts.set(item.id, (counts.get(item.id) ?? 0) + 1)
    }
  }
  return [...counts].map(([functionId, quantity]) => ({
    functionId,
    quantity: String(quantity),
  }))
}

function blankNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  return Number(trimmed)
}

export function SuggestPanel({
  ministryId,
  scheduleId,
  functions,
  team,
  onAccept,
}: {
  ministryId: string
  scheduleId: string
  functions: MinistryFunctionItem[]
  team: CurrentPerson[]
  onAccept: (proposal: Proposal) => void
}) {
  const [ready, setReady] = useState(false)
  const [peopleStrategy, setPeopleStrategy] = useState('balanced')
  const [historyMonths, setHistoryMonths] = useState('3')
  const [minGapDays, setMinGapDays] = useState('')
  const [preferFewerAbsences, setPreferFewerAbsences] = useState(false)
  const [allowMultipleFunctions, setAllowMultipleFunctions] = useState(false)
  const [unavailability, setUnavailability] = useState('respect')
  const [conflict, setConflict] = useState('skip')
  const [songStrategy, setSongStrategy] = useState('rotation')
  const [songCount, setSongCount] = useState('4')
  const [minSongGapDays, setMinSongGapDays] = useState('')
  const [includeUnplayed, setIncludeUnplayed] = useState(true)
  const [vacancies, setVacancies] = useState<VacancyDraft[]>([])
  const [fixedIds, setFixedIds] = useState<string[]>([])
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const [members, setMembers] = useState<MemberItem[]>([])
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [review, setReview] = useState(false)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      api<GenerationDefaults>(`/api/ministerios/${ministryId}/geracao`),
      api<{ members: MemberItem[] }>(`/api/ministerios/${ministryId}/membros`),
    ])
      .then(([defaults, body]) => {
        if (cancelled) {
          return
        }
        setPeopleStrategy(defaults.peopleStrategy)
        setHistoryMonths(String(defaults.historyMonths))
        setMinGapDays(defaults.minGapDays === null ? '' : String(defaults.minGapDays))
        setPreferFewerAbsences(defaults.preferFewerAbsences)
        setAllowMultipleFunctions(defaults.allowMultipleFunctions)
        setUnavailability(defaults.unavailability)
        setConflict(defaults.conflict)
        setSongStrategy(defaults.songStrategy)
        setSongCount(String(defaults.songCount))
        setMinSongGapDays(defaults.minSongGapDays === null ? '' : String(defaults.minSongGapDays))
        setIncludeUnplayed(defaults.includeUnplayed)
        const fromTeam = vacanciesFromTeam(team)
        if (fromTeam.length > 0) {
          setVacancies(fromTeam)
        } else if (defaults.vacancies.length > 0) {
          setVacancies(
            defaults.vacancies.map((item) => ({
              functionId: item.functionId,
              quantity: String(item.quantity),
            }))
          )
        } else if (functions[0]) {
          setVacancies([{ functionId: functions[0].id, quantity: '1' }])
        }
        setFixedIds(team.map((member) => member.membershipId))
        setMembers(body.members)
        setReady(true)
      })
      .catch((error: unknown) => {
        if (!cancelled && error instanceof ApiError) {
          setErrors(error.errors)
          setNotice(error.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ministryId, team, functions])

  function payload(includePeople: boolean) {
    return {
      peopleStrategy,
      historyMonths: Number(historyMonths),
      minGapDays: blankNumber(minGapDays),
      preferFewerAbsences,
      allowMultipleFunctions,
      unavailability,
      conflict,
      songStrategy,
      songCount: Number(songCount),
      minSongGapDays: blankNumber(minSongGapDays),
      includeUnplayed,
      vacancies: vacancies
        .filter((item) => item.functionId)
        .map((item) => ({
          functionId: item.functionId,
          quantity: Number(item.quantity),
        })),
      ...(includePeople
        ? {
            fixed: team
              .filter((member) => fixedIds.includes(member.membershipId))
              .map((member) => ({
                membershipId: member.membershipId,
                functionIds: member.functions.map((item) => item.id),
              })),
            excludedMembershipIds: excludedIds,
          }
        : {}),
    }
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice('')
    setReview(false)
    try {
      const body = await api<Proposal>(
        `/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`,
        { method: 'POST', body: JSON.stringify(payload(true)) }
      )
      setProposal(body)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  async function saveDefaults() {
    setErrors([])
    setNotice('')
    try {
      await api(`/api/ministerios/${ministryId}/geracao`, {
        method: 'PUT',
        body: JSON.stringify(payload(false)),
      })
      setNotice('Padrão salvo.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  const nextIds = new Set(
    proposal?.vacancies.flatMap((vacancy) => vacancy.people.map((person) => person.membershipId)) ??
      []
  )
  const leaving = team.filter((member) => !nextIds.has(member.membershipId))
  const staying = team.filter((member) => nextIds.has(member.membershipId))
  const entering = [...nextIds]
    .filter((id) => !team.some((member) => member.membershipId === id))
    .map(
      (id) =>
        proposal?.vacancies
          .flatMap((vacancy) => vacancy.people)
          .find((person) => person.membershipId === id)?.name ?? id
    )

  return (
    <form className="form" onSubmit={(event) => void generate(event)}>
      <h2>Sugerir equipe e músicas</h2>
      <FieldErrors errors={errors} />
      {notice ? <p className="notice">{notice}</p> : null}
      {ready ? (
        <>
          <fieldset className="checks">
            <legend>Vagas</legend>
            {vacancies.map((vacancy, index) => (
              <div className="row" key={`${vacancy.functionId}-${index}`}>
                <select
                  aria-label="Função"
                  value={vacancy.functionId}
                  onChange={(event) =>
                    setVacancies((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, functionId: event.target.value } : item
                      )
                    )
                  }
                >
                  {functions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Quantidade"
                  type="number"
                  min={0}
                  value={vacancy.quantity}
                  onChange={(event) =>
                    setVacancies((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, quantity: event.target.value } : item
                      )
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setVacancies((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  Tirar vaga
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setVacancies((current) => [
                  ...current,
                  { functionId: functions[0]?.id ?? '', quantity: '1' },
                ])
              }
            >
              Adicionar vaga
            </button>
          </fieldset>
          <label className="field">
            <span>Pessoas</span>
            <select
              aria-label="Pessoas"
              value={peopleStrategy}
              onChange={(event) => setPeopleStrategy(event.target.value)}
            >
              {PEOPLE.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Meses de histórico"
            name="historyMonths"
            type="number"
            value={historyMonths}
            onChange={setHistoryMonths}
          />
          <TextField
            label="Intervalo mínimo entre escalas"
            name="minGapDays"
            type="number"
            value={minGapDays}
            onChange={setMinGapDays}
          />
          <label>
            <input
              type="checkbox"
              checked={preferFewerAbsences}
              onChange={(event) => setPreferFewerAbsences(event.target.checked)}
            />{' '}
            Priorizar quem falta menos
          </label>
          <label>
            <input
              type="checkbox"
              checked={allowMultipleFunctions}
              onChange={(event) => setAllowMultipleFunctions(event.target.checked)}
            />{' '}
            Mais de uma função
          </label>
          <label className="field">
            <span>Indisponibilidade</span>
            <select
              aria-label="Indisponibilidade"
              value={unavailability}
              onChange={(event) => setUnavailability(event.target.value)}
            >
              <option value="respect">Respeitar</option>
              <option value="warn">Avisar</option>
            </select>
          </label>
          <label className="field">
            <span>Conflito</span>
            <select
              aria-label="Conflito"
              value={conflict}
              onChange={(event) => setConflict(event.target.value)}
            >
              <option value="skip">Não sugerir</option>
              <option value="warn">Avisar</option>
              <option value="ignore">Ignorar</option>
            </select>
          </label>
          {team.length > 0 ? (
            <fieldset className="checks">
              <legend>Fixos</legend>
              {team.map((member) => (
                <label key={member.membershipId}>
                  <input
                    type="checkbox"
                    checked={fixedIds.includes(member.membershipId)}
                    onChange={(event) =>
                      setFixedIds((current) =>
                        event.target.checked
                          ? [...current, member.membershipId]
                          : current.filter((id) => id !== member.membershipId)
                      )
                    }
                  />{' '}
                  {member.name}
                </label>
              ))}
            </fieldset>
          ) : null}
          <fieldset className="checks">
            <legend>Não sugerir</legend>
            {members.map((member) => (
              <label key={member.membershipId}>
                <input
                  type="checkbox"
                  checked={excludedIds.includes(member.membershipId)}
                  onChange={(event) =>
                    setExcludedIds((current) =>
                      event.target.checked
                        ? [...current, member.membershipId]
                        : current.filter((id) => id !== member.membershipId)
                    )
                  }
                />{' '}
                {member.name}
              </label>
            ))}
          </fieldset>
          <label className="field">
            <span>Músicas</span>
            <select
              aria-label="Músicas"
              value={songStrategy}
              onChange={(event) => setSongStrategy(event.target.value)}
            >
              {SONGS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Quantidade de músicas"
            name="songCount"
            type="number"
            value={songCount}
            onChange={setSongCount}
          />
          <TextField
            label="Intervalo mínimo para repetir música"
            name="minSongGapDays"
            type="number"
            value={minSongGapDays}
            onChange={setMinSongGapDays}
          />
          <label>
            <input
              type="checkbox"
              checked={includeUnplayed}
              onChange={(event) => setIncludeUnplayed(event.target.checked)}
            />{' '}
            Incluir novas
          </label>
          <div className="row">
            <button type="submit">{proposal ? 'Gerar outra vez' : 'Gerar'}</button>
            <button type="button" onClick={() => void saveDefaults()}>
              Salvar padrão
            </button>
          </div>
        </>
      ) : null}
      {proposal ? (
        <div>
          {proposal.warnings.map((warning) => (
            <p className="notice" key={warning}>
              {warning}
            </p>
          ))}
          {proposal.vacancies.map((vacancy) => (
            <div key={vacancy.functionId}>
              <h3>
                {vacancy.functionName} ({vacancy.people.length})
              </h3>
              {vacancy.people.length === 0 ? <p>Ninguém para esta vaga.</p> : null}
              <ul>
                {vacancy.people.map((person) => (
                  <li key={`${vacancy.functionId}-${person.membershipId}`}>
                    {person.name} — {person.reason}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <h3>Músicas</h3>
          {proposal.songs.length === 0 ? <p>Nenhuma música sugerida.</p> : null}
          <ul>
            {proposal.songs.map((song) => (
              <li key={song.songId}>
                {song.title} — {song.reason}
              </li>
            ))}
          </ul>
          {review ? (
            <div>
              <h3>O que será substituído</h3>
              <p>
                Quem sai:{' '}
                {leaving.length > 0 ? leaving.map((member) => member.name).join(', ') : 'ninguém'}.
              </p>
              <p>
                Quem fica:{' '}
                {staying.length > 0 ? staying.map((member) => member.name).join(', ') : 'ninguém'}.
              </p>
              <p>Quem entra: {entering.length > 0 ? entering.join(', ') : 'ninguém'}.</p>
              <p>
                Músicas:{' '}
                {proposal.songs.length > 0
                  ? proposal.songs.map((song) => song.title).join(', ')
                  : 'a lista fica vazia'}
                .
              </p>
              <div className="row">
                <button type="button" onClick={() => onAccept(proposal)}>
                  Confirmar
                </button>
                <button type="button" onClick={() => setReview(false)}>
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setReview(true)}>
              Usar esta sugestão
            </button>
          )}
        </div>
      ) : null}
    </form>
  )
}
