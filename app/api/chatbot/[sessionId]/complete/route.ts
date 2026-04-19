import { NextResponse } from 'next/server'
import { completeChatbotSession } from '@/lib/workflow/engine'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { qualificationScore, qualificationData } = await request.json()

    const session = await completeChatbotSession(
      sessionId,
      qualificationScore || 70,
      qualificationData || {}
    )

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Complete chatbot error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete chatbot session' },
      { status: 500 }
    )
  }
}
