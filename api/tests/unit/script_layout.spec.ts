import { test } from '@japa/runner'
import {
  DEFAULT_SCRIPT_TITLES,
  layoutFromParts,
  layoutFromRows,
  summedDuration,
  type ScriptSong,
} from '#schedules/script_layout'

function song(title: string): ScriptSong {
  return { title, notes: 'nota', durationSeconds: null, effectiveKey: 'G' }
}

const oracao = { title: 'Oração', notes: '', durationSeconds: 60, source: 'manual' as const }
const palavra = {
  title: 'Palavra',
  notes: 'estudo',
  durationSeconds: null,
  source: 'manual' as const,
}
const louvor = { title: 'Louvor', notes: '', durationSeconds: null, source: 'songs' as const }

test.group('Layout do roteiro', () => {
  test('reordenar e remover música não desloca oração nem palavra', ({ assert }) => {
    const titles = (rows: ReturnType<typeof layoutFromRows>) => rows.map((item) => item.title)

    assert.deepEqual(titles(layoutFromRows([oracao, louvor, palavra], [song('A'), song('B')])), [
      'Oração',
      'A',
      'B',
      'Palavra',
    ])
    assert.deepEqual(titles(layoutFromRows([oracao, louvor, palavra], [song('B'), song('A')])), [
      'Oração',
      'B',
      'A',
      'Palavra',
    ])
    assert.deepEqual(titles(layoutFromRows([oracao, louvor, palavra], [song('A')])), [
      'Oração',
      'A',
      'Palavra',
    ])
    assert.equal(layoutFromRows([oracao, louvor, palavra], [song('A')])[2].notes, 'estudo')
  })

  test('sem bloco as músicas entram no fim e o modelo conserva as músicas', ({ assert }) => {
    const appended = layoutFromRows([oracao, palavra], [song('A')])
    assert.deepEqual(
      appended.map((item) => item.title),
      ['Oração', 'Palavra', 'A']
    )

    const applied = layoutFromParts(
      DEFAULT_SCRIPT_TITLES.map((title) => ({ title, notes: '', durationSeconds: null })),
      [song('A'), song('B')]
    )
    assert.deepEqual(
      applied.map((item) => item.title),
      ['Abertura', 'Oração', 'Boas-vindas', 'A', 'B', 'Palavra', 'Oferta', 'Avisos', 'Encerramento']
    )
    assert.isTrue(
      applied
        .filter((item) => item.title === 'A' || item.title === 'B')
        .every((item) => item.locked)
    )
  })

  test('duração vazia fica de fora da soma', ({ assert }) => {
    assert.equal(
      summedDuration([{ durationSeconds: 60 }, { durationSeconds: null }, { durationSeconds: 30 }]),
      90
    )
    assert.isNull(summedDuration([{ durationSeconds: null }, { durationSeconds: null }]))
  })
})
