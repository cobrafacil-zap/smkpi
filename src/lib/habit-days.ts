import type { Achievement } from "./types";

/**
 * Dias da semana em que cada hábito deve ser cumprido.
 *
 * Persistência: um registro em `goal_achievements` com a chave estruturada
 * `habito-dias:<habitId>:<dias>` (mesma estratégia do Foco de hoje: sincroniza
 * com o Supabase sem alterar o schema e não aparece como conquista).
 *
 * Dias: 1 = segunda … 7 = domingo.
 * Sem registro = qualquer dia pode ser marcado (comportamento antigo).
 */

const PREFIX = "habito-dias:";

export interface HabitSchedule {
  habitId: string;
  days: number[];
}

export function isHabitDaysKey(key: string): boolean {
  return key.startsWith(PREFIX);
}

export function decodeHabitDays(achievements: Achievement[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  achievements.forEach((a) => {
    if (!isHabitDaysKey(a.key)) return;
    const parts = a.key.slice(PREFIX.length).split(":");
    const habitId = parts[0];
    const days = (parts[1] || "")
      .split(",")
      .map((n) => Number(n))
      .filter((n) => n >= 1 && n <= 7)
      .sort((x, y) => x - y);
    if (habitId && days.length) map.set(habitId, days);
  });
  return map;
}

export function encodeHabitDays(habitId: string, days: number[]): Achievement {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  return {
    id: `hd_${habitId}`,
    userId: "",
    key: `${PREFIX}${habitId}:${sorted.join(",")}`,
    tier: 0,
    unlockedAt: new Date().toISOString(),
  };
}

/** Quantos dias por semana o hábito exige (dias escolhidos ou meta avulsa). */
export function weeklyTarget(
  habit: { id: string; targetPerWeek: number },
  schedules: Map<string, number[]>,
): number {
  const days = schedules.get(habit.id);
  return days && days.length ? days.length : habit.targetPerWeek;
}

/** O dia (1..7) de uma data ISO. */
export function isoWeekDay(date: Date): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}
