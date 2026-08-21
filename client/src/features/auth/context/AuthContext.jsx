import { createContext, useState, useCallback } from 'react'
import { MOCK_USERNAME, MOCK_PASSWORD, MOCK_USER } from '../data/mockUser'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const login = useCallback((username, password) => {
    if (username === MOCK_USERNAME && password === MOCK_PASSWORD) {
      setIsAuthenticated(true)
      setCurrentUser(MOCK_USER)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setCurrentUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
