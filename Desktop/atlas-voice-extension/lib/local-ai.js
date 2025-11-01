/**
 * Local AI - Browser-only AI responses without external API
 * Provides pattern-based responses for common queries and commands
 */

export class LocalAI {
  constructor() {
    this.conversationHistory = [];
    this.userName = null;
    this.patterns = this.initializePatterns();
  }

  /**
   * Initialize response patterns
   */
  initializePatterns() {
    return {
      // Greetings
      greetings: {
        patterns: [/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i],
        responses: [
          "Hello! I'm Atlas, your browser-based assistant. How can I help you today?",
          "Hi there! I'm running in browser-only mode, so I can help with basic commands and conversation.",
          "Hey! I'm here to help. Ask me anything or give me a command!"
        ]
      },

      // Time queries
      time: {
        patterns: [/what time is it|current time|what's the time/i],
        handler: () => {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          return `It's currently ${timeStr}.`;
        }
      },

      // Date queries
      date: {
        patterns: [/what (is |'s )?(the )?date|what day is it|today's date/i],
        handler: () => {
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          return `Today is ${dateStr}.`;
        }
      },

      // Help queries
      help: {
        patterns: [/^(help|what can you do|capabilities|commands)/i],
        responses: [
          "I'm running in browser-only mode! I can:\n\n" +
          "• Answer basic questions (time, date, math)\n" +
          "• Have simple conversations\n" +
          "• Execute browser commands (if Desktop Commander is enabled)\n" +
          "• Remember our conversation during this session\n\n" +
          "Try asking me about the time, weather, or just chat with me!"
        ]
      },

      // Math queries
      math: {
        patterns: [/(?:what is |calculate |compute |solve )?(\d+)\s*([\+\-\*\/])\s*(\d+)/i],
        handler: (match) => {
          const num1 = parseFloat(match[1]);
          const operator = match[2];
          const num2 = parseFloat(match[3]);

          let result;
          switch (operator) {
            case '+': result = num1 + num2; break;
            case '-': result = num1 - num2; break;
            case '*': result = num1 * num2; break;
            case '/': result = num2 !== 0 ? num1 / num2 : 'undefined (division by zero)'; break;
            default: return null;
          }

          return `${num1} ${operator} ${num2} = ${result}`;
        }
      },

      // Name queries
      name: {
        patterns: [/(?:what is |what's )?(?:your|ur) name/i],
        responses: [
          "I'm Atlas, your browser-based voice assistant!",
          "My name is Atlas. I'm here to help you!",
          "I'm Atlas - running in browser-only mode right now."
        ]
      },

      // User introduction
      userIntro: {
        patterns: [/(?:my name is|i'm|i am|call me) (\w+)/i],
        handler: (match) => {
          this.userName = match[1];
          return `Nice to meet you, ${this.userName}! How can I help you today?`;
        }
      },

      // Thanks
      thanks: {
        patterns: [/^(thank you|thanks|thx|appreciate it)/i],
        responses: [
          "You're welcome!",
          "Happy to help!",
          "Anytime!",
          "My pleasure!"
        ]
      },

      // Goodbye
      goodbye: {
        patterns: [/^(bye|goodbye|see you|talk to you later|gtg|gotta go)/i],
        responses: [
          "Goodbye! Talk to you later!",
          "See you soon!",
          "Take care!",
          "Bye! Come back anytime!"
        ]
      },

      // Weather (informational - can't actually check)
      weather: {
        patterns: [/(?:what's|what is|how's|how is) (?:the )?weather/i],
        responses: [
          "I'm running in browser-only mode, so I can't check live weather data. Try opening weather.com or asking me something else!",
          "I don't have access to weather APIs in browser-only mode. You can check weather.com for current conditions!"
        ]
      },

      // How are you
      howAreYou: {
        patterns: [/how are you|how's it going|how are things/i],
        responses: [
          "I'm doing great! Running smoothly in your browser. How about you?",
          "All systems operational! How can I assist you today?",
          "Functioning perfectly! What can I help you with?"
        ]
      },

      // Browser info
      browserInfo: {
        patterns: [/what browser|browser info|browser version/i],
        handler: () => {
          const agent = navigator.userAgent;
          const browserName = agent.includes('Chrome') ? 'Chrome' :
                             agent.includes('Firefox') ? 'Firefox' :
                             agent.includes('Safari') ? 'Safari' : 'Unknown';
          return `You're using ${browserName}. I'm running as a browser extension in local mode!`;
        }
      }
    };
  }

  /**
   * Generate a response to user input
   * @param {string} userMessage - User's message
   * @returns {Promise<string>} AI response
   */
  async generateResponse(userMessage) {
    if (!userMessage || userMessage.trim() === '') {
      return "I didn't catch that. Could you repeat?";
    }

    // Store in conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });

    // Try to match patterns
    for (const [key, pattern] of Object.entries(this.patterns)) {
      for (const regex of pattern.patterns || []) {
        const match = userMessage.match(regex);
        if (match) {
          let response;

          // Use handler if available
          if (pattern.handler) {
            response = await pattern.handler.call(this, match);
            if (response) {
              this.conversationHistory.push({
                role: 'assistant',
                content: response,
                timestamp: Date.now()
              });
              return response;
            }
          }

          // Use random response from array
          if (pattern.responses) {
            response = pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
            this.conversationHistory.push({
              role: 'assistant',
              content: response,
              timestamp: Date.now()
            });
            return response;
          }
        }
      }
    }

    // Default fallback responses
    const fallbacks = [
      "I'm running in browser-only mode with limited capabilities. Could you rephrase that or ask something else?",
      "I'm not sure I understand. Try asking about the time, date, or say 'help' to see what I can do!",
      `Interesting question! In browser-only mode, my abilities are limited. Try asking me about basic things like time or math!`,
      "I don't have an answer for that in local mode. Want to try asking something else?",
      `${this.userName ? this.userName + ', ' : ''}I'm working with basic patterns right now. Ask me about the time or date, or say 'help' to see my capabilities!`
    ];

    const response = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    this.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });

    return response;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.userName = null;
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Add a custom pattern (for extensibility)
   */
  addPattern(name, patterns, handler) {
    this.patterns[name] = { patterns, handler };
  }
}

// Export singleton instance
export const localAI = new LocalAI();
