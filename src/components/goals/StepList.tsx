"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import { cn, formatDate } from "@/lib/utils";
import type { Step } from "@/lib/types";

export function StepList({
  goalId,
  steps,
  compact = false,
}: {
  goalId: string;
  steps: Step[];
  compact?: boolean;
}) {
  const { addStep, toggleStep, updateStep, deleteStep } = useStore();
  const { toast } = useToast();
  const [newStep, setNewStep] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const saveEdit = () => {
    if (!editingId) return;
    const clean = editingTitle.trim();
    if (clean) updateStep(editingId, { title: clean });
    setEditingId(null);
    setEditingTitle("");
  };

  const ordered = [...steps].sort((a, b) => a.position - b.position);

  const submit = () => {
    const value = newStep.trim();
    if (!value) return;
    addStep(goalId, value);
    setNewStep("");
  };

  return (
    <div>
      <ul className="space-y-1.5">
        {ordered.map((step) => (
          <li key={step.id}>
            <div
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-line hover:bg-ink/[0.02]",
                step.done && "opacity-60",
              )}
            >
              <button
                onClick={() => toggleStep(step.id)}
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition-all",
                  step.done
                    ? "border-jade bg-jade text-white"
                    : "border-line-strong text-transparent hover:border-iris hover:text-iris/40",
                )}
                aria-label={step.done ? "Desmarcar etapa" : "Concluir etapa"}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
              <div className="min-w-0 flex-1">
                {editingId === step.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdit();
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded-lg border border-iris bg-surface px-2 py-1 text-[13.5px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-iris/20"
                  />
                ) : (
                  <p
                    onClick={() => {
                      setEditingId(step.id);
                      setEditingTitle(step.title);
                    }}
                    title="Clique para editar a etapa"
                    className={cn(
                      "cursor-text rounded-md text-[13.5px] font-medium leading-snug transition-colors hover:bg-ink/[0.04]",
                      step.done ? "text-ink-faint line-through" : "text-ink",
                    )}
                  >
                    {step.title}
                  </p>
                )}
                {!compact && step.done && step.doneAt ? (
                  <p className="text-[11px] text-ink-faint">Concluída em {formatDate(step.doneAt)}</p>
                ) : null}
              </div>
              <button
                onClick={() => deleteStep(step.id)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-faint opacity-0 transition-all hover:bg-rose-soft hover:text-rose group-hover:opacity-100"
                aria-label="Excluir etapa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <Input
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Nova etapa…"
          className="h-10"
        />
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={submit}
        >
          Adicionar
        </Button>
      </div>
      {ordered.length === 0 ? (
        <p className="mb-3 text-[13px] text-ink-faint">
          Nenhuma etapa ainda. Quebre a meta em passos menores para avançar com constância.
        </p>
      ) : null}
    </div>
  );
}
