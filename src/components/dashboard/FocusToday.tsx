"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Crosshair, Link2, Plus, X } from "lucide-react";
import { useStore } from "@/lib/data/store";
import { focusItemsOf, lastFocusDate, type FocusItem } from "@/lib/focus";
import { cn, toISODate, uid } from "@/lib/utils";

/**
 * Foco de hoje — as 3 prioridades do dia.
 * O que ficou pendente em dias anteriores é carregado para hoje (não zera).
 */
export function FocusToday() {
  const { state, saveFocusItems } = useStore();
  const today = toISODate();
  const rolled = useRef(false);

  const items = useMemo(
    () => focusItemsOf(state.achievements, today),
    [state.achievements, today],
  );

  // carrega o que ficou pendente ontem (uma única vez por visita)
  useEffect(() => {
    if (rolled.current) return;
    rolled.current = true;
    if (items.length > 0) return;
    const prevDate = lastFocusDate(state.achievements, today);
    if (!prevDate) return;
    const pending = focusItemsOf(state.achievements, prevDate).filter((i) => !i.done);
    if (!pending.length) return;
    saveFocusItems(
      pending.map((p, idx) => ({ ...p, id: uid(), date: today, position: idx, done: false, doneAt: null })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = items.filter((i) => i.done).length;

  const save = (next: FocusItem[]) => saveFocusItems(next);

  const toggle = (item: FocusItem) => {
    save(
      items.map((i) =>
        i.id === item.id ? { ...i, done: !i.done, doneAt: !i.done ? new Date().toISOString() : null } : i,
      ),
    );
  };

  const remove = (item: FocusItem) => save(items.filter((i) => i.id !== item.id));

  const add = (position: number, title: string, goalId: string | null) => {
    const clean = title.trim();
    if (!clean) return;
    save([
      ...items,
      { id: uid(), date: today, position, title: clean, goalId, done: false, doneAt: null },
    ]);
  };

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-iris-soft text-iris-dark">
            <Crosshair className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-semibold text-ink">Foco de hoje</h2>
            <p className="text-[11.5px] text-ink-faint">
              As 3 prioridades que fazem a diferença hoje
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-pill px-2.5 py-1 text-[11px] font-bold tabular",
            doneCount === 3
              ? "bg-jade-soft text-jade-dark"
              : doneCount > 0
                ? "bg-iris-soft text-iris-dark"
                : "bg-ink/5 text-ink-faint",
          )}
        >
          {doneCount} de 3 concluídas
        </span>
      </div>

      <ol className="mt-3 space-y-2">
        {[0, 1, 2].map((position) => {
          const item = items.find((i) => i.position === position);
          return (
            <li key={position}>
              {item ? (
                <FocusRow item={item} onToggle={() => toggle(item)} onRemove={() => remove(item)} />
              ) : (
                <FocusComposer
                  position={position}
                  goals={state.goals.filter((g) => g.status === "ativa")}
                  onAdd={(title, goalId) => add(position, title, goalId)}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function FocusRow({
  item,
  onToggle,
  onRemove,
}: {
  item: FocusItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { state } = useStore();
  const goal = item.goalId ? state.goals.find((g) => g.id === item.goalId) : null;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
        item.done ? "border-jade/35 bg-jade-soft/40" : "border-line hover:bg-ink/[0.02]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition-all",
          item.done ? "border-jade bg-jade text-white" : "border-line-strong text-transparent hover:border-iris",
        )}
        aria-label={item.done ? "Marcar como pendente" : "Concluir prioridade"}
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] font-medium leading-snug",
            item.done ? "text-ink-faint line-through" : "text-ink",
          )}
        >
          {item.title}
        </p>
        {goal ? (
          <Link
            href={`/metas/${goal.id}`}
            className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-iris hover:underline"
          >
            <Link2 className="h-2.5 w-2.5" />
            {goal.title}
          </Link>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-rose-soft hover:text-rose"
        aria-label="Remover prioridade"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FocusComposer({
  position,
  goals,
  onAdd,
}: {
  position: number;
  goals: Array<{ id: string; title: string }>;
  onAdd: (title: string, goalId: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState("");

  const submit = () => {
    const text = title.trim() || goals.find((g) => g.id === goalId)?.title || "";
    if (!text.trim()) return;
    onAdd(text, goalId || null);
    setTitle("");
    setGoalId("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink/5 text-[10px] font-bold text-ink-faint">
        {position + 1}
      </span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={`Prioridade ${position + 1} — o que precisa avançar hoje?`}
        className="h-9 min-w-[160px] flex-1 rounded-lg border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-iris focus:outline-none focus:ring-2 focus:ring-iris/10"
      />
      <select
        value={goalId}
        onChange={(e) => setGoalId(e.target.value)}
        className="h-9 max-w-[170px] rounded-lg border border-line bg-surface px-2 text-[12px] text-ink-soft focus:border-iris focus:outline-none"
        aria-label="Vincular a uma meta"
      >
        <option value="">sem meta</option>
        {goals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={submit}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-iris text-white transition-colors hover:bg-iris-dark"
        aria-label="Adicionar prioridade"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
