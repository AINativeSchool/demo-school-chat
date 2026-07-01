import { ResilientLLM } from 'resilient-llm';

let llm: ResilientLLM | null = null;

/** Lazily initializes the resilient-llm client. */
function getLlm(): ResilientLLM {
  if (!llm) {
    llm = new ResilientLLM({
      aiService: process.env.LLM_PRIMARY_PROVIDER ?? 'openai',
      fallback: process.env.LLM_FALLBACK_PROVIDERS?.split(',').filter(Boolean),
      model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
      retries: 3,
      rateLimitConfig: { requestsPerMinute: 30 },
    });
  }
  return llm;
}

/** Sends a chat request to the configured LLM provider. */
export async function chatWithAi(
  _mode: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const client = getLlm();
  const response = await client.chat([
    { role: 'system', content: systemPrompt },
    ...messages,
  ]);

  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'content' in response) {
    return String((response as { content: string }).content);
  }
  return String(response);
}
