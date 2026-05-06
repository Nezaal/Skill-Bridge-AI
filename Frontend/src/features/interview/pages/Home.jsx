import React, { useState , useRef } from 'react'
import { useInterview } from '../hooks/useInterview'
import { useNavigate } from 'react-router'


import Loader from '../../../components/Loader/Loader'

const Home = () => {

    const { loading, generateReport} = useInterview()
    const  [jobDescription, setJobDescription] = useState('')

    const [selfDescription, setSelfDescription] = useState('')

    const resumeInputref = useRef()
    const navigate = useNavigate()

    const handleGenerateReport = async(e) =>{
        e.preventDefault()
        const resumeFile  = resumeInputref.current.files[0]

        // Client-side validation
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

        const data = await generateReport({jobDescription, selfDescription, resumeFile})
        if (data?._id) {
            navigate(`/interview/${data._id}`)
        }
    }

    if(loading){
        return <Loader text="Generating your personalized interview report..." />
    }

  return (
    <main className='home'>
        <div className='left'>
            <textarea
            onChange={ (e) =>{setJobDescription(e.target.value)}}
            name="jobDescription" id="jobDescription" placeholder='Enter your job description here...'></textarea>
        </div>
        <div className="right">
            <div className="input-group">

                <label htmlFor="resume"> Upload resume</label>
                <input ref={resumeInputref} type="file" name='resume'id='resume' accept='.pdf | .docx' />

            </div>
            <div className="input-group">

                <label htmlFor="selfDescription"> self description</label>

                <textarea
                onChange={(e) => {setSelfDescription(e.target.value)}}
                name="selfDescription" id="selfDescription" placeholder='Enter your self description here...'>
                

                </textarea>

            </div>

            <button 
            type="button"
            onClick={ handleGenerateReport }
            className="generate-btn">Generate Interview Report

            </button>
        </div>

    </main>
  )
}

export default Home