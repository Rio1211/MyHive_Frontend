import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Component to protect routes that require authentication
const PrivateRoutes = ({children}) => {
  const {user, loading} = useAuth()

   // Show loading indicator while verifying authentication
  if(loading) {
    return <div> Loading ...</div>
  }

  // Render children if user is authenticated, otherwise redirect to login
  return user ? children : <Navigate to="/login" />
}

export default PrivateRoutes