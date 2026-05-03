import { RouterProvider } from "react-router"
import { router } from "./app.routes"
import { AuthProvider } from "./features/auth/auth.context"
import { InterviewProvider } from "./features/interview/interview.context"


const cors = require('cors'); 



// Allow requests from your local frontend AND your deployed frontend URL
app.use(cors({
    origin: [
        'http://localhost:5173', // Vite default local port
        'https://skill-bridge-ai-production.up.railway.app' // Add your production frontend URL here when you deploy it
    ],
    credentials: true, 
}));



function App() {


  return (
    <>
      <AuthProvider>
        <InterviewProvider>
          <RouterProvider router={router} />
        </InterviewProvider>
      </AuthProvider>
    </>
  )
}

export default App
