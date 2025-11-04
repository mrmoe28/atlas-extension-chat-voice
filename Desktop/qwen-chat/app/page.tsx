'use client'

import { useState } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { Message } from './lib/types'

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m Qwen, your AI assistant. How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
    }
  ])

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.content 
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <main className="container mx-auto p-4 h-screen">
      <div className="max-w-4xl mx-auto h-full">
        <header className="text-center py-6">
          <h1 className="text-3xl font-bold text-primary">Qwen Chat</h1>
          <p className="text-muted-foreground mt-2">
            Powered by Qwen AI Assistant
          </p>
        </header>
        
        <ChatInterface 
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </main>
  )
}
