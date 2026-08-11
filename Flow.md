# 🔄 SkillBridge AI — Execution Flow

A function-level trace of how execution moves between files and functions in this monorepo. The project is a React (Vite) + Express (MongoDB) app for AI-powered mock interviews.

All references use `file:line` so you can jump straight to the code.

---

## Table of Contents

- [0. Runtime Entry Points](#0-runtime-entry-points)
- [1. Auth Flows](#1-auth-flows)
  - [1.1 Register](#11-register)
  - [1.2 Login](#12-login)
  - [1.3 Google OAuth](#13-google-oauth)
  - [1.4 GitHub OAuth](#14-github-oauth)
  - [1.5 Session Restore (getMe)](#15-session-restore-getme)
  - [1.6 Logout](#16-logout)
- [2. Interview Flows](#2-interview-flows)
  - [2.1 Generate Interview Report (core AI flow)](#21-generate-interview-report-core-ai-flow)
  - [2.2 View Report (interview.jsx)](#22-view-report)
  - [2.3 List Reports (sidebar)](#23-list-reports-sidebar)
  - [2.4 Download Preparation PDF (client-side jsPDF)](#24-download-preparation-pdf-client-side-jspdf)
  - [2.5 Download Resume PDF (server-side Puppeteer)](#25-download-resume-pdf-server-side-puppeteer)
- [3. Route → Middleware → Controller Map](#3-route--middleware--controller-map)
- [4. Module Dependency Graph](#4-module-dependency-graph)
- [5. Shared Axios Instances](#5-shared-axios-instances)
- [6. Supporting / Dev Scripts](#6-supporting--dev-scripts)
- [7. Deploy Configs](#7-deploy-configs)
- [8. Known Bugs / Gotchas Found While Tracing](#8-known-bugs--gotchas-found-while-tracing)

---

## 0. Runtime Entry Points

### Backend — `Backend/server.js`

```
Backend/server.js
  1   require("dotenv").config()                  // loads Backend/.env into process.env
  2   const app = require("./src/app")            // ← EXPRESS APP FACTORY
  3   const connectToDB = require("./src/config/database")
  4   const PORT = process.env.PORT || 5000
  8   connectToDB()                                // fire-and-forget; NOT awaited before listen
 16  app.listen(PORT, '0.0.0.0', cb)              // binds all interfaces (container friendly)
```

- `server.js:8` — `connectToDB()` starts the Mongo connection but is not awaited. Requests that arrive before the DB connects will hit `bufferCommands: false` (see `database.js:21`) and fail fast rather than queue.
- `server.js:2` → `Backend/src/app.js:7` creates the Express `app`, but the listen happens back in `server.js`, not in `app.js`.

### `Backend/src/app.js` — Express bootstrap

```
src/app.js
 10  app.use(express.json())                     // parse JSON bodies
 11  app.use(cookieParser())                     // req.cookies
 12  app.use(express.urlencoded({extended:true}))// form bodies
 13  app.use(cors({ origin: [localhost:5173, localhost:5000, railway, vercel], credentials:true }))
 24  const authRouter = require("./routes/auth.routes")
 25  const interviewRouter = require("./routes/interview.routes")
 29  app.use("/api/auth", authRouter)
 30  app.use("/api/interview", interviewRouter)
 33  module.exports = app
```

Global middleware runs in registration order for **every** request: `json` → `cookieParser` → `urlencoded` → `cors`. Then routing dispatches by prefix.

### `Backend/src/config/database.js` — Mongo connection (cached)

```
src/config/database.js
  9   let cached = global.mongoose            // reuse across hot-reloads (nodemon / serverless)
 14  async function connectToDB()
 24    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands:false })
 29    cached.conn = await cached.promise
 35    return cached.conn
```

- `bufferCommands: false` (line 21) means model operations throw immediately if the connection isn't ready.
- Connection is cached on `global.mongoose` so `npm run dev` (nodemon restarts) reuses the live connection.

### Frontend — `Frontend/index.html` → `src/main.jsx`

```
Frontend/index.html
 11  <script type="module" src="/src/main.jsx">    // Vite entry

src/main.jsx
  8  createRoot(document.getElementById('root')).render(
  9    <StrictMode>
 10      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
 12        <App />
 13      </GoogleOAuthProvider>
 14  )
```

- `StrictMode` double-invokes effects in dev (so `getMe` runs twice — harmless here).
- `GoogleOAuthProvider` must wrap anything that renders `@react-oauth/google`'s `<GoogleLogin/>`.

### `src/App.jsx` — Provider nesting (order matters)

```
src/App.jsx
 12  <AuthProvider>                          // features/auth/auth.context.jsx
 13    <InterviewProvider>                   // features/interview/interview.context.jsx
 14      <RouterProvider router={router} />  // from app.routes.jsx
```

Contexts wrap the router, so **every** route/component below can consume `useAuth()` and `useInterview()`.

### `src/app.routes.jsx` — Route table

```
src/app.routes.jsx:10
  /login                    → <Login/>                                (public)
  /register                 → <Register/>                             (public)
  /                         → <Protected><Home/></Protected>          (guarded)
  /interview/:interviewId   → <Protected><Interview/></Protected>     (guarded)
```

`Protected` is the gatekeeper for the last two routes (see §1.5).

---

## 1. Auth Flows

### 1.1 Register

**Flow:** `Register.jsx` → `useAuth.handleRegister` → `auth.api.register` → `POST /api/auth/register` → `registerUserController` → `user.model` → cookie → `navigate('/')`

```
features/auth/pages/Register.jsx:17   handleSubmit(e)
  e.preventDefault() ; setErrorMessage('')
  await handleRegister({ username, email, password })   // ← hook
  navigate('/')                                         // on success
  catch → setErrorMessage(error?.response?.data?.message || error?.message)

features/auth/hooks/useAuth.js:25     handleRegister(...)
  setLoading(true)
  await register({...})                                // ← API fn
  setUser(data.user)                                   // auth.context state
  catch → throw err (re-thrown to page)                // finally setLoading(false)

features/auth/services/auth.api.js:7  register({username,email,password})
  api.post("/api/auth/register", { username, email, password })  // axios, withCredentials
  returns response.data

--- HTTP POST /api/auth/register ---

routes/auth.routes.js:17              authRouter.post("/register", registerUserController)

controllers/auth.controller.js:39     registerUserController(req,res)
  42  if (!username || !email || !password)        → 400 "please provide username, email and password"
  48  const exists = userModel.findOne({ $or:[{username},{email}] })
  52  if (exists)                                   → 400 "account already exists with this email"
  58  const hash = bcrypt.hash(password, 10)         // 10 salt rounds
  59  const user = userModel.create({username,email,password:hash})
  65  const token = jwt.sign({id,username}, JWT_SECRET, {expiresIn:"1d"})
  70  setAuthCookie(res, token)                       // helper → res.cookie("token", …) httpOnly
  72  res.status(201).json({ message, user:{id,username,email} })
```

Cookie options (`auth.controller.js:16-24`): `httpOnly:true`, `sameSite` = `none` in production else `lax`, `secure` only in production.

**Response** → `Register.jsx:23` `setUser` → `navigate('/')` → `Protected` renders `<Home/>`.

### 1.2 Login

**Flow:** `Login.jsx` → `useAuth.handleLogin` → `auth.api.login` → `POST /api/auth/login` → `loginUserController` → cookie → `navigate('/')`

```
features/auth/pages/Login.jsx:25      handleSubmit(e)
  await handleLogin({ email, password })
  navigate('/')

hooks/useAuth.js:13                   handleLogin(...)
  await login({...}) ; setUser(data.user)

services/auth.api.js:23               login({email,password})
  api.post("/api/auth/login", { email, password })

--- HTTP POST /api/auth/login ---

routes/auth.routes.js:27              authRouter.post("/login", loginUserController)

controllers/auth.controller.js:81     loginUserController(req,res)
  84  const user = userModel.findOne({ email })
  85  if (!user)                                      → 400 "Invalid email or password"
  91  if (!user.password)                             → 400 "Please sign in with Google" (OAuth-only account)
  97  const ok = bcrypt.compare(password, user.password)
  98  if (!ok)                                        → 400 "Invalid password"
 104  const token = jwt.sign({...}, JWT_SECRET, {expiresIn:"1d"})
 110  setAuthCookie(res, token)
 111  res.status(200).json({ message, user:{id,username,email} })
```

### 1.3 Google OAuth

**Flow:** `Login.jsx` (Google button) → `useAuth.handleGoogleLogin` → `auth.api.googleLogin` → `POST /api/auth/google` → `googleLoginController` (verify token → find-or-create user) → cookie → `navigate('/')`

```
features/auth/pages/Login.jsx:38      handleGoogleSuccess(credentialResponse)  // @react-oauth/google onSuccess
  await handleGoogleLogin({ credential: credentialResponse.credential })
  navigate('/')
  onError → setErrorMessage('Google sign-in failed…')

hooks/useAuth.js:49                   handleGoogleLogin({credential})
  await googleLogin({ credential }) ; setUser(data.user)

services/auth.api.js:36               googleLogin({credential})
  api.post("/api/auth/google", { credential })

--- HTTP POST /api/auth/google ---

routes/auth.routes.js:48              authRouter.post("/google", googleLoginController)

controllers/auth.controller.js:148    googleLoginController(req,res)
 150  const idToken = req.body.credential || req.body.token || req.body.idToken
 152  if (!idToken)                                   → 400 "Google credential is required"
 158  if (!process.env.GOOGLE_CLIENT_ID)              → 500 "Google client id is not configured"
 164  const ticket = client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })
                                                    // client = OAuth2Client (auth.controller.js:6)
 169  const {email,name,picture,sub:googleId} = ticket.getPayload()
 172  if (!email || !googleId)                        → 401 "Invalid Google account details"
 178  let user = userModel.findOne({ $or:[{googleId},{email}] })
 182  if (!user)          → userModel.create({ username:`${base}_${googleId.slice(-6)}`, email, googleId, picture, authProvider:"google" })
 195  else if (!user.googleId) → link: user.googleId/picture/authProvider = … ; await user.save()
 202  const token = jwt.sign({...}, JWT_SECRET, {expiresIn:"1d"})
 208  setAuthCookie(res, token)
 210  res.status(200).json({ message, user:{id,username,email,picture} })
```

### 1.4 GitHub OAuth

**Flow (two HTTP legs + full page redirect, unlike the API calls above):**

```
features/auth/hooks/useAuth.js:60     handleGithubLogin()
  window.location.href = `${apiBaseUrl}/api/auth/github`   // full browser navigation, not axios

--- HTTP GET /api/auth/github ---

routes/auth.routes.js:51              authRouter.get("/github", githubLoginController)

controllers/auth.controller.js:225    githubLoginController(req,res)
 232  callbackUrl = GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback"
 233  params = { client_id, redirect_uri: callbackUrl, scope:"user:email" }
 239  res.redirect(`https://github.com/login/oauth/authorize?${params}`)   // → GitHub UI

--- User authorizes → GitHub redirects to /api/auth/github/callback?code=... ---

routes/auth.routes.js:53              authRouter.get('/github/callback', githubCallbackController)

controllers/auth.controller.js:241    githubCallbackController(req,res)
 243  const { code } = req.query
 247  if (!code)                                      → 400 "GitHub code is required"
 259  fetch POST https://github.com/login/oauth/access_token  (client_id+secret+code+redirect_uri)
 273  const accessToken = tokenData.access_token
 275  if (!accessToken)                               → 401 "GitHub login failed"
 286  fetch GET https://api.github.com/user            (Authorization: Bearer …)
 297  fetch GET https://api.github.com/user/emails
 308  primaryEmail = emails.find(e => e.primary && e.verified)?.email
 312  if (!githubUser.id || !primaryEmail)            → 401 "must have a verified primary email"
 319  let user = userModel.findOne({ $or:[{githubId},{email:primaryEmail}] })
 323  if (!user)   → userModel.create({ username: createProviderUsername(githubUser.login, primaryEmail, githubId, "githubuser"), email, githubId, picture:avatar_url, authProvider:"github" })
 331  else if (!user.githubId) → link githubId/picture/authProvider; await user.save()
 338  const token = createAppToken(user)              // helper (auth.controller.js:8) — jwt.sign
 340  setAuthCookie(res, token)
 341  res.redirect(FRONTEND_URL || "http://localhost:5173")   // back to the SPA
```

Helper `createProviderUsername` (`auth.controller.js:30-37`): lowercases `name || email-prefix`, strips non `[a-z0-9_]`, slices to 24 chars, appends `_` + last 6 of `providerId`.

### 1.5 Session Restore (getMe)

**Trigger:** `AuthProvider` mounts → `useEffect` fires once (double in StrictMode dev).

```
features/auth/auth.context.jsx:11     useEffect → getAndSetUser()
  await getMe() ; setUser(data.user)
  catch → ignore (not logged in)
  finally → setLoading(false)          // ← Protected waits on this flag

services/auth.api.js:60               getMe()
  api.get("/api/auth/get-me")

--- HTTP GET /api/auth/get-me (JWT cookie attached) ---

routes/auth.routes.js:45              authRouter.get("/get-me", authMiddleware.authUser, getMeController)

middlewares/auth.middleware.js:4      authUser(req,res,next)
  5  token = req.cookies.token || req.headers.authorization?.split(' ')[1]
  7  if (!token)                       → 401 "token not provided"
 13  blacklistTokenModel.findOne({token})
 17  if (blacklisted)                  → 401 "token is invalid. please login on again"
 25  decoded = jwt.verify(token, JWT_SECRET)   // throws on bad/expired → 401 "invalid token"
 27  req.user = decoded   // { id, username, iat, exp }
 28  next()

controllers/auth.controller.js:136    getMeController(req,res)
 137  user = userModel.findById(req.user.id)
 139  res.status(200).json({ message, user:{id,username,email} })
```

**Gatekeeper — `features/auth/components/Protected.jsx`:**

```
features/auth/components/Protected.jsx:8
  if (loading) return <Loader/>          // waits for the getMe round-trip
  if (!user)   return <Navigate to="/login"/>
  return children                         // renders <Home/> or <Interview/>
```

This is the chokepoint that protects both `/` and `/interview/:interviewId`.

### 1.6 Logout

```
hooks/useAuth.js:37                   handleLogout()
  await logout() ; setUser(null)

services/auth.api.js:50               logout()
  api.get("/api/auth/logout")

--- HTTP GET /api/auth/logout ---

routes/auth.routes.js:35              authRouter.get("/logout", logoutUserController)

controllers/auth.controller.js:122    logoutUserController(req,res)
 123  token = req.cookies.token || req.headers.authorization?.split(' ')[1]
 125  if (token) blacklistTokenModel.create({ token })   // permanent blacklist row (no expiry!)
 131  res.clearCookie("token", getAuthCookieOptions())
 132  res.status(200).json({ message:"user logged out successfully" })
```

The JWT is stored raw in the `blacklistToken` collection; `authUser` checks this collection on every protected request (§1.5).

---

## 2. Interview Flows

### 2.1 Generate Interview Report (core AI flow)

**Flow:** `Home.jsx` (form) → `useInterview.generateReport` → `interview.api.generateInterviewReport` (multipart) → `POST /api/interview` → `multer` → `authUser` → `generateInterviewReportController` (parse PDF → validate → Gemini → save) → FE navigates to `/interview/:id`

```
features/interview/pages/Home.jsx:18  handleGenerateReport(e)
  e.preventDefault()
  resumeFile = resumeInputref.current.files[0]      // <input ref type="file">
  if (!resumeFile)                → alert('Please upload your resume.')
  if (jobDescription.trim() < 20) → alert('Please enter a meaningful job description…')
  if (selfDescription.trim() < 20)→ alert('Please enter a meaningful self description…')
  data = await generateReport({ jobDescription, selfDescription, resumeFile })
  if (data?._id) navigate(`/interview/${data._id}`)

features/interview/hooks/useInterview.js:18  generateReport(...)
  setLoading(true)
  response = await generateInterviewReport({...})   // ← API fn
  setReport(response.data)                          // InterviewContext state
  return response.data
  catch → alert(error?.response?.data?.message || error.message)   // surfaces backend 400s
  finally → setLoading(false)

features/interview/services/interview.api.js:9   generateInterviewReport(...)
  formData.append("jobDescription"); formData.append("selfDescription"); formData.append("resume", resumeFile)
  api.post("/api/interview", formData, { headers:{ "Content-Type":"multipart/form-data" } })

--- HTTP POST /api/interview (multipart, cookie attached) ---

routes/interview.routes.js:15        interviewRouter.post("/", authUser, upload.single("resume"), generateInterviewReportController)

  [1] authUser (auth.middleware.js:4)     — same token/blacklist/verify as §1.5; sets req.user
  [2] upload.single("resume")             — file.middleware.js → multer memoryStorage, 3MB limit
      middleware order note: auth runs BEFORE multer, so 401 wins over file errors.

controllers/interview.controller.js:11  generateInterviewReportController(req,res)
 13  resumeFile = req.file                        // populated by multer
 15  if (!resumeFile)            → 400 "Resume file is required"
 26  parser = new PDFParse({ data: resumeFile.buffer, verbosity: VerbosityLevel.ERRORS })   // pdf-parse
 27  await parser.load()
 28  resumeText = (await parser.getText()).text
 30  await parser.destroy()
 31  catch(pdfError)             → 400 "Failed to parse the PDF file…"
 40  { selfDescription, jobDescription } = req.body
 45  if (jobDescription  < 20 chars)  → 400 "Job description must be at least 20 characters…"
 52  if (selfDescription < 20 chars)  → 400 "Self description must be at least 20 characters…"
 60  isGibberish(text)  // vowel-ratio check; <15% vowels → gibberish → 400
 85  interviewReportByAi = await generateInterviewReport({ resume: resumeText, selfDescription, jobDescription })
      ↓ ↓ ↓ (see AI sub-flow below)
 92  interviewReport = await interviewReportModel.create({
        user: req.user.id, resume, selfDescription, jobDescription,
        title: interviewReportByAi.title || "Software Engineering Interview",
        ...interviewReportByAi })
101  res.status(200).json({ success:true, data: interviewReport })
106  catch → 500 "Failed to generate interview report"
```

**AI sub-flow — `services/ai.service.js:77` `generateInterviewReport({resume,selfDescription,jobDescription})`:**

```
ai.service.js
  1  ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
  7  interviewReportSchema        // Gemini response schema: title, matchScore, technicalQuestions[],
                                 // behaviourQuestions[], skillGaps[], preparationPlan[]
 85  response = ai.models.generateContent({
         model: "gemini-flash-latest",
         contents: `generate an interview report… resume:${resume} selfDescription:${…} jobDescription:${…}`,
         config: { responseMimeType:"application/json", responseSchema } })
 94  result = JSON.parse(response.text)
 96  return result                 // ← back to controller line 85
```

**Schema contract** (`ai.service.js:7-75`): every object in `technicalQuestions`/`behaviourQuestions` needs `{question, intention, answer}`; `skillGaps` items need `{skill, severity ∈ [low|medium|high]}`; `preparationPlan` items need `{day, focus, tasks[]}`. `required: ["title","technicalQuestions","behaviourQuestions","skillGaps","preparationPlan"]`. Note `matchScore` is in the schema properties but NOT in `required`.

**Persistence — `models/interviewReport.model.js:100-138`:** stores `jobDescription`, `resume`, `selfDescription`, `matchScore` (0-100), `technicalQuestions[]`, `behaviourQuestions[]`, `skillGaps[]`, `preparationPlan[]`, `user` (ref User, required), `title` (required), `timestamps`.

**After response:** `Home.jsx:36` checks `data?._id` then `navigate('/interview/' + _id)` → `Protected` re-checks session → renders `<Interview/>`.

### 2.2 View Report

**Trigger:** route change to `/interview/:interviewId` mounts `Interview`; its `useEffect` runs (also re-runs when `interviewId` changes via sidebar clicks).

```
features/interview/pages/interview.jsx:27  useEffect([interviewId])
  if (interviewId) getReportById(interviewId)      // load the active report
  getReports()                                     // load sidebar list (always)

hooks/useInterview.js:39          getReportById(interviewId)
  setLoading(true)
  response = await getInterviewReportById(interviewId)   // ← API
  setReport(response.data)
  finally → setLoading(false)

services/interview.api.js:25      getInterviewReportById(interviewId)
  api.get(`/api/interview/report/${interviewId}`)

--- HTTP GET /api/interview/report/:interviewId ---

routes/interview.routes.js:22     interviewRouter.get("/report/:interviewId", authUser, getInterviewReportByIdController)

controllers/interview.controller.js:121  getInterviewReportByIdController(req,res)
 125  interviewReportModel.findOne({ _id: interviewId, user: req.user.id })   // ownership scoped
 130  if (!interviewReport) → 404 "interview report not found"
 136  res.status(200).json({ success:true, data: interviewReport })
```

**Render path** (`interview.jsx`):
- `:48` `if (loading || !data) return <Loader text="Loading report…"/>`
- `:278` `renderContent()` — `switch(activeTab)`: `technical` → `technicalQuestions.map(renderQuestionCard)`; `behavioral` → `behaviourQuestions.map(renderQuestionCard)`; `roadmap` → `renderRoadmap()` (renders `preparationPlan`)
- `:223` `renderQuestionCard(item,index)` — expandable card via `toggleCard` (`:210`, `expandedCard` state)
- `:376` score ring uses `data.matchScore`; `:416` skill gaps map with `getSeverityClass` (`:214`)

### 2.3 List Reports (sidebar)

```
hooks/useInterview.js:51          getReports()
  response = await getAllInterviewReports()    // ← API
  setReports(response.data)

services/interview.api.js:32      getAllInterviewReports()
  api.get("/api/interview")

--- HTTP GET /api/interview ---

routes/interview.routes.js:30     interviewRouter.get("/", authUser, getAllInterviewReportsController)

controllers/interview.controller.js:148  getAllInterviewReportsController(req,res)
 150  interviewReportModel.find({ user: req.user.id })
 153        .sort({ createdAt: -1 })
 155        .select("-resume -jobDescription -selfDescription -_v -updatedAt -technicalQuestions -behaviourQuestions -skillGaps -preparationPlan")
 157  res.status(200).json({ success:true, data: interviewReports })
```

Sidebar shows first 6 (`interview.jsx:348` `reports.slice(0,6)`), each button navigates to `/interview/${r._id}` (`:352`), which re-triggers the §2.2 effect.

### 2.4 Download Preparation PDF (client-side jsPDF)

**Entirely client-side — no backend call.**

```
interview.jsx:57      downloadPDF()
  doc = new jsPDF({unit:'mm', format:'a4'})
  … hand-drawn layout:
  - header band with title + Match Score + date
  - sectionTitle()    → rounded rect headers
  - renderQuestion()  → Q / Suggested Answer / Intention, auto page-breaks via checkPage()
  - technicalQuestions.forEach(renderQuestion)
  - behaviourQuestions.forEach(renderQuestion)
  - preparationPlan.forEach(day → tasks)
  - skillGaps.forEach(gap → colored dot + severity)
  - per-page footer loop (lines 198-205)
 207  doc.save(`SkillBridge_Report_${data.title || 'Interview'}.pdf`)
```

### 2.5 Download Resume PDF (server-side Puppeteer)

**Flow:** `Interview` "Download Resume" button → `useInterview.downloadResumePdf` → `interview.api.generateResumePdf` (blob) → `POST /api/interview/resume/pdf/:id` → `authUser` → `generateResumePdfController` → `ai.service.generateResumeHTML` (Gemini) → `pdf.service.generatePDFFromHTML` (Puppeteer) → PDF streamed → blob download

```
interview.jsx:399    onClick (Download Resume)
  setResumeGenerating(true)
  await downloadResumePdf(interviewId, data.title)
  setResumeGenerating(false)

hooks/useInterview.js:63      downloadResumePdf(interviewReportId, title)
  blob = await generateResumePdf(interviewReportId)        // ← API
  url = URL.createObjectURL(blob)
  <a href download=`Resume_${title || 'SkillBridge'}.pdf`> .click()
  URL.revokeObjectURL(url)
  catch → alert(error?.response?.data?.message || …)

services/interview.api.js:39  generateResumePdf(interviewReportId)
  api.post(`/api/interview/resume/pdf/${interviewReportId}`, {}, { responseType:"blob" })

--- HTTP POST /api/interview/resume/pdf/:interviewReportId ---

routes/interview.routes.js:39  interviewRouter.post("/resume/pdf/:interviewReportId", authUser, generateResumePdfController)

controllers/interview.controller.js:169  generateResumePdfController(req,res)
 174  interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })
 179  if (!interviewReport)         → 404 "Interview report not found"
 188  resumeHTML = await generateResumeHTML({ resume: interviewReport.resume,
                                            selfDescription: interviewReport.selfDescrption || "",   // ⚠️ TYPO — see §8
                                            jobDescription: interviewReport.jobDescription })
       ↓ ↓ ↓ (AI sub-flow)
 196  pdfBuffer = await generatePDFFromHTML(resumeHTML)     // Puppeteer
 199  fileName = `Resume_${interviewReport.title || "SkillBridge"}.pdf`
 201  res.set({ "Content-Type":"application/pdf", "Content-Disposition":`attachment; filename="${fileName}"`, "Content-Length": pdfBuffer.length })
 207  res.send(pdfBuffer)          // raw PDF bytes
```

**Resume HTML AI sub-flow — `ai.service.js:123` `generateResumeHTML({resume,selfDescription,jobDescription})`:**

```
ai.service.js
103  resumeHTMLSchema          // { html: string } required
125  prompt = long expert-resume prompt:
        - COMPLETE html doc, inline <style> only, system fonts
        - A4 print-ready (210mm × 297mm), navy #1a2332 + accent #2563eb
        - ATS-friendly sections: Header / Summary / Skills / Experience / Education
        - one page if possible, max two, no images/external resources
157  response = ai.models.generateContent({ model:"gemini-flash-latest", contents:prompt, config:{ responseMimeType:"application/json", responseSchema:resumeHTMLSchema } })
166  return JSON.parse(response.text).html      // ← back to controller line 188
```

**PDF sub-flow — `pdf.service.js:8` `generatePDFFromHTML(htmlContent)`:**

```
pdf.service.js
 13  browser = puppeteer.launch({ headless:true, args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"] })
 23  page = browser.newPage()
 25  await page.setContent(htmlContent, { waitUntil:"networkidle0" })
 30  await page.emulateMediaType("print")
 32  pdfBuffer = await page.pdf({ format:"A4", printBackground:true, preferCSSPageSize:true, scale:0.95, margin:0 })
 45  return Buffer.from(pdfBuffer)
 49  finally → browser.close()
```

**Client receives a `Blob`** (`responseType:"blob"`) → `useInterview.js:65-73` synthesizes a download link.

---

## 3. Route → Middleware → Controller Map

| Method | Route | Middleware chain | Controller function |
|---|---|---|---|
| POST | `/api/auth/register` | — | `registerUserController` |
| POST | `/api/auth/login` | — | `loginUserController` |
| GET | `/api/auth/logout` | — | `logoutUserController` |
| GET | `/api/auth/get-me` | `authUser` | `getMeController` |
| POST | `/api/auth/google` | — | `googleLoginController` |
| GET | `/api/auth/github` | — | `githubLoginController` |
| GET | `/api/auth/github/callback` | — | `githubCallbackController` |
| POST | `/api/interview/` | `authUser` → `upload.single("resume")` | `generateInterviewReportController` |
| GET | `/api/interview/report/:interviewId` | `authUser` | `getInterviewReportByIdController` |
| GET | `/api/interview/` | `authUser` | `getAllInterviewReportsController` |
| POST | `/api/interview/resume/pdf/:interviewReportId` | `authUser` | `generateResumePdfController` |

All `/api/*` requests first pass the global app middleware (json → cookie-parser → urlencoded → cors) defined in `src/app.js:10-21`.

---

## 4. Module Dependency Graph

```
Backend
  server.js ──► src/app.js ──► routes/auth.routes.js ──► controllers/auth.controller.js ──► models/user.model.js
  │  │                        │                          │                              └──► models/blacklist.models.js
  │  │                        │                          └──► (OAuth2Client from google-auth-library)
  │  └── src/config/database.js (mongoose)
  │       └── src/routes/interview.routes.js ──► middlewares/auth.middleware.js ──► models/blacklist.models.js
  │                                          └──► middlewares/file.middleware.js (multer)
  │                                          └──► controllers/interview.controller.js ──► services/ai.service.js (GoogleGenAI)
  │                                                                                     ├──► services/pdf.service.js (puppeteer)
  │                                                                                     └──► models/interviewReport.model.js

  standalone dev scripts (import services directly, no server):
    test-ai.js     → services/ai.service.js
    test_report.js → services/ai.service.js + services/temp.js
    test-models.js → @google/genai directly

Frontend
  index.html ──► src/main.jsx ──► src/App.jsx ──► features/auth/auth.context.jsx ──► services/auth.api.js (axios)
  │                              │             └─► features/interview/interview.context.jsx ──► services/interview.api.js (axios)
  │                              └─► src/app.routes.jsx
  │                                    ├── pages/Login.jsx ──► hooks/useAuth.js ──► services/auth.api.js ──► components/Loader/Loader.jsx
  │                                    ├── pages/Register.jsx ──► hooks/useAuth.js ──► services/auth.api.js ──► Loader
  │                                    ├── components/Protected.jsx ──► hooks/useAuth.js ──► Loader
  │                                    ├── pages/Home.jsx ──► hooks/useInterview.js ──► services/interview.api.js ──► Loader
  │                                    └── pages/interview.jsx ──► hooks/useInterview.js ──► services/interview.api.js (jspdf, client-side) ──► Loader
  └── style.scss + style/ (global styles)

  standalone dev scripts (Playwright E2E smoke tests against a running dev server):
    test_interview.cjs  → mocks get-me/report/interview routes, loads /interview/123
    test_crash.cjs      → loads /login, reloads, watches for page errors
```

---

## 5. Shared Axios Instances

Two separate axios instances (no shared client). Both resolve the same base URL and send cookies:

```
services/auth.api.js:3-6        baseURL = VITE_API_BASE_URL
                                || (PROD ? "https://skill-bridge-ai-production.up.railway.app" : "http://localhost:5000")
                                withCredentials: true

services/interview.api.js:4-7   identical resolution + withCredentials:true
```

`withCredentials:true` is what makes the `httpOnly` JWT cookie get sent on every request — required because the token is never read by JS.

---

## 6. Supporting / Dev Scripts

### Backend

| Script | Entry | Traces |
|---|---|---|
| `test-ai.js` | `require("dotenv").config({path:__dirname+"/.env"})` → `generateInterviewReport(...)` | Direct AI service call with hardcoded strings; prints report JSON or error |
| `test_report.js` | loads `.env` → `generateInterviewReport` using `services/temp.js` fixture data | Rehearses the exact data the controller sends (from `temp.js`) |
| `test-models.js` | `GoogleGenAI(...).models.list()` | Verifies API key / connectivity to Gemini |

`services/temp.js` exports `{resume, selfDescription, jobDescription}` — sample fixtures used only by `test_report.js`; **not** imported by the server app.

### Frontend (Playwright smoke tests — need `npm run dev` running)

| Script | What it does |
|---|---|
| `test_interview.cjs` | Launches Chromium, **route-mocks** `/api/auth/get-me`, `/api/interview/report/*`, `/api/interview` (no real backend), visits `http://localhost:5173/interview/123`, reloads, reports page errors |
| `test_crash.cjs` | Launches Chromium, visits `/login`, reloads, reports uncaught exceptions + console messages |

---

## 7. Deploy Configs

| File | Purpose |
|---|---|
| `Backend/Dockerfile` | node:20-alpine, `npm ci --omit=dev`, `NODE_ENV=production`, EXPOSE 8080, `CMD npm start` |
| `Backend/railway.json` | Railway build (RAILPACK V3) + deploy (V2), 1 replica us-west2, restart on failure (max 10) |
| `Frontend/vercel.json` | Rewrites `/api/(.*)` → Railway origin, all other paths → `/index.html` (SPA fallback) |

---

## 8. Known Bugs / Gotchas Found While Tracing

1. **Typo `selfDescrption`** — `interview.controller.js:190` reads `interviewReport.selfDescrption`, but the model field is `selfDescription` (`interviewReport.model.js:110`). Result: `selfDescription` is always `""` when generating the resume PDF, so Gemini never sees the candidate's background. Fix: rename to `selfDescription`.

2. **Typo `-__v` written as `-_v`** — `interview.controller.js:155` `.select("-resume -jobDescription -selfDescription -_v -updatedAt …")`. `-_v` is a no-op (there is no `_v` field), so Mongoose's `__v` version key is **still included** in list responses. The intended exclusion never happens.

3. **Global middleware order** — `authUser` runs **before** `upload.single("resume")` on `POST /api/interview` (`interview.routes.js:15`). A missing/invalid token returns 401 before multer can report an oversized/bad file. Also note multer is applied per-route, not globally.

4. **`server.js` doesn't await `connectToDB()`** (`server.js:8`) — combined with `bufferCommands:false` (`database.js:21`), early requests can throw "buffering timed out" style errors until Mongo is ready.

5. **Blacklist is permanent** — `logoutUserController` writes the raw JWT with no TTL (`blacklist.models.js:4-10`), and every protected request does a full `findOne({token})`. Tokens are never purged; the collection grows unbounded.

6. **`matchScore` is optional in the AI contract** — it's in the Gemini schema properties (`ai.service.js:10-13`) but not in `required` (`ai.service.js:74`). A response missing `matchScore` still persists, and the UI would render `undefined%` (score ring `interview.jsx:382`).

7. **StrictMode double effects** — `AuthProvider`'s `getMe` runs twice in dev (`auth.context.jsx:11-23`), and `Interview`'s load effect also double-fires (`interview.jsx:27-32`), producing duplicate read requests in dev only.

8. **`githubCallbackController` lacks the JWT cookie on the redirect target's load** — the cookie is set (`auth.controller.js:340`) before redirecting, so the SPA's `getMe` picks it up normally; but note the redirect target uses `FRONTEND_URL || "http://localhost:5173"`, which must exactly match the CORS allowlist origin in `app.js:14-19` for cookie round-trips to work.
