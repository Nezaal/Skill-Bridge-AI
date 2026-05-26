import React, { useState, useRef } from 'react'
import { useInterview } from '../hooks/useInterview'
import { useNavigate } from 'react-router'


import Loader from '../../../components/Loader/Loader'

const Home = () => {

    const { loading, generateReport } = useInterview()
    const [jobDescription, setJobDescription] = useState('')

    const [selfDescription, setSelfDescription] = useState('')

    const resumeInputref = useRef()
    const navigate = useNavigate()

    const handleGenerateReport = async (e) => {
        e.preventDefault()
        const resumeFile = resumeInputref.current.files[0]

        if (!resumeFile) {
            alert('Please upload your resume.')
            return
        }
        if (!jobDescription || jobDescription.trim().length < 20) {
            alert('Please enter a meaningful job description (at least 20 characters).')
            return
        }
        if (!selfDescription || selfDescription.trim().length < 20) {
            alert('Please enter a meaningful self description (at least 20 characters).')
            return
        }

        const data = await generateReport({ jobDescription, selfDescription, resumeFile })
        if (data?._id) {
            navigate(`/interview/${data._id}`)
        }
    }

    if (loading) {
        return <Loader text="Generating your personalized interview report..." />
    }

    return (
        <main className='home'>
            <header className="home-header">
                <div>
                    <p className="home-kicker">SkillBridge AI</p>
                    <h1>Prepare a focused interview report.</h1>
                </div>
                <p>
                    Add the role, your background, and your resume. The report will use all three inputs to shape practice questions and feedback.
                </p>
            </header>

            <form className="interview-workbench" onSubmit={handleGenerateReport}>
                <section className='job-section' aria-labelledby="job-description-label">
                    <div className="section-heading">
                        <p className="step-label">Step 01</p>
                        <label id="job-description-label" htmlFor="jobDescription">Job description</label>
                    </div>
                    <textarea
                        onChange={(e) => { setJobDescription(e.target.value) }}
                        name="jobDescription"
                        id="jobDescription"
                        placeholder='Paste the job description here. Include responsibilities, required skills, and any seniority expectations.'
                    />
                </section>

                <aside className="candidate-panel">
                    <div className="input-group upload-group">
                        <div>
                            <p className="step-label">Step 02</p>
                            <label htmlFor="resume">Resume</label>
                        </div>
                        <input ref={resumeInputref} type="file" name='resume' id='resume' accept='.pdf,.doc,.docx' />
                    </div>

                    <div className="input-group">
                        <div>
                            <p className="step-label">Step 03</p>
                            <label htmlFor="selfDescription">Your background</label>
                        </div>

                        <textarea
                            onChange={(e) => { setSelfDescription(e.target.value) }}
                            name="selfDescription"
                            id="selfDescription"
                            placeholder='Summarize your experience, target role, strengths, weak spots, and anything you want the interview to focus on.'
                        />
                    </div>

                    <button
                        type="submit"
                        className="generate-btn"
                    >
                        Generate Interview Report
                    </button>
                </aside>
            </form>
        </main>
    )
}

export default Home
