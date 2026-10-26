"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Flame,
  Link2,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import { currentStreak } from "@/lib/achievements";
import { currentWeekRange } from "@/lib/progress";
import { CATEGORY_PALETTE } from "@/lib/constants";
import type { Habit } from "@/lib/types";
import { addDays, cn, toISODate } from "@/lib/utils";

const WEEK_LETTER = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function HabitosPage() {
  const { state, addHabit, updateHabit, deleteHabit, toggleHabitDay } = useStore();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("check");
  const [color, setColor] = useState(CATEGORY_PALETTE[0].color);
  const [goalId, setGoalId] = useState("");
  const [targetPerWeek, setTargetPerWeek] = useState(5);

  const today = new Date();
  const todayIso = toISODate(today);
  const { start: weekStart } = currentWeekRange(today);

  /** 7 dias da semana atual, com o de hoje destacado. */
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const logsByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    state.habitLogs.forEach((log) => {
      if (!map.has(log.habitId)) map.set(log.habitId, new Set());
      map.get(log.habitId)!.add(log.logDate);
    });
    return map;
  }, [state.habitLogs]);

  const streak = useMemo(() => currentStreak(state, today), [state, today]);
  const doneToday = state.habits.filter((h) =>
    logsByHabit.get(h.id)?.has(todayIso),
  ).length;

  const openForm = (habit?: Habit) => {
    if (habit) {
      setEditing(habit);
      setTitle(habit.title);
      setIcon(habit.icon);
      setColor(habit.color);
      setGoalId(habit.goalId ?? "");
      setTargetPerWeek(habit.targetPerWeek);
    } else {
      setEditing(null);
      setTitle("");
      setIcon("check");
      setColor(CATEGORY_PALETTE[state.habits.length % CATEGORY_PALETTE.length].color);
      setGoalId("");
      setTargetPerWeek(5);
    }
    setFormOpen(true);
  };

  const submit = () => {
    if (!title.trim()) {
      toast("Dê um nome ao hábito.", "error");
      return;
    }
    const payload = { title, icon, color, goalId: goalId || null, targetPerWeek };
    if (editing) {
      updateHabit(editing.id, payload);
      toast("Hábito atualizado.");
    } else {
      addHabit(payload);
      toast("Hábito criado!");
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Resumo do dia — só o essencial */}
      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              Hoje
            </p>
            <p className="font-display text-xl font-bold tabular text-ink">
              {doneToday} de {state.habits.length} feitos
            </p>
          </div>

          <ProgressBar
            value={state.habits.length ? (doneToday / state.habits.length) * 100 : 0}
            className="min-w-[160px] flex-1"
            height="h-2"
          />

          <div className="flex items-center gap-2 text-[13px]">
            <Flame className="h-4 w-4 text-amber" />
            <span className="font-semibold text-ink-soft">
              {streak} {streak === 1 ? "dia" : "dias"} de sequência
            </span>
          </div>

          <Button
            leadingIcon={<Plus className="h-4 w-4" />}
            onClick={() => openForm()}
            className="ml-auto"
          >
            Novo hábito
          </Button>
        </div>
      </section>

      {state.habits.length === 0 ? (
        <EmptyState
          icon={<Repeat2 className="h-5 w-5" />}
          title="Nenhum hábito ainda"
          description="Crie hábitos como “Beber 2L de água” ou “Treinar” e marque os dias em que cumpriu."
          action={
            <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => openForm()}>
              Criar hábito
            </Button>
          }
        />
      ) : (
        <section className="space-y-3">
          {state.habits.map((habit) => {
            const logs = logsByHabit.get(habit.id) ?? new Set<string>();
            const markedToday = logs.has(todayIso);
            const weekCount = weekDays.filter((d) => logs.has(toISODate(d))).length;
            const goal = state.goals.find((g) => g.id === habit.goalId);

            return (
              <article
                key={habit.id}
                className={cn(
                  "rounded-card border bg-surface p-4 shadow-card transition-colors sm:p-5",
                  markedToday ? "border-jade/40" : "border-line",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                    style={{ background: habit.color }}
                  >
                    <Icon name={habit.icon} className="h-5 w-5" />
                  </span>

                  <div className="min-w-[180px] flex-1">
                    <h3 className="font-display text-[15px] font-semibold leading-snug text-ink">
                      {habit.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-faint">
                      <span>
                        {weekCount} de {habit.targetPerWeek} esta semana
                      </span>
                      {goal ? (
                        <Link
                          href={`/metas/${goal.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-iris hover:underline"
                        >
                          <Link2 className="h-3 w-3" />
                          {goal.title}
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {/* dias da semana — clique para marcar/desmarcar */}
                  <div className="flex items-center gap-1.5">
                    {weekDays.map((date, i) => {
                      const iso = toISODate(date);
                      const done = logs.has(iso);
                      const future = date.getTime() > today.getTime();
                      const isToday = iso === todayIso;
                      return (
                        <button
                          key={iso}
                          disabled={future}
                          onClick={() => toggleHabitDay(habit.id, iso)}
                          title={`${WEEK_LETTER[i]} · ${date.getDate()}/${date.getMonth() + 1}`}
                          className={cn(
                            "flex h-12 w-11 flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-semibold transition-all",
                            done
                              ? "border-transparent text-white"
                              : future
                                ? "cursor-not-allowed border-line/60 text-ink-faint/40"
                                : "border-line text-ink-faint hover:border-iris/50 hover:text-ink",
                            isToday && !done && "ring-2 ring-iris/40",
                          )}
                          style={done ? { background: habit.color } : undefined}
                        >
                          <span className="text-[9px] uppercase tracking-wide opacity-80">
                            {WEEK_LETTER[i]}
                          </span>
                          <span className="tabular leading-none">{date.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ação principal */}
                  <Button
                    variant={markedToday ? "secondary" : "primary"}
                    leadingIcon={<Check className="h-4 w-4" />}
                    onClick={() => toggleHabitDay(habit.id, todayIso)}
                    className="min-w-[132px]"
                  >
                    {markedToday ? "Feito hoje ✓" : "Marcar hoje"}
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openForm(habit)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
                      aria-label="Editar hábito"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        deleteHabit(habit.id);
                        toast("Hábito removido.", "info");
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-rose-soft hover:text-rose"
                      aria-label="Excluir hábito"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <p className="text-[12px] text-ink-faint">
        Toque nos dias da semana para corrigir registros passados. Os dias futuros ficam
        desativados até chegarem.
      </p>

      {/* Modal de criar/editar hábito */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar hábito" : "Novo hábito"}
        description="Rotinas que você repete para sustentar suas metas."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>{editing ? "Salvar" : "Criar hábito"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nome do hábito" htmlFor="habit-title">
            <Input
              id="habit-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Beber 2L de água"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vezes por semana" htmlFor="habit-target">
              <Input
                id="habit-target"
                type="number"
                min={1}
                max={7}
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(Number(e.target.value))}
              />
            </Field>
            <Field label="Meta relacionada" optional>
              <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
                <option value="">Nenhuma</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Cor">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PALETTE.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setColor(c.color)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c.color ? "border-ink scale-110" : "border-transparent hover:scale-110",
                  )}
                  style={{ background: c.color }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </Field>

          <Field label="Ícone">
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-ink/[0.02] p-2.5">
              {ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg transition-all",
                    icon === name
                      ? "bg-iris text-white"
                      : "text-ink-faint hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  <Icon name={name} className="h-[17px] w-[17px]" />
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
