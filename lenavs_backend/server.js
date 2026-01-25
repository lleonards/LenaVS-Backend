ai esta o server.js "import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Routes
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import projectRoutes from './routes/projects.js'
import exportRoutes from './routes/export.js'
import paymentRoutes from './routes/payment.js'
import reportRoutes from './routes/report.js'

// Middleware
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 10000
const __dirname = path.resolve()

// --------------------------------------------------
// CREATE FOLDERS
// --------------------------------------------------
const folders = [
  'uploads/audio',
  'uploads/video',
  'uploads/images',
  'uploads/lyrics',
  'exports',
]

folders.forEach(folder => {
  const fullPath = path.join(__dirname, folder)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
})

// --------------------------------------------------
// CORS CONFIG (CORRETO)
// --------------------------------------------------
const allowedOrigins = [
  'https://www.lenavs.com',
  'https://lenavs.com',
  'https://lenavs-frontend.onrender.com'
]

app.use(cors({
  origin: function (origin, callback) {
    // permite chamadas sem origin (Postman, backend interno)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Preflight (IMPORTANTÍSSIMO para upload)
app.options('*', cors())

// --------------------------------------------------
// BODY PARSERS
// --------------------------------------------------
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// --------------------------------------------------
// STATIC FILES
// --------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/exports', express.static(path.join(__dirname, 'exports')))

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------
app.use('/api/auth', authRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/report', reportRoutes)

// --------------------------------------------------
// FRONTEND (SPA FALLBACK)
// --------------------------------------------------
const frontendPath = path.join(__dirname, 'dist')

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath))

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
} else {
  console.warn('⚠️ Pasta dist não encontrada. Frontend não será servido.')
}

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------
app.use(errorHandler)

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Backend running on port', PORT)
})" me mande completo e corrigido
