require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")
const PORT = process.env.PORT || 5000;


connectToDB()



// Adding '0.0.0.0' explicitly tells Express to accept connections from outside the container
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});


// generateInterviewReport({ resume, selfDescription, jobDescription })