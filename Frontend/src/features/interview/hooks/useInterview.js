import { generateInterviewReport , getInterviewReportById, getAllInterviewReports, generateResumePdf } from "../services/interview.api";
import { useContext } from "react"
import {InterviewContext} from "../interview.context"




export const useInterview = () =>{
    
    const context = useContext(InterviewContext)

    if(!context){
        throw new Error("useInterview must be used within InterviewProvider")
    }

    const { loading, setLoading, report , setReport, reports , setReports} = context

    const generateReport = async ({jobDescription, selfDescription, resumeFile}) =>{

        setLoading(true)
        try{
            const response = await generateInterviewReport({
                jobDescription,
                selfDescription,
                resumeFile
            })
            setReport(response.data)
            return response.data
        }catch(error){
            console.error("Error generating interview report", error.message)
            // Surface backend validation errors to the user
            const errorMsg = error?.response?.data?.message || error.message
            alert(errorMsg)
        }finally{
            setLoading(false)
        }
    }

    const getReportById = async(interviewId) =>{
        setLoading(true)
        try{
            const response = await getInterviewReportById(interviewId)
            setReport(response.data)
        }catch(error){
            console.error("Error fetching interview report", error.message)
        }finally{
            setLoading(false)
        }
    }

    const getReports = async ()=>{
        setLoading(true)
        try{
            const response = await getAllInterviewReports()
            setReports(response.data)
        }catch(error){
            console.error("Error fetching interview reports", error.message)
        }finally{
            setLoading(false)
        }
    }

    const downloadResumePdf = async (interviewReportId, title) => {
        try {
            const blob = await generateResumePdf(interviewReportId)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Resume_${title || 'SkillBridge'}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error downloading resume PDF", error.message)
            const errorMsg = error?.response?.data?.message || error.message
            alert(errorMsg || "Failed to generate resume PDF")
        }
    }
    

    return {
        loading,
        generateReport,
        getReportById,
        getReports,
        downloadResumePdf,
        report,
        reports
    }
}       