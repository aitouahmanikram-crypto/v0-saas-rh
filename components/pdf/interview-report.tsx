'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #3b82f6',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1 solid #e2e8f0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 140,
    color: '#64748b',
  },
  value: {
    flex: 1,
    color: '#1e293b',
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scoreBox: {
    width: '30%',
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  overallScore: {
    padding: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  overallScoreLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 5,
  },
  overallScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  recommendation: {
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textBlock: {
    color: '#1e293b',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 9,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
})

interface InterviewReportPDFProps {
  evaluation: {
    overall_score: number
    technical_score: number
    communication_score: number
    culture_fit_score: number
    recommendation: string
    strengths: string
    weaknesses: string
    comments: string
    candidates: {
      first_name: string
      last_name: string
      email: string
      positions?: { title: string }
    }
    profiles: { full_name: string }
  }
}

export function InterviewReportPDF({ evaluation }: InterviewReportPDFProps) {
  const recommendationColors: Record<string, { bg: string; text: string }> = {
    strong_hire: { bg: '#dcfce7', text: '#166534' },
    hire: { bg: '#d1fae5', text: '#059669' },
    no_hire: { bg: '#fee2e2', text: '#dc2626' },
    strong_no_hire: { bg: '#fecaca', text: '#991b1b' },
  }

  const recConfig = recommendationColors[evaluation.recommendation] || { bg: '#f1f5f9', text: '#475569' }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Interview Evaluation Report</Text>
          <Text style={styles.subtitle}>
            Generated on {new Date().toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidate Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {evaluation.candidates?.first_name} {evaluation.candidates?.last_name}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{evaluation.candidates?.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Position:</Text>
            <Text style={styles.value}>{evaluation.candidates?.positions?.title || 'Not specified'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Evaluator:</Text>
            <Text style={styles.value}>{evaluation.profiles?.full_name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluation Scores</Text>
          <View style={styles.scoresGrid}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Technical</Text>
              <Text style={styles.scoreValue}>{evaluation.technical_score}/5</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Communication</Text>
              <Text style={styles.scoreValue}>{evaluation.communication_score}/5</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Culture Fit</Text>
              <Text style={styles.scoreValue}>{evaluation.culture_fit_score}/5</Text>
            </View>
          </View>
          <View style={styles.overallScore}>
            <Text style={styles.overallScoreLabel}>Overall Score</Text>
            <Text style={styles.overallScoreValue}>{evaluation.overall_score}/5</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <View style={[styles.recommendation, { backgroundColor: recConfig.bg }]}>
            <Text style={[styles.recommendationText, { color: recConfig.text }]}>
              {evaluation.recommendation?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {evaluation.strengths && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            <Text style={styles.textBlock}>{evaluation.strengths}</Text>
          </View>
        )}

        {evaluation.weaknesses && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas for Improvement</Text>
            <Text style={styles.textBlock}>{evaluation.weaknesses}</Text>
          </View>
        )}

        {evaluation.comments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Comments</Text>
            <Text style={styles.textBlock}>{evaluation.comments}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          HR Platform - Confidential Document
        </Text>
      </Page>
    </Document>
  )
}
