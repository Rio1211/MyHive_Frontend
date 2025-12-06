import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

// Component to protect routes based on user roles
const RoleBaseRoutes = ({children, requiredRole}) => {
    const {user, loading} = useAuth()

// Show loading indicator while verifying authentication
    if(loading){
        return <div>Loading...</div>
    }

    // Redirect to unauthorized page if user doesn't have required role
    if (!user || !requiredRole.includes(user.role)){
        return <Navigate to="/unauthorized" />
    }
    
// Render children if user has required role
    return children
}

export default RoleBaseRoutes