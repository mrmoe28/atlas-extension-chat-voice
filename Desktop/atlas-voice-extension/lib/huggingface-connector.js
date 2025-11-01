/**
 * Hugging Face Inference API Connector
 * Free AI integration using Hugging Face models + Browser Speech
 */

export class HuggingFaceConnector {
  constructor() {
    this.apiToken = null;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    // Using GPT-2 - simple, guaranteed to work, completely unrestricted
    this.model = 'gpt2';
    this.conversationHistory = [];
    this.systemPrompt = `You are Atlas Voice, a helpful AI assistant. Be conversational, friendly, and concise.

Keep responses brief (2-3 sentences) for voice conversations. Be natural and helpful.`;
  }

  /**
   * Initialize Hugging Face connector with API token
   */
  async initialize(token) {
    if (!token) {
      throw new Error('Hugging Face API token is required. Get one free at https://huggingface.co/settings/tokens');
    }

    // Validate token format (HF tokens start with 'hf_')
    if (!token.startsWith('hf_')) {
      console.warn('⚠️ API token does not start with "hf_" - this may not be a valid Hugging Face token');
    }

    this.apiToken = token;
    console.log('✅ Hugging Face connector initialized with token:', token.substring(0, 7) + '...');
  }

  /**
   * Set custom system prompt
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
  }

  /**
   * Add message to conversation history
   */
  addMessage(role, content) {
    this.conversationHistory.push({ role, content });

    // Keep last 10 messages to avoid token limits
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Stream message to Hugging Face (for real-time responses)
   */
  async streamMessage(userMessage, onChunk, onComplete) {
    if (!this.apiToken) {
      throw new Error('Hugging Face API token not set');
    }

    this.addMessage('user', userMessage);

    // Debug logging
    console.log('🔑 Using HF token:', this.apiToken.substring(0, 7) + '...');
    console.log('🌐 Calling Hugging Face API:', `${this.baseUrl}/${this.model}`);
    console.log('📊 Model:', this.model);

    try {
      // Build conversation context
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ];

      // Convert to prompt format for Llama
      const prompt = this.buildLlamaPrompt(messages);

      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false
          },
          options: {
            use_cache: false,
            wait_for_model: true
          }
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('❌ Hugging Face API error response:', JSON.stringify(errorData, null, 2));
          console.error('❌ Full error details:', {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData
          });
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        throw new Error(`Hugging Face API error: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('📥 HF Response:', data);

      // Extract the generated text
      let fullMessage = '';
      if (Array.isArray(data) && data.length > 0) {
        fullMessage = data[0].generated_text || data[0].text || '';
      } else if (data.generated_text) {
        fullMessage = data.generated_text;
      } else if (typeof data === 'string') {
        fullMessage = data;
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('Unexpected response format from Hugging Face');
      }

      // Clean up the response
      fullMessage = fullMessage.trim();

      // Call callbacks
      if (onChunk) onChunk(fullMessage);

      this.addMessage('assistant', fullMessage);

      if (onComplete) onComplete(fullMessage);

      return { success: true, message: fullMessage };

    } catch (error) {
      console.error('Hugging Face streaming error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build Mistral-style prompt from messages
   */
  buildLlamaPrompt(messages) {
    let prompt = '';
    let systemPrompt = '';

    // Extract system message
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt = msg.content;
        break;
      }
    }

    // Build conversation in Mistral format
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    for (let i = 0; i < conversationMessages.length; i++) {
      const msg = conversationMessages[i];

      if (msg.role === 'user') {
        // First user message includes system prompt
        if (i === 0 && systemPrompt) {
          prompt += `[INST] ${systemPrompt}\n\n${msg.content} [/INST]`;
        } else {
          prompt += `[INST] ${msg.content} [/INST]`;
        }
      } else if (msg.role === 'assistant') {
        prompt += ` ${msg.content}`;
        // Add space after assistant response for next user message
        if (i < conversationMessages.length - 1) {
          prompt += ' ';
        }
      }
    }

    return prompt;
  }
}

// Export singleton instance
export const huggingFaceConnector = new HuggingFaceConnector();
