"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Event {
  id: string
  event_type: string
  entity_type: string
  entity_id: string
  payload: Record<string, unknown>
  processed: boolean
  processed_at: string | null
  error: string | null
  created_at: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated events for demo
    setEvents([
      {
        id: "1",
        event_type: "candidate_created",
        entity_type: "candidate",
        entity_id: "c1",
        payload: { candidate_name: "Alice Johnson", position: "Senior Software Engineer" },
        processed: true,
        processed_at: new Date(Date.now() - 3600000).toISOString(),
        error: null,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: "2",
        event_type: "chatbot_completed",
        entity_type: "chatbot_session",
        entity_id: "cs1",
        payload: { candidate_name: "Bob Smith", qualification_score: 85 },
        processed: true,
        processed_at: new Date(Date.now() - 7200000).toISOString(),
        error: null,
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: "3",
        event_type: "evaluation_submitted",
        entity_type: "evaluation",
        entity_id: "e1",
        payload: { candidate_name: "Carol Williams", recommendation: "hire" },
        processed: true,
        processed_at: new Date(Date.now() - 86400000).toISOString(),
        error: null,
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "4",
        event_type: "approval_requested",
        entity_type: "approval_request",
        entity_id: "ar1",
        payload: { candidate_name: "David Brown", proposed_salary: 95000 },
        processed: false,
        processed_at: null,
        error: null,
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: "5",
        event_type: "document_generated",
        entity_type: "document",
        entity_id: "d1",
        payload: { document_type: "interview_report", candidate_name: "Eva Davis" },
        processed: true,
        processed_at: new Date(Date.now() - 172800000).toISOString(),
        error: null,
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ])
    setLoading(false)
  }, [])

  const eventTypeLabels: Record<string, string> = {
    candidate_created: "Candidate Created",
    chatbot_completed: "Chatbot Completed",
    interview_completed: "Interview Completed",
    evaluation_submitted: "Evaluation Submitted",
    approval_requested: "Approval Requested",
    approval_completed: "Approval Completed",
    document_generated: "Document Generated",
    employee_created: "Employee Created",
    turnover_prediction: "Turnover Prediction"
  }

  const processedCount = events.filter(e => e.processed).length
  const pendingCount = events.filter(e => !e.processed && !e.error).length
  const failedCount = events.filter(e => e.error).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Bus</h1>
        <p className="text-muted-foreground">Monitor system events and inter-module communication</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully handled events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Events with errors</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Stream</CardTitle>
          <CardDescription>Real-time view of system events</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No events recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`mt-1 p-2 rounded-full ${
                    event.error 
                      ? "bg-destructive/10" 
                      : event.processed 
                        ? "bg-success/10" 
                        : "bg-warning/10"
                  }`}>
                    {event.error ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : event.processed ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {event.entity_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {JSON.stringify(event.payload)}
                    </p>
                    {event.error && (
                      <p className="text-sm text-destructive mt-1">{event.error}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
