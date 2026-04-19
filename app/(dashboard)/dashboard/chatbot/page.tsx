import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, MessageSquare, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react'
import Link from 'next/link'

export default async function ChatbotPage() {
  const supabase = await createClient()

  // Get candidates in chatbot stage - simplified query
  const { data: chatbotCandidates } = await supabase
    .from('candidates')
    .select('*')
    .in('status', ['chatbot', 'screening'])
    .order('created_at', { ascending: false })

  // Get positions for display
  const { data: positions } = await supabase
    .from('positions')
    .select('id, title, department')

  // Get chatbot sessions for these candidates
  const candidateIds = chatbotCandidates?.map(c => c.id) || []
  const { data: sessions } = candidateIds.length > 0 
    ? await supabase
        .from('chatbot_sessions')
        .select('*')
        .in('candidate_id', candidateIds)
    : { data: [] }

  // Get completed chatbot sessions
  const { data: completedSessions } = await supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(10)

  // Get candidates for completed sessions
  const completedCandidateIds = completedSessions?.map(s => s.candidate_id).filter(Boolean) || []
  const { data: completedCandidates } = completedCandidateIds.length > 0
    ? await supabase
        .from('candidates')
        .select('id, first_name, last_name, email, position_id')
        .in('id', completedCandidateIds)
    : { data: [] }

  // Create lookup maps
  const positionMap = new Map(positions?.map(p => [p.id, p]) || [])
  const sessionMap = new Map<string, Record<string, unknown>[]>()
  sessions?.forEach(s => {
    const existing = sessionMap.get(s.candidate_id) || []
    sessionMap.set(s.candidate_id, [...existing, s])
  })
  const candidateMap = new Map(completedCandidates?.map(c => [c.id, c]) || [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"><AlertCircle className="mr-1 h-3 w-3" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Chatbot</h1>
        <p className="text-muted-foreground">Manage AI-powered candidate pre-qualification interviews</p>
      </div>

      {/* Candidates Ready for Chatbot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Candidates Ready for Pre-qualification
          </CardTitle>
          <CardDescription>
            Candidates in screening or chatbot stage who need AI interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chatbotCandidates && chatbotCandidates.length > 0 ? (
            <div className="space-y-4">
              {chatbotCandidates.map((candidate: Record<string, unknown>) => {
                const candidateSessions = sessionMap.get(candidate.id as string) || []
                const hasSession = candidateSessions.length > 0
                const latestSession = hasSession ? candidateSessions[0] : null
                const position = positionMap.get(candidate.position_id as string)
                
                return (
                  <div 
                    key={candidate.id as string}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {candidate.first_name as string} {candidate.last_name as string}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {position?.title || 'No position'} - {candidate.email as string}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {latestSession ? (
                        <>
                          {getStatusBadge(latestSession.status as string)}
                          {latestSession.assessment_score && (
                            <Badge variant="outline">
                              Score: {latestSession.assessment_score as number}%
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary">No session</Badge>
                      )}
                      <Link href={`/dashboard/chatbot/${candidate.id}`}>
                        <Button size="sm">
                          <Play className="mr-2 h-4 w-4" />
                          {hasSession ? 'Continue' : 'Start'} Interview
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No candidates ready for chatbot interview</p>
              <p className="text-sm text-muted-foreground">
                Candidates will appear here after their CV is parsed and scored
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Completed Sessions
          </CardTitle>
          <CardDescription>
            View results from completed chatbot interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedSessions && completedSessions.length > 0 ? (
            <div className="space-y-4">
              {completedSessions.map((session: Record<string, unknown>) => {
                const sessionCandidate = candidateMap.get(session.candidate_id as string)
                const sessionPosition = sessionCandidate ? positionMap.get(sessionCandidate.position_id) : null
                
                return (
                  <div 
                    key={session.id as string}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {sessionCandidate?.first_name || 'Unknown'}{' '}
                          {sessionCandidate?.last_name || 'Candidate'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sessionPosition?.title || 'Unknown position'} - Completed {session.completed_at ? new Date(session.completed_at as string).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {session.assessment_score && (
                        <Badge 
                          className={
                            (session.assessment_score as number) >= 70 
                              ? 'bg-green-100 text-green-800' 
                              : (session.assessment_score as number) >= 50 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          Score: {session.assessment_score as number}%
                        </Badge>
                      )}
                      {sessionCandidate && (
                        <Link href={`/dashboard/recruitment/${sessionCandidate.id}`}>
                          <Button variant="outline" size="sm">View Candidate</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No completed sessions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
