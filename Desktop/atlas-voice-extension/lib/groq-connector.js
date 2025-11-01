/**
 * Groq AI Connector
 * Free, fast LLM integration using Groq API + Browser Speech
 */

export class GroqConnector {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.1-70b-versatile'; // Fast and capable
    this.conversationHistory = [];
    this.systemPrompt = `You are Atlas Voice, a helpful AI assistant. Be conversational, friendly, and concise.

Keep responses brief (2-3 sentences) for voice conversations. Be natural and helpful.`;
  }

  /**
   * Initialize Groq connector with API key
   */
  async initialize(apiKey) {
    if (!apiKey) {
      throw new Error('Groq API key is required. Get one free at https://console.groq.com');
    }

    // Validate API key format (Groq keys typically start with 'gsk_')
    if (!apiKey.startsWith('gsk_')) {
      console.warn('⚠️ API key does not start with "gsk_" - this may not be a valid Groq API key');
    }

    this.apiKey = apiKey;
    console.log('✅ Groq connector initialized with API key:', apiKey.substring(0, 7) + '...');
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
   * Send message to Groq and get response
   */
  async sendMessage(userMessage) {
    if (!this.apiKey) {
      throw new Error('Groq API key not set. Please configure in settings.');
    }

    // Add user message to history
    this.addMessage('user', userMessage);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('No response from Groq');
      }

      // Add assistant response to history
      this.addMessage('assistant', assistantMessage);

      return {
        success: true,
        message: assistantMessage,
        usage: data.usage
      };

    } catch (error) {
      console.error('Groq API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stream message to Groq (for real-time responses)
   */
  async streamMessage(userMessage, onChunk, onComplete) {
    if (!this.apiKey) {
      throw new Error('Groq API key not set');
    }

    this.addMessage('user', userMessage);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
          console.error('❌ Groq API error response:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        throw new Error(`Groq API error: ${errorMessage}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content;

              if (content) {
                fullMessage += content;
                if (onChunk) onChunk(content);
              }
            } catch (e) {
              console.warn('Failed to parse chunk:', e);
            }
          }
        }
      }

      this.addMessage('assistant', fullMessage);
      if (onComplete) onComplete(fullMessage);

      return { success: true, message: fullMessage };

    } catch (error) {
      console.error('Groq streaming error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const groqConnector = new GroqConnector();
