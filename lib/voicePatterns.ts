// Shared wake word patterns and utilities — used by both VoiceListener and useAgentVoice

export const WAKE_PATTERNS = [
  'hey northreport', 'hey safe pulse', 'hey safe post', 'hey safepost',
  'hey pulse', 'a pulse', 'hey poles', 'hey polls',
  'hey safe polls', 'a northreport', 'hey save pulse', 'hey staples',
  'hey stables', 'hey safe', 'hey saves', 'hey safety', 'hey staple',
  'hey say pulse', 'hey say post',
  "he's safe both", "he's safe", "he is safe", "safe both",
  "say pulse", "safe pulse", "safe post", "safe poles",
  "say poles", "say post", "say posts", "hey state", "hey stay",
].sort((a, b) => b.length - a.length);

export function stripWakeWords(text: string): string {
  let result = text.toLowerCase();
  for (const pattern of WAKE_PATTERNS) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), ' ').trim();
  }
  return result.replace(/\s+/g, ' ').trim();
}

export function containsWakeWord(text: string): boolean {
  const lower = text.toLowerCase();
  return WAKE_PATTERNS.some((pattern) => lower.includes(pattern));
}
