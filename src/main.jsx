import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { getGoogleClientId, isGoogleOAuthConfigured } from './lib/googleAuthEnv.js'

const googleClientId = getGoogleClientId()
const withGoogle = isGoogleOAuthConfigured()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {withGoogle ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
