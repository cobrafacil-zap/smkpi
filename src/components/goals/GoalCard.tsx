"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, Check, MoreVertical, Pencil, Trash2, CheckCircle2, Link2, Plus, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import { CADENCE_LABEL, PRIORITY_LABEL, PRIORITY_TONE } from "@/lib/constants";
import { DEADLINE_TONE_CLASS } from "@/lib/progress";
import type { GoalView } from "@/lib/selectors";
import { cn, formatDate, formatMetric } from "@/lib/utils";
import { GoalFormModal } from "./GoalFormModal";

const VISIBLE_STEPS = 6;

export function GoalCard({
  view,
  onOpenProgress,
  compact = false,
}: {
  view: GoalView;
  onOpenProgress?: (view: GoalView) => void;
  compact?: boolean;
}) {
  const { state, deleteGoal, toggleStep } = useStore();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const { goal, breakdown, deadline, category } = view;
  const parent = state.goals.find((g) => g.id === goal.parentGoalId);
  const orderedSteps = [...view.steps].sort((a, b) => a.position - b.position);
  const doneSteps = orderedSteps.filter((s) => s.done).length;
  const isLate = deadline.tone === "late";

  return (
    <>
      <article
        className={cn(
          "group relative flex flex-col rounded-card border bg-surface p-4 shadow-card transition-all duration-300",
          "hover:-translate-y-0.5 hover:shadow-raised",
          isLate ? "border-rose/35" : "border-line",
          goal.status === "concluida" && "opacity-90",
        )}
      >
        {/* cabeçalho compacto: ícone + título + % */}
        <div className="flex items-start gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-sm"
            style={{ background: category?.color ?? "#4F46E5" }}
          >
            <Icon name={goal.icon} className="h-[18px] w-[18px]" />
          </span>

          <div className="min-w-0 flex-1">
            <Link href={`/metas/${goal.id}`} className="block">
              <h3
                className={cn(
                  "truncate text-[14.5px] font-semibold leading-snug text-ink transition-colors group-hover:text-iris",
                  goal.status === "concluida" && "line-through decoration-ink-faint/50",
                )}
              >
                {goal.title}
              </h3>
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-semibold">
              <span
                className="rounded-pill px-1.5 py-0.5"
                style={{ background: `${category?.color ?? "#4F46E5"}1a`, color: category?.color ?? "#4F46E5" }}
              >
                {category?.name ?? "Sem categoria"}
              </span>
              <span className={cn("rounded-pill px-1.5 py-0.5", PRIORITY_TONE[goal.priority])}>
                {PRIORITY_LABEL[goal.priority]}
              </span>
              <span className="rounded-pill bg-ink/5 px-1.5 py-0.5 text-ink-faint">
                {CADENCE_LABEL[goal.cadence]}
              </span>
              {goal.status === "concluida" ? (
                <Badge tone="success" icon={<CheckCircle2 className="h-2.5 w-2.5" />}>
                  Concluída
                </Badge>
              ) : goal.status === "pausada" ? (
                <Badge tone="neutral" icon={<PauseCircle className="h-2.5 w-2.5" />}>
                  Pausada
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="font-display text-[17px] font-bold tabular leading-none text-iris">
              {Math.round(breakdown.total)}%
            </span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
                aria-label="Ações"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen ? (
                <div
                  className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-xl border border-line bg-surface shadow-float animate-scale-in"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-ink-soft transition-colors hover:bg-ink/5"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-rose transition-colors hover:bg-rose-soft"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* barra de progresso: a área principal do card */}
        <div className="mt-2.5">
          <ProgressBar value={breakdown.total} color={category?.color} height="h-1.5" />
          <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
            {breakdown.hasMetric ? (
              <span className="truncate font-medium tabular text-ink-soft">
                {formatMetric(goal.metricCurrent, goal.metricUnit, state.settings.currency)}
                <span className="text-ink-faint"> de </span>
                {formatMetric(goal.metricTarget, goal.metricUnit, state.settings.currency)}
                {breakdown.remaining !== null && breakdown.remaining > 0 ? (
                  <span className="text-ink-faint">
                    {" · faltam "}
                    {formatMetric(breakdown.remaining, goal.metricUnit, state.settings.currency)}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="font-medium text-ink-soft">
                {doneSteps} de {orderedSteps.length} {orderedSteps.length === 1 ? "etapa" : "etapas"}
              </span>
            )}
            {breakdown.hasMetric && onOpenProgress && goal.status === "ativa" ? (
              <button
                onClick={() => onOpenProgress(view)}
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-iris hover:underline"
              >
                <Plus className="h-3 w-3" /> Atualizar valor
              </button>
            ) : null}
          </div>
        </div>

        {/* etapas: área útil clicável */}
        {orderedSteps.length > 0 ? (
          <ul className="mt-2 space-y-0.5">
            {orderedSteps.slice(0, showAllSteps ? orderedSteps.length : VISIBLE_STEPS).map((step) => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className="group/step flex w-full items-center gap-2 rounded-lg px-1.5 py-[5px] text-left transition-colors hover:bg-ink/[0.03]"
                >
                  <span
                    className={cn(
                      "grid h-[17px] w-[17px] shrink-0 place-items-center rounded-md border transition-all",
                      step.done
                        ? "border-jade bg-jade text-white"
                        : "border-line-strong text-transparent hover:border-iris",
                    )}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </span>
                  <span
                    className={cn(
                      "truncate text-[12.5px] leading-snug",
                      step.done ? "text-ink-faint line-through" : "text-ink-soft",
                    )}
                  >
                    {step.title}
                  </span>
                </button>
              </li>
            ))}
            {orderedSteps.length > VISIBLE_STEPS ? (
              <li>
                <button
                  type="button"
                  onClick={() => setShowAllSteps((v) => !v)}
                  className="px-1.5 pt-0.5 text-[11.5px] font-semibold text-iris transition-colors hover:underline"
                >
                  {showAllSteps
                    ? "Mostrar menos"
                    : `Mostrar mais (+${orderedSteps.length - VISIBLE_STEPS} ${
                        orderedSteps.length - VISIBLE_STEPS === 1 ? "etapa" : "etapas"
                      })`}
                </button>
              </li>
            ) : null}
          </ul>
        ) : !compact && goal.description ? (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-faint">
            {goal.description}
          </p>
        ) : null}

        {/* rodapé compacto */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          {goal.status === "concluida" ? (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-jade-soft px-2 py-0.5 text-[10.5px] font-semibold text-jade-dark">
              <CheckCircle2 className="h-2.5 w-2.5" />
              {goal.completedAt ? formatDate(goal.completedAt) : "Concluída"}
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10.5px] font-semibold",
                DEADLINE_TONE_CLASS[deadline.tone],
              )}
            >
              <CalendarClock className="h-2.5 w-2.5" />
              {deadline.label}
            </span>
          )}
          {goal.status === "ativa" && view.daysSinceUpdate >= 7 ? (
            <span
              className="inline-flex items-center gap-1 rounded-pill bg-amber-soft px-2 py-0.5 text-[10.5px] font-semibold text-amber-dark"
              title="Sem atualizações recentes"
            >
              <PauseCircle className="h-2.5 w-2.5" />
              parada há {view.daysSinceUpdate}d
            </span>
          ) : null}
          {parent ? (
            <Link
              href={`/metas/${parent.id}`}
              className="inline-flex min-w-0 items-center gap-1 truncate text-[10.5px] text-ink-faint hover:text-iris"
              title={`Parte de: ${parent.title}`}
            >
              <Link2 className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{parent.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      </article>

      <GoalFormModal open={editing} goal={goal} onClose={() => setEditing(false)} />

      {confirmDelete ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-card border border-line bg-surface p-6 shadow-float">
            <h3 className="font-display text-lg font-semibold text-ink">Excluir esta meta?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
              “{goal.title}” e todo o histórico de progresso, etapas e hábitos vinculados
              serão removidos. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteGoal(goal.id);
                  setConfirmDelete(false);
                  toast("Meta excluída.", "info");
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
