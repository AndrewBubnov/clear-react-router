import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { E2EDemo } from './e2e-demo.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.VITE_E2E ? <E2EDemo /> : <App />}
  </StrictMode>,
)
