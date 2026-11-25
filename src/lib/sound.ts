/** Tono suave para los sondeos (440 Hz, 0,3 s, volumen bajo). No hace nada si no hay audio. */
export function playChime(): void {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 440
    gain.gain.value = 0.1
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
    osc.onended = () => ctx.close()
  } catch {
    // Sin audio disponible.
  }
}

/** Vibración breve donde el navegador la soporte (no en iOS). */
export function vibrate(): void {
  try {
    navigator.vibrate?.(200)
  } catch {
    // Sin vibración.
  }
}
