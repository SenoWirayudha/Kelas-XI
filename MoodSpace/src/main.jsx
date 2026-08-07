import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CreationProvider } from './context/CreationContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CreationProvider>
          <App />
        </CreationProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
