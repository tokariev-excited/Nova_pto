import { createContext, useContext, useRef, useCallback, type ReactNode } from "react"

type GuardFn = () => boolean

interface NavigationGuardContextType {
  registerGuard: (fn: GuardFn) => void
  unregisterGuard: () => void
  canNavigate: () => boolean
}

const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(
  undefined
)

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<GuardFn | null>(null)

  const registerGuard = useCallback((fn: GuardFn) => {
    guardRef.current = fn
  }, [])

  const unregisterGuard = useCallback(() => {
    guardRef.current = null
  }, [])

  const canNavigate = useCallback(() => {
    if (!guardRef.current) return true
    return guardRef.current()
  }, [])

  return (
    <NavigationGuardContext.Provider value={{ registerGuard, unregisterGuard, canNavigate }}>
      {children}
    </NavigationGuardContext.Provider>
  )
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext)
  if (!context) {
    throw new Error("useNavigationGuard must be used within a NavigationGuardProvider")
  }
  return context
}
