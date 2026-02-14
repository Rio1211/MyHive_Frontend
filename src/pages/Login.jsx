import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// Login component for user authentication
const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [guidePosition, setGuidePosition] = useState({ x: 24, y: 24 })
  const [isDraggingGuide, setIsDraggingGuide] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const { login } = useAuth()
  const navigate = useNavigate()
  const guideRef = useRef(null)

  const handleGuidePointerDown = (e) => {
    if (!guideRef.current) return
    const rect = guideRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDraggingGuide(true)
  }

  useEffect(() => {
    if (!isDraggingGuide) {
      document.body.style.userSelect = ''
      return
    }

    const handlePointerMove = (e) => {
      if (!guideRef.current) return
      const guideWidth = guideRef.current.offsetWidth
      const guideHeight = guideRef.current.offsetHeight
      const maxX = window.innerWidth - guideWidth - 12
      const maxY = window.innerHeight - guideHeight - 12
      const nextX = Math.min(Math.max(12, e.clientX - dragOffset.x), maxX)
      const nextY = Math.min(Math.max(12, e.clientY - dragOffset.y), maxY)
      setGuidePosition({ x: nextX, y: nextY })
    }

    const handlePointerUp = () => {
      setIsDraggingGuide(false)
    }

    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDraggingGuide, dragOffset])

  // Handle form submission for user login
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5233";
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password })
      if (response.data.success) {
        login(response.data.user)
        localStorage.setItem('token', response.data.token)
         // Redirect user based on their role
        if (response.data.user.role === 'admin') {
          navigate('/admin-dashboard')
        } else if (response.data.user.role === 'hr') {
          navigate('/hr-dashboard')
        } else if (response.data.user.role === 'manager') {
          navigate('/manager-dashboard')
        } 
        else {
          navigate('/employee-dashboard')
        }
      }
    } catch (error) {
      // Handle login errors
      if (error.response && error.response.data && !error.response.data.success) {
        setError(error.response.data.error)
      } else {
        setError('Server Error')
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div
        ref={guideRef}
        className="fixed z-20 w-72 rounded-xl border border-yellow-300 bg-yellow-100/95 shadow-lg"
        style={{ left: `${guidePosition.x}px`, top: `${guidePosition.y}px` }}
      >
        <div
          className={`rounded-t-xl bg-yellow-300 px-4 py-2 text-sm font-semibold text-amber-900 select-none ${isDraggingGuide ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={handleGuidePointerDown}
        >
          Login Guide (Drag Me)
        </div>
        <div className="px-4 py-3 text-sm text-amber-900 leading-6">
          <p className="font-medium">Use <code>{'{role}@gmail.com'}</code> with password <code>{'{role}'}</code> to sign in.</p>
          <p className="font-medium">Four default users available for you to use: "<code>admin@gmail.com</code>", "<code>hr@gmail.com</code>", "<code>manager@gmail.com</code>", "<code>user@gmail.com</code>"</p>
          <p className="mt-2 text-xs text-amber-800">Example: <code>admin@gmail.com</code> / <code>admin</code></p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <span className="text-4xl sm:text-5xl font-bold text-purple-700">My</span>
          <span className="text-4xl sm:text-5xl font-bold" style={{ color: "#FFC72C" }}>
            Hive
          </span>
        </div>

        {/* Login Form */}
        <div className="w-full bg-white">
          <h2 className="text-center text-2xl font-semibold text-slate-900 mb-6">Log In</h2>
          {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-lg bg-gray-300 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-600 focus:outline-none"
                placeholder="email@domain.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full rounded-lg bg-gray-300 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-600 focus:outline-none"
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-purple-700 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800"
            >
              Log In
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}

export default Login
