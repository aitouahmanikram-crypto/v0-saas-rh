'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useEffect, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Send, Bot, User, CheckCircle } from 'lucide-react'

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  positions?: { title: string }
}

export default function ChatbotPage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = use(params)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chatbot',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          candidateId,
          sessionId,
        },
      }),
    }),
  })

  useEffect(() => {
    async function loadData() {
      // Load candidate
      const { data: cand } = await supabase
        .from('candidates')
        .select('*, positions(title)')
        .eq('id', candidateId)
        .single()
      
      if (cand) setCandidate(cand)

      // Check for existing session or create new
      const { data: existingSession } = await supabase
        .from('chatbot_sessions')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingSession && existingSession.status !== 'completed') {
        setSessionId(existingSession.id)
      } else {
        // Create new session
        const { data: newSession } = await supabase
          .from('chatbot_sessions')
          .insert({
            candidate_id: candidateId,
            status: 'pending',
            messages: [],
          })
          .select()
          .single()
        
        if (newSession) setSessionId(newSession.id)
      }
    }
    loadData()
  }, [candidateId, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === 'streaming') return
    sendMessage({ text: input })
    setInput('')
  }

  const completeSession = async () => {
    if (!sessionId) return

    // Calculate qualification score based on conversation length and engagement
    const score = Math.min(100, 50 + messages.length * 5)

    await supabase
      .from('chatbot_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        qualification_score: score,
        qualification_data: {
          messageCount: messages.length,
          completedAt: new Date().toISOString(),
        },
      })
      .eq('id', sessionId)

    // Update candidate status
    await supabase
      .from('candidates')
      .update({ status: 'interview' })
      .eq('id', candidateId)

    // Create event
    await supabase.from('events').insert({
      event_type: 'chatbot_completed',
      entity_type: 'candidate',
      entity_id: candidateId,
      payload: { sessionId, score },
    })

    window.location.href = `/dashboard/recruitment/${candidateId}`
  }

  const getMessageText = (message: typeof messages[0]) => {
    if (!message.parts) return ''
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/recruitment/${candidateId}`}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              AI Interview: {candidate?.first_name} {candidate?.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {candidate?.positions?.title || 'Pre-qualification screening'}
            </p>
          </div>
        </div>
        {messages.length > 3 && (
          <button
            onClick={completeSession}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Complete Interview
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 mx-auto mb-4 text-primary opacity-50" />
            <p className="text-muted-foreground">
              Start the AI interview by sending a message
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {"The AI will conduct a pre-qualification screening for the candidate"}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[70%] rounded-xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap">{getMessageText(message)}</p>
            </div>
          </div>
        ))}

        {status === 'streaming' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm">AI is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={status === 'streaming'}
          />
          <button
            type="submit"
            disabled={!input.trim() || status === 'streaming'}
            className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
