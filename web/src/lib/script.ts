import type { ScriptItemView } from './schedule.ts'

const SONG_BLOCK = 'Louvor'

export function manualsForSave(items: ScriptItemView[]) {
  const manuals: Array<{ title: string; notes: string; durationSeconds: number | null }> = []
  let index = 0
  while (index < items.length) {
    const item = items[index]
    if (item.locked) {
      manuals.push({ title: SONG_BLOCK, notes: '', durationSeconds: null })
      while (index < items.length && items[index].locked) {
        index += 1
      }
      continue
    }
    manuals.push({
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds,
    })
    index += 1
  }
  return manuals
}
