'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Position {
  id: string
  title: string
  department: string
}

export default function NewCandidatePage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [positionId, setPositionId] = useState('')
  const [source, setSource] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadPositions() {
      const { data } = await supabase
        .from('positions')
        .select('id, title, department')
        .eq('status', 'open')
      if (data) setPositions(data)
    }
    loadPositions()
  }, [supabase])

  const handleCVUpload = async (file: File) => {
    setCvFile(file)
    setParsing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/ai/parse-cv', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.firstName) setFirstName(data.firstName)
        if (data.lastName) setLastName(data.lastName)
        if (data.email) setEmail(data.email)
        if (data.phone) setPhone(data.phone)
      }
    } catch (err) {
      console.error('CV parsing error:', err)
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get user's organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      let organizationId = profile?.organization_id

      // If no organization, create one
      if (!organizationId) {
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({
            name: 'My Organization',
            slug: `org-${Date.now()}`,
          })
          .select()
          .single()
        
        if (newOrg) {
          organizationId = newOrg.id
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              organization_id: newOrg.id,
              email: user.email!,
              role: 'admin',
            })
        }
      }

      // Create candidate
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          organization_id: organizationId,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          position_id: positionId || null,
          source,
          status: 'new',
        })
        .select()
        .single()

      if (candidateError) throw candidateError

      // Trigger AI scoring
      if (candidate) {
        fetch('/api/ai/score-candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: candidate.id }),
        }).catch(console.error)

        // Create event
        await supabase.from('events').insert({
          organization_id: organizationId,
          event_type: 'candidate_created',
          entity_type: 'candidate',
          entity_id: candidate.id,
          payload: { firstName, lastName, email, positionId },
        })
      }

      router.push('/dashboard/recruitment')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/recruitment"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Candidate</h1>
          <p className="text-muted-foreground mt-1">Enter candidate information or upload a CV</p>
        </div>
      </div>

      {/* CV Upload */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">AI-Powered CV Parsing</h2>
        </div>
        <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleCVUpload(e.target.files[0])}
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          {parsing ? (
            <p className="text-primary font-medium">Parsing CV with AI...</p>
          ) : cvFile ? (
            <p className="text-foreground font-medium">{cvFile.name}</p>
          ) : (
            <>
              <p className="text-foreground font-medium">Drop CV here or click to upload</p>
              <p className="text-sm text-muted-foreground mt-1">PDF, DOC, or DOCX up to 10MB</p>
            </>
          )}
        </label>
      </div>

      {/* Manual Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground mb-4">Candidate Information</h2>
        
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Position
          </label>
          <select
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a position</option>
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.title} - {position.department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select source</option>
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
            <option value="referral">Referral</option>
            <option value="website">Company Website</option>
            <option value="agency">Recruitment Agency</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Candidate'}
          </button>
          <Link
            href="/dashboard/recruitment"
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
