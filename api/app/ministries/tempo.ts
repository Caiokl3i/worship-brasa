const RESET_AFTER_MS = 2000

export function intervalsFromTaps(times: number[], resetAfterMs = RESET_AFTER_MS) {
  const intervals: number[] = []
  for (let index = 1; index < times.length; index += 1) {
    const gap = times[index] - times[index - 1]
    if (gap > resetAfterMs) {
      intervals.length = 0
      continue
    }
    intervals.push(gap)
  }
  return intervals
}

export function bpmFromIntervals(intervalsMs: number[]) {
  if (intervalsMs.length === 0) {
    return null
  }
  const average = intervalsMs.reduce((sum, gap) => sum + gap, 0) / intervalsMs.length
  if (average <= 0) {
    return null
  }
  const bpm = Math.round(60000 / average)
  if (bpm < 1 || bpm > 400) {
    return null
  }
  return bpm
}
