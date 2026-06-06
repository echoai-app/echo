import { GeminiProvider } from './gemini';
import { GroqProvider } from './groq';
import { AnthropicProvider } from './anthropic';
import type { LLMProvider } from './types';

export type { LLMProvider, LLMRequest, LLMResponse, LLMMessage } from './types';

let _provider: LLMProvider | null = null;

export function getProvider(): LLMProvider {
  if (_provider) return _provider;

  // Priority: GROQ > GEMINI > ANTHROPIC
  if (process.env.GROQ_API_KEY) {
    _provider = new GroqProvider();
    return _provider;
  }
  if (process.env.GEMINI_API_KEY) {
    _provider = new GeminiProvider();
    return _provider;
  }
  if (process.env.ANTHROPIC_API_KEY) {
    _provider = new AnthropicProvider();
    return _provider;
  }

  throw new Error(
    'No LLM provider configured. Set GROQ_API_KEY (free at console.groq.com), ' +
    'GEMINI_API_KEY, or ANTHROPIC_API_KEY in .env.local'
  );
}

export function resetProvider(): void {
  _provider = null;
}

// Whether any LLM provider is available — lets callers fall back to a calm
// scripted reply instead of throwing when no key is configured.
export function hasProvider(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
}
