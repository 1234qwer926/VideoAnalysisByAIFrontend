import { createContext, useContext, useEffect, useState } from "react"

/**
 * @typedef {"light" | "dark" | "system"} Theme
 */

/**
 * @typedef {Object} ThemeProviderValue
 * @property {Theme} theme - The current theme setting
 * @property {function(Theme): void} setTheme - Function to update the theme
 */

const ThemeProviderContext = createContext(/** @type {ThemeProviderValue} */ ({
  theme: "system",
  setTheme: () => null,
}))

/**
 * Gets the resolved theme value based on the theme setting and system preference
 * @param {Theme} theme - The theme setting
 * @returns {"light" | "dark"} The resolved theme
 */
const getSystemTheme = (theme) => {
  if (theme !== "system") return theme
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/**
 * ThemeProvider component that manages theme state and persistence
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Theme} [props.defaultTheme="system"] - Default theme setting
 * @param {string} [props.storageKey="vite-ui-theme"] - localStorage key for theme persistence
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(storageKey) || defaultTheme
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme class
    root.classList.remove("light", "dark")

    // Apply the resolved theme
    const resolvedTheme = getSystemTheme(theme)
    root.classList.add(resolvedTheme)

    // Update data-theme attribute for CSS selectors
    root.setAttribute("data-theme", resolvedTheme)
  }, [theme])

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      const resolvedTheme = getSystemTheme(theme)
      root.classList.add(resolvedTheme)
      root.setAttribute("data-theme", resolvedTheme)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

/**
 * Hook to access the theme context
 * @returns {ThemeProviderValue} The theme context value
 * @throws {Error} If used outside of a ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}