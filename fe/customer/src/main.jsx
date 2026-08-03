import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from '@/App'
import { AuthProvider } from '@/auth/AuthContext'
import { CompareProvider } from '@/customer/context/CompareContext'
import './customer.css'
import './customer-enhanced.css'
import './portal.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CompareProvider>
          <App />
        </CompareProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)