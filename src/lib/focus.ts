import type { Achievement } from "./types";

/**
 * Foco de hoje (3 prioridades diárias).
 *
 * Persistência: os itens são gravados em `goal_achievements` com uma chave
 * estruturada (prefixo "foco:"). Motivo: sincroniza com o Supabase usando o
 * schema atual, sem precisar de nova tabela, e fica invisível na tela de
 * conquistas (que lista apenas as medalhas do catálogo).
 *
 * tier 1 = item concluído · tier 0 = pendente
 * unlocked_at = quando foi concluído (ou criado)
 */

const PREFIX = "foco:";

export interface FocusItem {
  /** id do registro (achievement id) */
  id: string;
  /** dia do foco (yyyy-MM-dd) */
  date: string;
  /** 1ª, 2ª e 3ª prioridade */
  position: number;
  title: string;
  goalId: string | null;
  done: boolean;
  doneAt: string | null;
}

interface Payload {
  d: string;
  p: number;
  t: string;
  g: string | null;
}

function encodePayload(payload: Payload): string {
  const json = JSON.stringify(payload);
  return PREFIX + b64encode(json);
}

export function decodeFocusItem(a: Achievement): FocusItem | null {
  if (!a.key.startsWith(PREFIX)) return null;
  try {
    const json = b64decode(a.key.slice(PREFIX.length));
    const p = JSON.parse(json) as Payload;
    return {
      id: a.id,
      date: p.d,
      position: p.p,
      title: p.t,
      goalId: p.g,
      done: a.tier >= 1,
      doneAt: a.tier >= 1 ? a.unlockedAt : null,
    };
  } catch {
    return null;
  }
}

export function encodeFocusItem(item: FocusItem): Achievement {
  return {
    id: item.id,
    userId: "",
    key: encodePayload({ d: item.date, p: item.position, t: item.title, g: item.goalId }),
    tier: item.done ? 1 : 0,
    unlockedAt: item.doneAt ?? item.done ? (item.doneAt ?? new Date().toISOString()) : new Date().toISOString(),
  };
}

export function isFocusKey(key: string): boolean {
  return key.startsWith(PREFIX);
}

/** Itens de foco de uma data específica, ordenados pela prioridade. */
export function focusItemsOf(achievements: Achievement[], date: string): FocusItem[] {
  return achievements
    .map(decodeFocusItem)
    .filter((x): x is FocusItem => x !== null && x.date === date)
    .sort((a, b) => a.position - b.position);
}

/** Último dia que teve itens de foco (para carregar o que ficou pendente). */
export function lastFocusDate(achievements: Achievement[], today: string): string | null {
  const dates = achievements
    .map(decodeFocusItem)
    .filter((x): x is FocusItem => x !== null)
    .map((x) => x.date)
    .filter((d) => d < today);
  return dates.length ? dates.sort().reverse()[0] : null;
}

/* base64 seguro para unicode */
function b64encode(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64decode(text: string): string {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
