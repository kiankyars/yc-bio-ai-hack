import type { IncomingMessage, ServerResponse } from 'node:http';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

type ChatBody = {
  model?: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: {
    protein?: string;
    targetId?: string;
    selectedLigand?: string;
    selectedResidue?: string;
    selectedView?: string;
    ligands?: Array<Record<string, unknown>>;
    residues?: Array<Record<string, unknown>>;
  };
};

const GEMINI_OPENAI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

function json(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readJson(req: IncomingMessage): Promise<ChatBody> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? (JSON.parse(raw) as ChatBody) : {};
}

function buildSystemPrompt(body: ChatBody): string {
  const context = body.context ?? {};
  return [
    'You are PocketVerse Copilot, a concise structural-biology explainer for a live demo.',
    'Answer in 2-5 short paragraphs or compact bullets.',
    'Use the provided pocket context first. Do not invent experimental results or claim real docking values.',
    `Protein: ${context.protein ?? 'Unknown'} (${context.targetId ?? 'Unknown target'})`,
    `Selected ligand: ${context.selectedLigand ?? 'Unknown'}`,
    `Selected residue: ${context.selectedResidue ?? 'Unknown'}`,
    `Selected view: ${context.selectedView ?? 'Unknown'}`,
    `Ligands: ${JSON.stringify(context.ligands ?? [])}`,
    `Residues: ${JSON.stringify(context.residues ?? [])}`,
  ].join('\n');
}

async function callGemini(apiKey: string, model: string, body: ChatBody): Promise<{ content: string; model: string }> {
  const upstreamBody = {
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(body) },
      ...(body.messages ?? []),
    ],
  };

  const response = await fetch(GEMINI_OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(upstreamBody),
  });

  const text = await response.text();
  let payload: Record<string, any> = {};
  try {
    payload = text ? (JSON.parse(text) as Record<string, any>) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message =
      typeof payload.error?.message === 'string'
        ? payload.error.message
        : typeof payload.raw === 'string'
          ? payload.raw
          : `Gemini request failed with ${response.status}`;
    throw new Error(message);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  return { content, model };
}

function geminiProxy(mode: string) {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
  const defaultModel = env.GEMINI_MODEL || env.VITE_GEMINI_MODEL || 'gemini-flash-3-preview';

  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url !== '/api/gemini-chat') {
      next();
      return;
    }

    if (req.method !== 'POST') {
      json(res, 405, { error: 'Method not allowed' });
      return;
    }

    if (!apiKey) {
      json(res, 500, { error: 'Missing GEMINI_API_KEY in the local environment.' });
      return;
    }

    try {
      const body = await readJson(req);
      const requestedModel = body.model || defaultModel;

      try {
        const reply = await callGemini(apiKey, requestedModel, body);
        json(res, 200, reply);
        return;
      } catch (error) {
        if (requestedModel === 'gemini-flash-3-preview') {
          const fallback = await callGemini(apiKey, 'gemini-2.5-flash', body);
          json(res, 200, fallback);
          return;
        }
        throw error;
      }
    } catch (error) {
      json(res, 500, {
        error: error instanceof Error ? error.message : 'Gemini proxy failed.',
      });
    }
  };

  return {
    name: 'gemini-openai-proxy',
    configureServer(server: { middlewares: { use: (fn: typeof middleware) => void } }) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server: { middlewares: { use: (fn: typeof middleware) => void } }) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), geminiProxy(mode)],
}));
