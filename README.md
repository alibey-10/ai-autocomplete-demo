# AI Autocomplete Demo

A writing box that finishes the sentence you are in. After you pause, grey text appears after the caret. **Tab** accepts it, **→** takes the next word, and **Esc** dismisses it. On a touch screen, the same actions sit under the box.

Suggestions come from a cheap OpenRouter model. The page lets you switch models and start from an email, a note, or a story.

## Run it

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

Put an [OpenRouter](https://openrouter.ai/) key in `.env.local`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

Without the key, the page still loads and reports that the key is missing when it asks for a suggestion.

## How a suggestion is made

Typing pauses for 400ms, and only while the caret is at the end. The browser calls the `completeDraft` server function with the draft and the selected model.

The server sends the last 2,000 characters to OpenRouter and asks for the characters that should follow, stopping at the end of the current sentence. The reply is clipped to that sentence (180 characters at most). Each call waits up to 8 seconds and is retried once. Drafts longer than 4,000 characters are rejected.

The model list lives in `src/models.ts`. The default is `qwen/qwen3-coder-flash`.

`AIAutocomplete` can also run without a server: if you omit `suggest`, it continues a built-in script so the ghost text can be tried on its own.

## Stack

- [TanStack Start](https://tanstack.com/start) and [TanStack Router](https://tanstack.com/router)
- [TanStack AI](https://tanstack.com/ai) with the OpenRouter adapter
- React 19, Vite, Tailwind CSS
- [shadcn/ui](https://ui.shadcn.com/) (Base UI, Hugeicons)

```bash
pnpm dlx shadcn@latest add button
```

## Deploy

The app is set up for Cloudflare Workers (`wrangler.jsonc`, `@cloudflare/vite-plugin`).

```bash
wrangler login
wrangler secret put OPENROUTER_API_KEY
bun run deploy
```

`bun run deploy` builds, then runs `wrangler deploy`.
