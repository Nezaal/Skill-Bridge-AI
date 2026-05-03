require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")
const PORT = process.env.PORT || 5000;
const cors = require('cors'); 


connectToDB()



// Allow requests from your local frontend AND your deployed frontend URL
app.use(cors({
    origin: [
        'http://localhost:5173', // Vite default local port
        'https://skill-bridge-ai-production.up.railway.app' // Add your production frontend URL here when you deploy it
    ],
    credentials: true, 
}));


// Adding '0.0.0.0' explicitly tells Express to accept connections from outside the container
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});


// generateInterviewReport({ resume, selfDescription, jobDescription })