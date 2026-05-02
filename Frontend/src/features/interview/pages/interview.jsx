import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import {useInterview} from '../hooks/useInterview'
import { useParams, useNavigate } from 'react-router'
import { jsPDF } from 'jspdf'



const TABS = [
  { id: 'technical', label: 'Technical Questions', icon: '⟐' },
  { id: 'behavioral', label: 'Behavioral Questions', icon: '◈' },
  { id: 'roadmap', label: 'Road Map', icon: '▦' },
]

const Interview = () => {
  const [activeTab, setActiveTab] = useState('technical')
  const { report, getReportById, getReports, reports, loading, downloadResumePdf } = useInterview()
  const [expandedCard, setExpandedCard] = useState(null)
  const [resumeGenerating, setResumeGenerating] = useState(false)
  const data = report
  const navigate = useNavigate()

  const {interviewId} = useParams();

  useEffect(() => {
    if(interviewId){
      getReportById(interviewId)
    }
    getReports()
  }, [interviewId])

  const getRelativeTime = (dateStr) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading || !data) {
    return (
      <main className="interview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#aaa', fontSize: '1.1rem' }}>Loading report…</p>
      </main>
    )
  }
  

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 18
    const contentW = pageW - margin * 2
    let y = margin

    const checkPage = (needed = 12) => {
      if (y + needed > pageH - margin) {
        doc.addPage()
        y = margin
      }
    }

    // Header
    doc.setFillColor(14, 16, 21)
    doc.rect(0, 0, pageW, 42, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(232, 234, 237)
    doc.text('SkillBridge AI', margin, 18)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(139, 143, 163)
    doc.text('Interview Preparation Report', margin, 26)
    doc.setTextColor(92, 224, 216)
    doc.text(`Match Score: ${data.matchScore}%`, pageW - margin, 18, { align: 'right' })
    doc.setTextColor(139, 143, 163)
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 26, { align: 'right' })
    y = 52

    const sectionTitle = (title) => {
      checkPage(18)
      doc.setFillColor(24, 26, 34)
      doc.roundedRect(margin, y - 2, contentW, 10, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(92, 224, 216)
      doc.text(title, margin + 4, y + 5)
      y += 16
    }

    const renderQuestion = (q, idx) => {
      checkPage(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(232, 234, 237)
      const qLines = doc.splitTextToSize(`${String(idx + 1).padStart(2, '0')}. ${q.question}`, contentW - 4)
      doc.text(qLines, margin + 2, y)
      y += qLines.length * 5 + 2

      checkPage(10)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(93, 219, 138)
      doc.text('Suggested Answer:', margin + 4, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(139, 143, 163)
      const aLines = doc.splitTextToSize(q.answer, contentW - 8)
      for (const line of aLines) {
        checkPage(6)
        doc.text(line, margin + 4, y)
        y += 4.5
      }
      y += 2

      checkPage(10)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(240, 184, 66)
      doc.text('Intention:', margin + 4, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(85, 88, 112)
      const iLines = doc.splitTextToSize(q.intention, contentW - 8)
      for (const line of iLines) {
        checkPage(6)
        doc.text(line, margin + 4, y)
        y += 4.5
      }
      y += 6
    }

    // Technical Questions
    sectionTitle(`Technical Questions (${data.technicalQuestions.length})`)
    data.technicalQuestions.forEach((q, i) => renderQuestion(q, i))

    // Behavioral Questions
    sectionTitle(`Behavioral Questions (${data.behaviourQuestions.length})`)
    data.behaviourQuestions.forEach((q, i) => renderQuestion(q, i))

    // Preparation Roadmap
    sectionTitle('7-Day Preparation Plan')
    data.preparationPlan.forEach((day) => {
      checkPage(16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(92, 224, 216)
      doc.text(`Day ${day.day}`, margin + 2, y)
      doc.setTextColor(232, 234, 237)
      const dayLabel = `Day ${day.day}`
      doc.text(` — ${day.focus}`, margin + 2 + doc.getTextWidth(dayLabel), y)
      y += 6

      day.tasks.forEach((task) => {
        checkPage(8)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(139, 143, 163)
        const tLines = doc.splitTextToSize(`>  ${task}`, contentW - 10)
        for (const line of tLines) {
          checkPage(6)
          doc.text(line, margin + 6, y)
          y += 4.5
        }
      })
      y += 5
    })

    // Skill Gaps
    sectionTitle(`Skill Gaps (${data.skillGaps.length})`)
    data.skillGaps.forEach((gap) => {
      checkPage(8)
      const colorMap = { high: [240, 98, 146], medium: [240, 184, 66], low: [93, 219, 138] }
      const color = colorMap[gap.severity] || [139, 143, 163]
      doc.setFillColor(...color)
      doc.circle(margin + 4, y - 1, 1.5, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(232, 234, 237)
      doc.text(gap.skill, margin + 9, y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...color)
      doc.text(gap.severity.toUpperCase(), pageW - margin, y, { align: 'right' })
      y += 7
    })

    // Footer on each page
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(85, 88, 112)
      doc.text('Generated by SkillBridge AI', margin, pageH - 8)
      doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' })
    }

    doc.save(`SkillBridge_Report_${data.title || 'Interview'}.pdf`)
  }

  const toggleCard = (index) => {
    setExpandedCard(expandedCard === index ? null : index)
  }

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high': return 'severity--high'
      case 'medium': return 'severity--medium'
      case 'low': return 'severity--low'
      default: return ''
    }
  }

  const renderQuestionCard = (item, index) => {
    const isExpanded = expandedCard === index
    return (
      <div
        className={`question-card ${isExpanded ? 'question-card--expanded' : ''}`}
        key={index}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        <div className="question-card__header" onClick={() => toggleCard(index)}>
          <span className="question-card__number">{String(index + 1).padStart(2, '0')}</span>
          <p className="question-card__question">{item.question}</p>
          <span className={`question-card__toggle ${isExpanded ? 'question-card__toggle--open' : ''}`}>+</span>
        </div>
        {isExpanded && (
          <div className="question-card__body">
            <div className="question-card__section">
              <span className="question-card__label">Suggested Answer</span>
              <p className="question-card__text">{item.answer}</p>
            </div>
            <div className="question-card__section">
              <span className="question-card__label question-card__label--intent">Intention</span>
              <p className="question-card__text question-card__text--intent">{item.intention}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRoadmap = () => (
    <div className="roadmap">
      <div className="roadmap__timeline">
        {data.preparationPlan.map((day, index) => (
          <div className="roadmap__day" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="roadmap__day-marker">
              <span className="roadmap__day-number">Day {day.day}</span>
              <div className="roadmap__day-line" />
            </div>
            <div className="roadmap__day-content">
              <h3 className="roadmap__day-focus">{day.focus}</h3>
              <ul className="roadmap__tasks">
                {day.tasks.map((task, tIndex) => (
                  <li className="roadmap__task" key={tIndex}>
                    <span className="roadmap__task-bullet">›</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'technical':
        return (
          <div className="content-section">
            <div className="content-section__header">
              <h2 className="content-section__title">Technical Questions</h2>
              <span className="content-section__count">{data.technicalQuestions.length} questions</span>
            </div>
            <div className="content-section__list">
              {data.technicalQuestions.map((q, i) => renderQuestionCard(q, i))}
            </div>
          </div>
        )
      case 'behavioral':
        return (
          <div className="content-section">
            <div className="content-section__header">
              <h2 className="content-section__title">Behavioral Questions</h2>
              <span className="content-section__count">{data.behaviourQuestions.length} questions</span>
            </div>
            <div className="content-section__list">
              {data.behaviourQuestions.map((q, i) => renderQuestionCard(q, i))}
            </div>
          </div>
        )
      case 'roadmap':
        return (
          <div className="content-section">
            <div className="content-section__header">
              <h2 className="content-section__title">7-Day Preparation Plan</h2>
              <span className="content-section__count">your roadmap</span>
            </div>
            {renderRoadmap()}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <main className="interview">
      {/* Left Sidebar — Navigation */}
      <aside className="interview__sidebar">
        <div className="interview__sidebar-top">
          <div className="interview__logo">
            <span className="interview__logo-mark">S</span>
            <span className="interview__logo-text">SkillBridge</span>
          </div>
        </div>

        <nav className="interview__nav">
          <span className="interview__nav-label">Sections</span>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`interview__nav-btn ${activeTab === tab.id ? 'interview__nav-btn--active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setExpandedCard(null) }}
            >
              <span className="interview__nav-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="interview__sidebar-bottom">
          <span className="interview__nav-label" style={{ display: 'block', marginBottom: '8px' }}>Recent Reports</span>
          <div className="interview__recent-list">
            {reports && reports.length > 0 ? (
              reports.slice(0, 6).map((r) => (
                <button
                  key={r._id}
                  className={`interview__recent-item ${r._id === interviewId ? 'interview__recent-item--active' : ''}`}
                  onClick={() => navigate(`/interview/${r._id}`)}
                >
                  <div className="interview__recent-info">
                    <span className="interview__recent-title">{r.title || 'Untitled Report'}</span>
                    <span className="interview__recent-time">{getRelativeTime(r.createdAt)}</span>
                  </div>
                  <span className="interview__recent-score">{r.matchScore}%</span>
                </button>
              ))
            ) : (
              <p className="interview__recent-empty">No other reports yet</p>
            )}
          </div>
        </div>
      </aside>

      {/* Center — Main Content */}
      <section className="interview__content">
        {renderContent()}
      </section>

      {/* Right Sidebar */}
      <aside className="interview__panel">
        <div className="interview__panel-section" style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--iv-border-subtle)', marginBottom: '1.5rem' }}>
          <div className="interview__score-ring" style={{ margin: '0 auto 10px' }}>
            <svg viewBox="0 0 120 120" className="interview__score-svg">
              <circle cx="60" cy="60" r="52" className="interview__score-track" />
              <circle
                cx="60" cy="60" r="52"
                className="interview__score-fill"
                strokeDasharray={`${(data.matchScore / 100) * 327} 327`}
              />
            </svg>
            <div className="interview__score-value">
              <span className="interview__score-number">{data.matchScore}</span>
              <span className="interview__score-unit">%</span>
            </div>
          </div>
          <span className="interview__score-label" style={{ display: 'block', marginBottom: '1.5rem' }}>Match Score</span>
          
          <h3 className="interview__panel-title" style={{ textAlign: 'left' }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="interview__download-btn" onClick={downloadPDF}>
              <span className="interview__download-icon">↓</span>
              Download Preparation
            </button>
            <button
              className="interview__download-btn interview__download-btn--resume"
              onClick={async () => {
                setResumeGenerating(true)
                await downloadResumePdf(interviewId, data.title)
                setResumeGenerating(false)
              }}
              disabled={resumeGenerating}
            >
              <span className="interview__download-icon">{resumeGenerating ? '⏳' : '↓'}</span>
              {resumeGenerating ? 'Generating Resume...' : 'Download Resume'}
            </button>
          </div>
        </div>

        <div className="interview__panel-section">
          <h3 className="interview__panel-title">Skill Gaps</h3>
          <div className="interview__gaps">
            {data.skillGaps.map((gap, i) => (
              <div
                className={`interview__gap-tag ${getSeverityClass(gap.severity)}`}
                key={i}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="interview__gap-dot" />
                <span className="interview__gap-text">{gap.skill}</span>
                <span className="interview__gap-severity">{gap.severity}</span>
              </div>
            ))}
          </div>
        </div>

      </aside>
    </main>
  )
}

export default Interview