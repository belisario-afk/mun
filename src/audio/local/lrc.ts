export type LrcLine = { t: number; text: string };

export function parseLRC(text: string): LrcLine[] {
  const lines = text.split(/\r?\n/);
  const out: LrcLine[] = [];
  const timeRe = /\[(\d{2}):(\d{2})(\.\d{2,3})?\]/g;
  for (const ln of lines) {
    let match: RegExpExecArray | null;
    let stripped = ln;
    const tags: { t: number; text: string }[] = [];
    while ((match = timeRe.exec(ln)) !== null) {
      const mm = Number(match[1]);
      const ss = Number(match[2]);
      const ff = match[3] ? Number(match[3]) : 0;
      const t = mm * 60 + ss + ff;
      tags.push({ t, text: '' });
      stripped = ln.slice(match.index + match[0].length);
    }
    if (tags.length) {
      for (const tag of tags) {
        out.push({ t: tag.t, text: stripped.trim() });
      }
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

export function currentLrcLine(lines: LrcLine[], timeSec: number): string | null {
  if (!lines.length) return null;
  let cur: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (timeSec + 0.05 >= line.t) cur = line.text;
    else break;
  }
  return cur;
}