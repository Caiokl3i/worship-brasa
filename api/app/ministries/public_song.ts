import type Classification from '#models/classification'
import type Folder from '#models/folder'
import type Song from '#models/song'

export function toFolder(folder: Folder) {
  return {
    id: folder.id,
    name: folder.name,
  }
}

export function toClassification(classification: Classification) {
  return {
    id: classification.id,
    name: classification.name,
    description: classification.description,
    archived: classification.archivedAt !== null,
  }
}

export function toSongSummary(song: Song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    bpm: song.bpm,
    durationSeconds: song.durationSeconds,
    defaultKey: song.defaultKey,
    folder: song.folder ? toFolder(song.folder) : null,
    classification: song.classification ? toClassification(song.classification) : null,
  }
}

export function toSongDetail(song: Song) {
  return {
    ...toSongSummary(song),
    versions: song.versions.map((version) => ({
      id: version.id,
      name: version.name,
      key: version.key,
    })),
    links: song.links.map((link) => ({
      id: link.id,
      versionId: link.versionId,
      kind: link.kind,
      label: link.label,
      url: link.url,
    })),
  }
}
