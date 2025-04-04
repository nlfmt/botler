/** takes a number of seconds and returns a duration string */
export function duration(s: number) {
  s = Math.round(s)
  const h = Math.floor(s / 3600)
  s -= h * 3600
  const m = Math.floor(s / 60)
  s -= m * 60
  return (h > 0 ? `${h}h ` : "") + (m > 0 ? `${m}m ` : "") + `${s}s`
}
