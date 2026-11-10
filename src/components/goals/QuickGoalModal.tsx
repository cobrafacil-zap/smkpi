"use client";

import { useState } from "react";
import { Check, GripVertical, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/data/store";
import { suggestSteps } from "@/app/actions/ai";
import { CADENCE_LABEL, PRIORITY_LABEL } from "@/lib/constants";
import type { GoalCadence, GoalPriority } from "@/lib/types";
import { cn, toISODate } from "@/lib/utils";

/**
 * Criação rápida: você escreve um briefing curto e a IA monta as etapas.
 * O progresso da meta passa a ser a % de etapas concluídas.
 */
export function QuickGoalModal({
  open,
  onClose,
  onAdvanced,
  defaultCategoryId,
}: {
  open: boolean;
  onClose: () => void;
  onAdvanced?: () => void;
  defaultCategoryId?: string;
}) {
  const { state, addGoal, addStep } = useStore();
  const { toast } = useToast();

  const [briefing, setBriefing] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<GoalPriority>("media");
  const [cadence, setCadence] = useState<GoalCadence>("sem-prazo");
  const [dueDate, setDueDate] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const reset = () => {
    setBriefing("");
    setCategoryId(defaultCategoryId ?? state.categories[0]?.id ?? "");
    setPriority("media");
    setCadence("sem-prazo");
    setDueDate("");
    setSteps([]);
    setAiMessage("");
    setLoading(false);
    setCreating(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const generate = async () => {
    if (!briefing.trim()) {
      setAiMessage("Escreva um pouco sobre a meta primeiro.");
      return;
    }
    setLoading(true);
    setAiMessage("");
    const category = state.categories.find((c) => c.id === categoryId);
    const result = await suggestSteps({
      title: briefing.trim(),
      category: category?.name,
      dueDate: dueDate || null,
    });
    setLoading(false);
    if (!result.available || !result.data?.steps?.length) {
      setAiMessage(
        result.available
          ? "Não consegui sugerir etapas agora — adicione manualmente abaixo."
          : result.message,
      );
      return;
    }
    setSteps(result.data.steps);
    setAiMessage(`${result.data.steps.length} etapas sugeridas — revise e ajuste.`);
  };

  const create = async () => {
    const title = briefing.trim().split("\n")[0].slice(0, 120);
    if (!title) {
      setAiMessage("Escreva um briefing para a meta.");
      return;
    }

    setCreating(true);
    // garante etapas mesmo sem IA: meta sem etapas não tem progresso
    let finalSteps = steps.filter((s) => s.trim());
    if (finalSteps.length === 0) {
      setLoading(true);
      const result = await suggestSteps({ title, dueDate: dueDate || null });
      setLoading(false);
      finalSteps = result.data?.steps?.filter((s) => s.trim()) ?? [];
    }

    const goal = addGoal({
      title,
      description: briefing.trim(),
      categoryId: categoryId || state.categories[0]?.id || "",
      scope: state.categories.find((c) => c.id === categoryId)?.scope ?? "neutro",
      priority,
      cadence,
      startDate: toISODate(),
      dueDate: dueDate || null,
      metricStart: null,
      metricCurrent: null,
      metricTarget: null,
      metricUnit: "",
      icon: "target",
      notes: "",
    });

    finalSteps.forEach((s) => addStep(goal.id, s));
    setCreating(false);
    toast(finalSteps.length ? `Meta criada com ${finalSteps.length} etapas!` : "Meta criada!");
    handleClose();
  };

  const setStep = (index: number, value: string) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nova meta"
      description="Conte sua meta em poucas palavras — a gente monta as etapas para você."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={create}
            loading={creating || loading}
            leadingIcon={<Check className="h-4 w-4" />}
          >
            Criar meta
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Qual é a meta?" htmlFor="quick-briefing" hint="1 frase já resolve">
          <textarea
            id="quick-briefing"
            autoFocus
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            placeholder="Ex.: Lançar o curso de tráfego pago até dezembro com 50 alunos"
            className="min-h-[84px] w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint transition-colors focus:border-iris focus:outline-none focus:ring-4 focus:ring-iris/10"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            loading={loading}
            leadingIcon={<Sparkles className="h-4 w-4" />}
            onClick={generate}
          >
            {steps.length ? "Gerar etapas de novo" : "Gerar etapas com IA"}
          </Button>
          {aiMessage ? (
            <span className="text-[12px] text-ink-faint">{aiMessage}</span>
          ) : null}
        </div>

        <div className="rounded-xl border border-line bg-ink/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                Etapas da meta
              </p>
              <span className="text-[11px] text-ink-faint">
                clique para editar · arraste não é necessário
              </span>
            </div>
            <ul className="space-y-1.5">
              {steps.map((step, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-iris-soft text-[11px] font-bold text-iris-dark">
                    {i + 1}
                  </span>
                  <Input
                    value={step}
                    onChange={(e) => setStep(i, e.target.value)}
                    className="h-9 text-[13.5px]"
                  />
                  <button
                    type="button"
                    onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-rose-soft hover:text-rose"
                    aria-label="Remover etapa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, ""])}
              className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-iris hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar etapa
            </button>
          </div>

        <details className="group rounded-xl border border-line px-4 py-3">
          <summary className="cursor-pointer list-none text-[13px] font-semibold text-ink-soft">
            <span className="inline-flex items-center gap-2">
              <Wand2 className="h-3.5 w-3.5 text-iris" />
              Ajustar categoria, prazo e prioridade
            </span>
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Categoria">
              <Select
                value={categoryId || state.categories[0]?.id}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={priority} onChange={(e) => setPriority(e.target.value as GoalPriority)}>
                {(Object.keys(PRIORITY_LABEL) as GoalPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prazo final" optional>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Período">
              <Select value={cadence} onChange={(e) => setCadence(e.target.value as GoalCadence)}>
                {(Object.keys(CADENCE_LABEL) as GoalCadence[]).map((c) => (
                  <option key={c} value={c}>
                    {CADENCE_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </details>

        {onAdvanced ? (
          <p className="text-[12px] text-ink-faint">
            Prefere controlar valores (R$, kg, %) e vínculos entre metas?{" "}
            <button
              type="button"
              onClick={onAdvanced}
              className="font-semibold text-iris hover:underline"
            >
              Abrir formulário completo
            </button>
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
