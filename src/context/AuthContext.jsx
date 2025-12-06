import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

// Create context for authentication
const userContext = createContext();

// AuthProvider component to manage authentication state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify user authentication status on component mount
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5233";
          const response = await axios.get(
            `${API_BASE_URL}/api/auth/verify`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.data.success) {
            setUser(response.data.user);
          }
        } else {
          setUser(null);
          setLoading(false)
        }
      } catch (error) {
        // Handle authentication verification errors
        if (error.response && !error.response.data.error) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

   // Login function to set user state
  const login = (user) => {
    setUser(user);
  };

  // Logout function to clear user state and remove token
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };
  
  return (
    <userContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </userContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => useContext(userContext);