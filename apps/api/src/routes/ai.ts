import type { FastifyInstance } from 'fastify';
import { chatWithAi } from '../services/aiService.js';
import {
  getEnabledPersonalities,
  PersonalityError,
  resolvePersonality,
} from '../services/personalityService.js';

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateEntry>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const CHAT_MODE_PROMPT =
  'You are a fun, age-appropriate chat companion. Keep responses concise and safe for teens.';

/** Simple in-memory per-IP rate limiter. */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

/** Registers AI chat routes on the Fastify instance. */
export async function aiRoutes(app: FastifyInstance) {
  app.get('/ai/personalities', async (_request, reply) => {
    return reply.send({ personalities: getEnabledPersonalities() });
  });

  app.post('/ai/chat', async (request, reply) => {
    const ip = request.ip;
    if (!checkRateLimit(ip)) {
      return reply.status(429).send({ error: 'Rate limit exceeded. Try again later.' });
    }

    const body = request.body as {
      mode?: string;
      personalityId?: string;
      messages?: Array<{ role: string; content: string }>;
    };

    if (body.mode !== 'teacher' && body.mode !== 'chat') {
      return reply.status(400).send({ error: 'Invalid mode. Use "teacher" or "chat".' });
    }

    if (!body.messages?.length) {
      return reply.status(400).send({ error: 'Messages array is required.' });
    }

    const totalChars = body.messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0);
    if (totalChars > 4000) {
      return reply.status(400).send({ error: 'Payload too large (max 4000 characters).' });
    }

    try {
      let systemPrompt = CHAT_MODE_PROMPT;
      let personalityMeta: { id: string; name: string; slug: string } | undefined;

      if (body.mode === 'teacher') {
        const personality = resolvePersonality(body.personalityId);
        systemPrompt = personality.systemPrompt;
        personalityMeta = {
          id: personality.id,
          name: personality.name,
          slug: personality.slug,
        };
      }

      const replyContent = await chatWithAi(
        body.mode,
        systemPrompt,
        body.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      );

      return {
        reply: { role: 'assistant', content: replyContent },
        ...(personalityMeta ? { personality: personalityMeta } : {}),
      };
    } catch (err) {
      if (err instanceof PersonalityError) {
        return reply.status(400).send({ error: err.message });
      }
      request.log.error(err);
      return reply.status(502).send({
        error: err instanceof Error ? err.message : 'AI service unavailable.',
      });
    }
  });
}
