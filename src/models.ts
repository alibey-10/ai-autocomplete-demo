/** Cheap OpenRouter models suited to short autocomplete calls. */
export const COMPLETION_MODELS = [
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    why: "Flash-tier, suggested for coding",
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 Nano",
    why: "Fast, cheap tier",
  },
  {
    id: "qwen/qwen3-coder-flash",
    label: "Qwen3 Coder Flash",
    why: "Coder variant with prompt caching",
  },
  {
    id: "minimax/minimax-m2.1",
    label: "MiniMax M2.1",
    why: "Listed in community examples",
  },
] as const;

export type CompletionModelId = (typeof COMPLETION_MODELS)[number]["id"];

export const DEFAULT_COMPLETION_MODEL: CompletionModelId =
  "qwen/qwen3-coder-flash";

export function isCompletionModel(value: unknown): value is CompletionModelId {
  return COMPLETION_MODELS.some((model) => model.id === value);
}
