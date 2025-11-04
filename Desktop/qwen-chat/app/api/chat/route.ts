import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  }))
})

// Mock responses - Replace with actual Qwen API integration
const mockResponses = [
  "That's an interesting question! Let me think about it...",
  "I understand what you're asking. Here's my perspective on that:",
  "Thanks for sharing that with me. I'd be happy to help!",
  "That's a great point. Let me provide some additional context:",
  "I see what you mean. Here's how I would approach that:",
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = ChatRequestSchema.parse(body)
    
    // Get the last user message
    const lastMessage = validatedData.messages[validatedData.messages.length - 1]
    
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock AI response - Replace this with actual Qwen API call
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
    const response = `${randomResponse} You asked: "${lastMessage.content}"`

    return NextResponse.json({ 
      message: response 
    })
    
  } catch (error) {
    console.error('Chat API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Chat API is running',
    timestamp: new Date().toISOString()
  })
}
