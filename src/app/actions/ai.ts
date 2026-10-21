"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Camada de IA (Google Gemini).
 *
 * É opcional: sem `GOOGLE_API_KEY` as funções retornam `available: false` e a
 * interface esconde/desabilita os botões de IA. Nenhuma chamada é feita no
 * cliente — a chave nunca é exposta ao browser.
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

export interface AiResult<T> {
  available: boolean;
  data: T | null;
  message: string;
}

function client(): GoogleGenerativeAI | null {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;
  try {
    return new GoogleGenerativeAI(key);
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ask<T>(prompt: string, fallback: T): Promise<AiResult<T>> {
  const gen = client();
  if (!gen) {
    return {
      available: false,
      data: null,
      message:
        "IA indisponível: defina GOOGLE_API_KEY no ambiente para habilitar as sugestões.",
    };
  }

  const model = gen.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.7,
      // o modelo gasta tokens "pensando" — precisa de folga para caber o JSON
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const json = extractJson<T>(text);
      if (json) return { available: true, data: json, message: "ok" };
      lastError = "Resposta não interpretável.";
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : "Não consegui falar com o Gemini agora.";
      await sleep(1200 * (attempt + 1));
    }
  }
  return { available: false, data: null, message: lastError };
}

/** Extrai o primeiro objeto JSON válido da resposta (com tentativa de reparo). */
function extractJson<T>(text: string): T | null {
  if (!text) return null;
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const candidates: string[] = [];
  const start = cleaned.indexOf("{");
  if (start >= 0) {
    candidates.push(cleaned.slice(start));
    candidates.push(cleaned.slice(start, cleaned.lastIndexOf("}") + 1));
  }
  candidates.push(cleaned);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      const repaired = repairJson(candidate);
      if (repaired) {
        try {
          return JSON.parse(repaired) as T;
        } catch {
          /* tenta o próximo */
        }
      }
    }
  }
  return null;
}

/** Fecha as chaves/colchetes que faltarem em um JSON truncado. */
function repairJson(input: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastValid = -1;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{" || char === "[") stack.push(char);
    else if (char === "}" || char === "]") stack.pop();
    else if (char === ",") lastValid = i;
  }
  if (stack.length === 0) return null;

  let out = input.trimEnd();
  // corta vírgula solta no fim
  out = out.replace(/,\s*$/, "");
  // fecha strings abertas
  if (inString) out += '"';
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === "{" ? "}" : "]";
  }
  return out;
}

/** Sugere etapas (subtarefas) para uma meta. */
export async function suggestSteps(input: {
  title: string;
  description?: string;
  category?: string;
  dueDate?: string | null;
}): Promise<AiResult<{ steps: string[] }>> {
  const prompt = `Você é um strategist de metas. Responda APENAS com JSON no formato {"steps": ["..."]}.
Gere de 4 a 7 etapas objetivas, acionáveis e em ordem cronológica para a meta abaixo.

Meta: ${input.title}
Categoria: ${input.category ?? "geral"}
Descrição: ${input.description ?? "-"}
Prazo: ${input.dueDate ?? "sem prazo"}`;
  return ask<{ steps: string[] }>(prompt, { steps: [] });
}

/** Transforma um sonho em sugestões de metas acionáveis. */
export async function suggestGoalsFromDream(input: {
  title: string;
  description?: string;
  estimatedValue?: number | null;
}): Promise<
  AiResult<{
    goals: Array<{
      title: string;
      description: string;
      metricTarget: number | null;
      metricUnit: string;
    }>;
  }>
> {
  const prompt = `Você é um coach de objetivos. Responda APENAS com JSON no formato {"goals": [{"title":"","description":"","metricTarget":0,"metricUnit":""}]}.
Transforme o sonho abaixo em 3 metas acionáveis e mensuráveis. metricTarget deve ser um número ou null quando não houver métrica clara (metricUnit vazio quando null).

Sonho: ${input.title}
Descrição: ${input.description ?? "-"}
Valor estimado: ${input.estimatedValue ?? "não informado"}`;
  return ask(prompt, { goals: [] });
}

/** Analisa o desempenho da semana e devolve um insight curto. */
export async function analyzeProgress(input: {
  overall: number;
  ativas: number;
  concluidas: number;
  atrasadas: number;
  proximas: number;
  goals: Array<{ title: string; progress: number; deadline: string; priority: string }>;
}): Promise<AiResult<{ headline: string; bullets: string[]; focus: string }>> {
  const prompt = `Você é um coach de produtividade que analisa metas. Responda APENAS com JSON no formato {"headline":"","bullets":["..."],"focus":""}.
Seja específico, curto e motivador (pt-BR). Máximo de 4 bullets, foco em 1 ação concreta.

Progresso geral: ${Math.round(input.overall)}%
Metas ativas: ${input.ativas} · concluídas: ${input.concluidas} · atrasadas: ${input.atrasadas} · próximas do prazo: ${input.proximas}

Metas:
${input.goals
  .map(
    (g) =>
      `- ${g.title}: ${Math.round(g.progress)}% · prazo ${g.deadline} · prioridade ${g.priority}`,
  )
  .join("\n")}`;
  return ask(prompt, { headline: "", bullets: [], focus: "" });
}
