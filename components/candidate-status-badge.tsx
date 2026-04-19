const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'New' },
  screening: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Screening' },
  chatbot: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Chatbot' },
  interview: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Interview' },
  evaluation: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Evaluation' },
  approval: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Approval' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  hired: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hired' },
  withdrawn: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Withdrawn' },
}

interface CandidateStatusBadgeProps {
  status: string
}

export function CandidateStatusBadge({ status }: CandidateStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
