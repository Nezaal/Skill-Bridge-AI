import React from 'react'

const Home = () => {
  return (
    <main className='home'>
        <div className='left'>
            <textarea name="jobDescription" id="jobDescription" placeholder='Enter your job description here...'></textarea>
        </div>
        <div className="right">
            <div className="input-group">
                <label htmlFor="resume"> Upload resume</label>
                <input type="file" name='resume'id='resume' accept='.pdf | .docx' />
            </div>
            <div className="input-group">
                <label htmlFor="selfDescription"> self description</label>
                <textarea name="selfDescription" id="selfDescription" placeholder='Enter your self description here...'></textarea>
            </div>
            <button className="generate-btn">Generate Interview Report</button>
        </div>

    </main>
  )
}

export default Home