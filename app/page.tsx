import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  Users, 
  Sparkles, 
  BarChart3, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const features = [
    {
      icon: Users,
      title: 'Recruitment Pipeline',
      description: 'Manage candidates from application to hire with full workflow tracking',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Screening',
      description: 'Automated CV parsing, scoring, and chatbot pre-qualification',
    },
    {
      icon: MessageSquare,
      title: 'Conversational Chatbot',
      description: 'AI interviewer for initial candidate screening and assessment',
    },
    {
      icon: CheckCircle,
      title: 'Evaluation System',
      description: 'Structured interview feedback with scoring and recommendations',
    },
    {
      icon: TrendingUp,
      title: 'Talent Management',
      description: '9-Box matrix for performance and potential assessment',
    },
    {
      icon: BarChart3,
      title: 'Turnover Prediction',
      description: 'AI-powered attrition risk analysis and retention recommendations',
    },
    {
      icon: FileText,
      title: 'Document Generation',
      description: 'Automated PDF reports for interviews and approvals',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">HR Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/sign-up"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered HR Management
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
          Intelligent Talent Management
          <br />
          <span className="text-primary">From Recruitment to Retention</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          A complete HR SaaS platform with AI-powered recruitment, evaluation workflows, 
          talent assessment, and turnover prediction. Manage your entire employee lifecycle in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link 
            href="/auth/sign-up"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/auth/login"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            View Demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need for Modern HR
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            13 integrated modules powered by AI and event-driven architecture
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-muted/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              End-to-End HR Workflow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From candidate to employee with full traceability
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4">
            {['Candidate Created', 'AI Scoring', 'Chatbot Interview', 'Evaluation', 'Approval', 'Employee Onboarded'].map((step, index) => (
              <div key={step} className="flex items-center gap-4">
                <div className="px-4 py-2 bg-card rounded-lg border border-border text-sm font-medium text-foreground">
                  {step}
                </div>
                {index < 5 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Ready to Transform Your HR?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Join organizations using AI-powered HR management to hire better and retain talent.
        </p>
        <Link 
          href="/auth/sign-up"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Get Started Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>HR Platform - Intelligent Talent Management System</p>
          <p className="mt-2">Built with Next.js, Supabase, and Vercel AI SDK</p>
        </div>
      </footer>
    </div>
  )
}
