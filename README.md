# 🚀 Skill Bridge AI

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/AI_Powered-FF6F00?style=for-the-badge&logo=google&logoColor=white" alt="AI Powered" />
</p>

## 🌟 Overview

**Skill Bridge AI** is a comprehensive, full-stack application designed to revolutionize interview preparation. By leveraging advanced Artificial Intelligence, the platform conducts realistic mock interviews, analyzes user responses, and generates detailed, actionable performance reports (including downloadable PDFs). 

Built with a strong emphasis on clean architecture, separation of concerns, and modern user experience, this project demonstrates proficiency in full-stack JavaScript development, API integration, and database management.

---

## 🏗️ System Architecture

Skill Bridge AI follows a robust **Client-Server architecture** with a well-defined **Service Layer** on the backend to handle complex business logic (AI integration and PDF generation) independently from the routing and controller layers.
```mermaid
flowchart TD

subgraph group_client["React Client"]
  node_auth_pages["Auth Pages"]
  node_interview_pages["Interview Pages"]
  node_auth_hook["Auth Hook<br/>[useAuth.js]"]
  node_interview_hook["Interview Hook<br/>[useInterview.js]"]
  node_auth_api["Auth API Client<br/>[auth.api.js]"]
  node_interview_api["Interview API Client<br/>[interview.api.js]"]
end

subgraph group_api["Express API"]
  node_auth_routes["Auth Routes<br/>[auth.routes.js]"]
  node_interview_routes["Interview Routes"]
  node_auth_middleware["Auth Middleware<br/>[auth.middleware.js]"]
  node_auth_controller["Auth Controller<br/>[auth.controller.js]"]
  node_interview_controller["Interview Controller"]
end

subgraph group_logic["Business Logic"]
  node_ai_service["AI Report Service<br/>[ai.service.js]"]
  node_ats_service["ATS Matching<br/>[ats.service.js]"]
  node_pdf_service["PDF Rendering<br/>[pdf.service.js]"]
end

subgraph group_data["Persistence"]
  node_user_model["User Model<br/>[user.model.js]"]
  node_report_model["Report Model"]
  node_blacklist_model["Token Blacklist"]
end

subgraph group_integrations["External Integrations"]
  node_mongo[("MongoDB")]
  node_llm["Google Gemini"]
end

node_user(("Candidate"))
node_pdf_result["Resume PDF"]
node_google["Google OAuth"]
node_github["GitHub OAuth"]

node_user -->|"uses"| node_auth_pages
node_user -->|"submits inputs"| node_interview_pages
node_auth_pages -->|"invokes"| node_auth_hook
node_interview_pages -->|"invokes"| node_interview_hook
node_auth_hook -->|"requests auth"| node_auth_api
node_interview_hook -->|"requests reports"| node_interview_api
node_auth_api -->|"calls"| node_auth_routes
node_interview_api -->|"calls"| node_interview_routes
node_auth_routes -->|"dispatches"| node_auth_controller
node_interview_routes -->|"guards"| node_auth_middleware
node_auth_middleware -->|"dispatches"| node_interview_controller
node_auth_controller -->|"reads/writes"| node_user_model
node_auth_controller -->|"blacklists token"| node_blacklist_model
node_auth_controller -.->|"verifies login"| node_google
node_auth_controller -.->|"exchanges OAuth"| node_github
node_interview_controller -->|"generates report"| node_ai_service
node_interview_controller -->|"computes match"| node_ats_service
node_interview_controller -->|"renders resume"| node_pdf_service
node_interview_controller -->|"stores report"| node_report_model
node_user_model -->|"persists users"| node_mongo
node_report_model -->|"persists reports"| node_mongo
node_blacklist_model -->|"persists tokens"| node_mongo
node_ai_service -->|"prompts model"| node_llm
node_pdf_service -->|"produces PDF"| node_pdf_result
node_auth_routes -->|"returns auth"| node_auth_api
node_interview_routes -->|"returns report"| node_interview_api
node_auth_api -->|"returns user"| node_auth_hook
node_interview_api -->|"returns data"| node_interview_hook
node_auth_hook -->|"updates state"| node_auth_pages
node_interview_hook -->|"updates state"| node_interview_pages

click node_auth_pages "https://github.com/nezaal/skill-bridge-ai/tree/main/Frontend/src/features/auth/pages"
click node_interview_pages "https://github.com/nezaal/skill-bridge-ai/tree/main/Frontend/src/features/interview/pages"
click node_auth_hook "https://github.com/nezaal/skill-bridge-ai/blob/main/Frontend/src/features/auth/hooks/useAuth.js"
click node_interview_hook "https://github.com/nezaal/skill-bridge-ai/blob/main/Frontend/src/features/interview/hooks/useInterview.js"
click node_auth_api "https://github.com/nezaal/skill-bridge-ai/blob/main/Frontend/src/features/auth/services/auth.api.js"
click node_interview_api "https://github.com/nezaal/skill-bridge-ai/blob/main/Frontend/src/features/interview/services/interview.api.js"
click node_auth_routes "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/routes/auth.routes.js"
click node_interview_routes "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/routes/interview.routes.js"
click node_auth_middleware "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/middlewares/auth.middleware.js"
click node_auth_controller "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/controllers/auth.controller.js"
click node_interview_controller "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/controllers/interview.controller.js"
click node_ai_service "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/services/ai.service.js"
click node_ats_service "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/services/ats.service.js"
click node_pdf_service "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/services/pdf.service.js"
click node_user_model "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/models/user.model.js"
click node_report_model "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/models/interviewReport.model.js"
click node_blacklist_model "https://github.com/nezaal/skill-bridge-ai/blob/main/Backend/src/models/blacklist.models.js"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_auth_pages,node_interview_pages,node_auth_hook,node_interview_hook,node_auth_api,node_interview_api toneBlue
class node_auth_routes,node_interview_routes,node_auth_middleware,node_auth_controller,node_interview_controller toneAmber
class node_ai_service,node_ats_service,node_pdf_service toneMint
class node_user_model,node_report_model,node_blacklist_model toneRose
class node_mongo,node_llm,node_user,node_pdf_result,node_google,node_github toneIndigo
```

