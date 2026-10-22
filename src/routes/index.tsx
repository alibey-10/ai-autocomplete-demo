import { useCallback, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { AIAutocomplete } from "#/components/ai-autocomplete";
import { AlibabaCloudLogo } from "@/components/logos/alibaba-cloud";
import { DeepseekLogo } from "@/components/logos/deepseek";
import { MinimaxLogo } from "@/components/logos/minimax";
import { OpenaiLogo } from "@/components/logos/openai";
import { Button, buttonVariants } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMPLETION_MODELS,
  DEFAULT_COMPLETION_MODEL,
  isCompletionModel,
  type CompletionModelId,
} from "@/models";
import { completeDraft } from "@/server/complete";

export const Route = createFileRoute("/")({ component: Home });

const STARTERS = [
  {
    label: "Email",
    text: "Hi Maya,\n\nThanks for the update on the ",
  },
  {
    label: "Note",
    text: "The launch review moved to Thursday because ",
  },
  {
    label: "Story",
    text: "The lighthouse keeper swore the lamp had gone out, but ",
  },
] as const;

const MODEL_ITEMS = Object.fromEntries(
  COMPLETION_MODELS.map((model) => [model.id, model.label]),
);

function ModelLogo({ id }: { id: CompletionModelId }) {
  const provider = id.split("/")[0];
  const props = { className: "size-4", title: "" } as const;
  if (provider === "deepseek") return <DeepseekLogo {...props} />;
  if (provider === "openai") return <OpenaiLogo {...props} />;
  if (provider === "qwen") return <AlibabaCloudLogo {...props} />;
  if (provider === "minimax") return <MinimaxLogo {...props} />;
  return null;
}

function Home() {
  const [starter, setStarter] = useState(0);
  const [model, setModel] = useState<CompletionModelId>(
    DEFAULT_COMPLETION_MODEL,
  );
  const [phase, setPhase] = useState<"idle" | "thinking" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const ticket = useRef(0);
  const selected =
    COMPLETION_MODELS.find((item) => item.id === model) ?? COMPLETION_MODELS[0];

  const suggest = useCallback(
    async (text: string) => {
      const id = ++ticket.current;
      setPhase("thinking");
      setMessage(null);
      try {
        const result = await completeDraft({ data: { text, model } });
        if (id !== ticket.current) return result.suggestion;
        if (result.error) {
          setPhase("error");
          setMessage(result.error);
        } else {
          setPhase("idle");
        }
        return result.suggestion;
      } catch (error) {
        if (id === ticket.current) {
          setPhase("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "The model did not respond.",
          );
        }
        return null;
      }
    },
    [model],
  );

  const draft = STARTERS[starter] ?? STARTERS[0];

  return (
    <main className="min-h-svh bg-background font-[Manrope,sans-serif] text-foreground">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-16 sm:py-24">
        <header className="flex flex-col gap-3">
          <a
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "self-end",
            )}
            href="https://github.com/alibey-10/ai-autocomplete-demo"
            rel="noreferrer"
            target="_blank"
          >
            <HugeiconsIcon
              data-icon="inline-start"
              icon={GithubIcon}
              strokeWidth={2}
            />
            Source Code
          </a>
          <h1 className="font-[Fraunces,serif] text-4xl leading-tight tracking-tight">
            AI Autocomplete Demo
          </h1>
          <p className="text-muted-foreground leading-6">
            Type a few words. Let AI finish the thought.
          </p>
          <p className="text-muted-foreground leading-6">
            Compare DeepSeek, OpenAI, Qwen, and MiniMax models in a real inline
            autocomplete experience. <br /> <Kbd>Tab</Kbd> to accept.{" "}
            <Kbd>→</Kbd> for one word. <Kbd>Esc</Kbd> to dismiss.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {STARTERS.map((item, index) => (
            <Button
              aria-pressed={index === starter}
              key={item.label}
              onClick={() => {
                ticket.current += 1;
                setStarter(index);
                setPhase("idle");
                setMessage(null);
              }}
              size="sm"
              type="button"
              variant={index === starter ? "default" : "outline"}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <section className="island-shell overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-4 py-2.5">
            <span className="text-sm text-muted-foreground">
              {phase === "thinking" ? "Thinking…" : selected.why}
            </span>
            <Select
              items={MODEL_ITEMS}
              onValueChange={(next) => {
                if (!isCompletionModel(next) || next === model) return;
                ticket.current += 1;
                setModel(next);
                setPhase("idle");
                setMessage(null);
              }}
              value={model}
            >
              <SelectTrigger
                aria-label="Model"
                className="max-w-full bg-background"
                size="sm"
              >
                <ModelLogo id={model} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="end"
                alignItemWithTrigger={false}
                className="w-80 p-4 space-y-2"
              >
                {COMPLETION_MODELS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="flex w-64 items-start gap-2.5 whitespace-normal py-0.5">
                      <ModelLogo id={item.id} />
                      <span className="flex min-w-0 flex-col items-start gap-0.5">
                        <span className="font-medium">{item.label}</span>
                        <span className="font-mono text-[11px] leading-4 font-normal text-muted-foreground">
                          {item.id}
                        </span>
                        <span className="text-xs leading-4 font-normal text-muted-foreground">
                          {item.why}
                        </span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AIAutocomplete
            defaultValue={draft.text}
            key={draft.label}
            label="Draft"
            suggest={suggest}
          />
        </section>

        <p
          aria-live="polite"
          className={phase === "error" ? "text-sm text-destructive" : "sr-only"}
        >
          {message}
        </p>
      </div>
    </main>
  );
}
