import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import AppRoutes from "@/routes"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AppRoutes />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
      />
    </ThemeProvider>
  )
}
