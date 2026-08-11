import { RouterProvider } from "react-router"
import { router } from "./app.routes"
import { AuthProvider } from "./features/auth/auth.context"
import { InterviewProvider } from "./features/interview/interview.context"
import { Analytics } from "@vercel/analytics/react"

function App() {


  return (
    <>
      <AuthProvider>
        <InterviewProvider>
          <RouterProvider router={router} />
        </InterviewProvider>
      </AuthProvider>

      <Analytics /> 
    </>
  )
}

export default App