---

## ✨ Key Features

- **🤖 AI-Powered Mock Interviews:** Context-aware questioning mechanism that adapts to user input using integrated AI services.
- **📊 Comprehensive Feedback & Analytics:** Generates detailed performance metrics and stores interview reports.
- **📄 Dynamic PDF Generation:** Users can export their personalized feedback reports as professionally formatted PDFs.
- **🔐 Secure Authentication:** JWT-based user authentication, password hashing, and token blacklisting mechanisms.
- **🎨 Modern Frontend Design:** Responsive, component-driven UI built with React, Vite, and SCSS modules.

---

## 📂 Project Structure

The repository is structured as a **Monorepo**, cleanly separating the frontend client and the backend API.
```text
Skill-Bridge-AI/
├── Backend/                 # Node.js / Express Server
│   ├── src/
│   │   ├── config/          # Database & Environment configuration
│   │   ├── controllers/     # Request handlers (auth, interviews)
│   │   ├── middlewares/     # Auth & File parsing middlewares
│   │   ├── models/          # Mongoose Schemas (User, Report, Blacklist)
│   │   ├── routes/          # API route definitions
│   │   └── services/        # Core business logic (ai.service.js, pdf.service.js)
│   └── server.js            # Application entry point
│
└── Frontend/                # React / Vite Client
    ├── src/
    │   ├── components/      # Reusable UI components (Loader, etc.)
    │   ├── features/        # Feature-sliced architecture (auth, interview)
    │   │   ├── auth/        # Context, Pages (Login/Register), API services
    │   │   └── interview/   # Interview UI, hooks, Context, API services
    │   ├── style/           # Global SCSS stylesheets
    │   ├── App.jsx          # Root component
    │   └── main.jsx         # React DOM renderer
```

---

## 💡 Technical Highlights (For Interviewers)

1. **Feature-Sliced Design (Frontend):** The React application organizes code by feature (`auth`, `interview`) rather than purely by file type. This improves maintainability, scalability, and code discovery.

2. **Service-Oriented Backend:** Business logic like communicating with the AI model (`ai.service.js`) and generating PDFs (`pdf.service.js`) are decoupled from controllers. This adheres to the **Single Responsibility Principle (SRP)** and makes the code highly testable.

3. **Security Best Practices:** Implementation of a token blacklist (`blacklist.models.js`) prevents compromised or logged-out JWTs from being reused.

4. **Custom Styling Architecture:** Utilizing SCSS with scoped styles ensures a conflict-free, highly customizable design system without over-relying on heavy UI frameworks.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance (Local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/yourusername/Skill-Bridge-AI.git](https://github.com/yourusername/Skill-Bridge-AI.git)
   cd Skill-Bridge-AI
   ```

2. **Setup Backend**
   
```bash
   cd Backend
   npm install
   # Create a .env file with PORT, MONGODB_URI, JWT_SECRET, and AI_API_KEY
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd ../Frontend
   npm install
   # Create a .env file for VITE_API_BASE_URL
   npm run dev
   ```

---

## 📄 License
This project is open-source and available under the standard MIT License.
