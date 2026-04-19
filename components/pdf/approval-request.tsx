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
    borderBottom: '2 solid #8b5cf6',
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
    fontWeight: 'bold',
  },
  highlightBox: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  salaryBox: {
    backgroundColor: '#8b5cf6',
    padding: 20,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  salaryLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 5,
  },
  salaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  aiScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 10,
    borderRadius: 8,
  },
  aiScoreLabel: {
    color: '#1e40af',
    marginRight: 10,
  },
  aiScoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  textBlock: {
    color: '#1e293b',
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #e2e8f0',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderBottom: '1 solid #1e293b',
    marginBottom: 5,
    height: 30,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#64748b',
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

interface ApprovalRequestPDFProps {
  approval: {
    proposed_salary: number
    proposed_start_date: string
    justification: string
    candidates: {
      first_name: string
      last_name: string
      email: string
      ai_score: number
    }
    positions: { title: string; department: string }
  }
}

export function ApprovalRequestPDF({ approval }: ApprovalRequestPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>HR Approval Request</Text>
          <Text style={styles.subtitle}>
            Generated on {new Date().toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidate Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {approval.candidates?.first_name} {approval.candidates?.last_name}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{approval.candidates?.email}</Text>
          </View>
          {approval.candidates?.ai_score && (
            <View style={styles.aiScore}>
              <Text style={styles.aiScoreLabel}>AI Match Score:</Text>
              <Text style={styles.aiScoreValue}>{approval.candidates.ai_score}%</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Position:</Text>
            <Text style={styles.value}>{approval.positions?.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Department:</Text>
            <Text style={styles.value}>{approval.positions?.department}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compensation Package</Text>
          <View style={styles.salaryBox}>
            <Text style={styles.salaryLabel}>Proposed Annual Salary</Text>
            <Text style={styles.salaryValue}>
              ${approval.proposed_salary?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Proposed Start Date:</Text>
            <Text style={styles.value}>
              {approval.proposed_start_date 
                ? new Date(approval.proposed_start_date).toLocaleDateString()
                : 'To be determined'}
            </Text>
          </View>
        </View>

        {approval.justification && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Justification</Text>
            <Text style={styles.textBlock}>{approval.justification}</Text>
          </View>
        )}

        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Approvals</Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>HR Manager Signature</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Department Head Signature</Text>
            </View>
          </View>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          HR Platform - Confidential Document
        </Text>
      </Page>
    </Document>
  )
}
