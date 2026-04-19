import { NextResponse } from 'next/server'
import { completeInterview } from '@/lib/workflow/engine'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { notes } = await request.json()

    const interview = await completeInterview(id, notes)

    return NextResponse.json({ success: true, interview })
  } catch (error) {
    console.error('Complete interview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete interview' },
      { status: 500 }
    )
  }
}
