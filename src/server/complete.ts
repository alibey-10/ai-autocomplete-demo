import { chat } from '@tanstack/ai'
import { openRouterText } from '@tanstack/ai-openrouter'
import { createServerFn } from '@tanstack/react-start'
import { isCompletionModel, type CompletionModelId } from '@/models'

const SYSTEM = [
  'You finish a draft in progress.',
  'Reply with only the characters that should be inserted after the draft.',
  'Do not repeat the draft, and do not add a label, quotes, or markdown.',
  'Match its language and tone.',
  'Stop at the end of the current sentence.',
].join(' ')

const MAX_DRAFT = 4_000

export const completeDraft = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    const record = typeof input === 'object' && input !== null ? input : null
    const text = record && 'text' in record ? record.text : undefined
    const model = record && 'model' in record ? record.model : undefined
    if (typeof text !== 'string' || text.length > MAX_DRAFT) {
      throw new Error('Send a draft of at most 4000 characters.')
    }
    if (!isCompletionModel(model)) {
      throw new Error('Choose a model from the list.')
    }
    return { text, model }
  })
  .handler(async ({ data }): Promise<{ suggestion: string | null; error?: string }> => {
    const draft = data.text.slice(-2_000)
    if (!draft.trim()) return { suggestion: null }

    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), 8_000)
    try {
      return { suggestion: await complete(draft, data.model, abortController) }
    } catch {
      try {
        return { suggestion: await complete(draft, data.model, abortController) }
      } catch (retryError) {
        return { suggestion: null, error: publicError(retryError) }
      }
    } finally {
      clearTimeout(timer)
    }
  })

function complete(draft: string, model: CompletionModelId, abortController: AbortController) {
  return chat({
    adapter: openRouterText(model),
    systemPrompts: [SYSTEM],
    messages: [{ role: 'user', content: draft }],
    stream: false,
    reasoning: 'off',
    abortController,
    modelOptions: {
      temperature: 0.3,
      maxCompletionTokens: 48,
      provider: { sort: 'latency' },
    },
  }).then((result) => continuation(draft, result.text))
}

/** Keep only the new characters, clipped to the current sentence. */
function continuation(draft: string, raw: string): string | null {
  let text = raw.replace(/^\uFEFF/, '').trim()
  if (!text || /^(none|n\/a|∅)$/i.test(text)) return null

  text = text.replace(/^(continuation|suggestion)\s*:\s*/i, '')
  const wrapped = text.match(/^["“]([\s\S]*)["”]$/)
  if (wrapped?.[1]) text = wrapped[1].trim()

  if (text.startsWith(draft)) {
    text = text.slice(draft.length)
  } else {
    const tail = draft.slice(-80)
    const at = tail.trim() ? text.lastIndexOf(tail) : -1
    if (at >= 0) text = text.slice(at + tail.length)
  }

  const needsSpace = draft.length > 0 && !/\s$/.test(draft)
  if (needsSpace && text && !/^[\s.,!?;:'")\]]/.test(text)) {
    text = ` ${text}`
  } else if (/\s$/.test(draft)) {
    text = text.replace(/^\s+/, '')
  }

  const sentence = text.match(/^[\s\S]*?[.!?](?=\s|$)/)
  text = (sentence?.[0] ?? text.split('\n')[0] ?? text).slice(0, 180)
  if (!text.trim()) return null
  return /\s$/.test(text) ? text : `${text} `
}

function publicError(error: unknown): string {
  const rawCode =
    typeof error === 'object' && error !== null && 'rawEvent' in error
      ? (error as { rawEvent?: { code?: number } }).rawEvent?.code
      : undefined
  if (rawCode === 429) return 'The model is busy. Wait a moment and keep typing.'
  const message = error instanceof Error ? error.message : 'The model did not respond.'
  if (/abort/i.test(message)) return 'The model took too long.'
  if (/is not set/i.test(message)) return 'OPENROUTER_API_KEY is not set.'
  if (/sk-or-/i.test(message)) return 'The model request failed.'
  return message.slice(0, 160)
}
