import type ScriptTemplate from '#models/script_template'

export function toScriptTemplate(template: ScriptTemplate) {
  return {
    id: template.id,
    name: template.name,
    items: template.items.map((item) => ({
      id: item.id,
      position: item.position,
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds,
    })),
  }
}
