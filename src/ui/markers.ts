/** Color de marcador por tipo de actividad (ver tokens --marker-* en index.css). */
export type Marker = 'read' | 'attention' | 'memory' | 'writing' | 'progress' | 'program' | 'neutral'

export const MARKER_BG: Record<Marker, string> = {
  read: 'bg-marker-read',
  attention: 'bg-marker-attention',
  memory: 'bg-marker-memory',
  writing: 'bg-marker-writing',
  progress: 'bg-marker-progress',
  program: 'bg-accent text-on-accent',
  neutral: 'bg-hover',
}
