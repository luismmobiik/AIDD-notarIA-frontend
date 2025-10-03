/**
 * TypeScript definitions for Chrome AI Prompt API
 * Experimental API for built-in AI language model
 *
 * Official docs: https://developer.chrome.com/docs/ai/prompt-api
 * GitHub spec: https://github.com/webmachinelearning/prompt-api
 */

/**
 * Prompt message for initializing the model
 */
interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Options for creating a language model session
 */
interface LanguageModelCreateOptions {
  temperature?: number;
  topK?: number;
  expectedInputs?: Array<{
    type: 'text';
    languages?: string[];
  }>;
  initialPrompts?: PromptMessage[];
}

/**
 * Language model session interface
 */
interface LanguageModelSession {
  prompt(message: string, options?: { responseConstraint?: object }): Promise<string>;
  promptStreaming(message: string, options?: { responseConstraint?: object }): AsyncIterable<string>;
  append(message: PromptMessage): Promise<void>;
  clone(): Promise<LanguageModelSession>;
  destroy(): void;
}

/**
 * Language model availability status
 */
type LanguageModelAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

/**
 * Main LanguageModel interface (global object)
 */
interface LanguageModelStatic {
  availability(): Promise<LanguageModelAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}

/**
 * Extend Window interface to include LanguageModel
 */
interface Window {
  LanguageModel?: LanguageModelStatic;
}

/**
 * Global LanguageModel object
 */
declare const LanguageModel: LanguageModelStatic;
