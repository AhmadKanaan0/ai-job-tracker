"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Github, Mail, Zap, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api-client"

export function OnboardingAuth() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const handleSubmit = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (isSignUp) {
        await register({ email, password, full_name: fullName || undefined })
        // After signup, always go to onboarding for first CV upload
        router.push("/onboarding")
      } else {
        const user = await login({ email, password })
        // After login, route based on state
        if (!user.has_cv) {
          router.push("/onboarding")
        } else if (!user.setup_completed) {
          router.push("/setup")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
            <Zap className="w-8 h-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Career Agent</h1>
          <p className="text-muted-foreground mt-2">Your AI-powered job hunting companion</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold">{isSignUp ? "Create an account" : "Welcome back"}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {isSignUp ? "Start your job search journey" : "Continue your job search"}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button 
              variant="outline" 
              className="h-11 border-border/50 bg-muted/30 hover:bg-muted/50 text-foreground"
              disabled
            >
              <Github className="w-5 h-5 mr-2" />
              GitHub
            </Button>
            <Button 
              variant="outline" 
              className="h-11 border-border/50 bg-muted/30 hover:bg-muted/50 text-foreground"
              disabled
            >
              <Mail className="w-5 h-5 mr-2" />
              Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <div className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label className="text-foreground">Full Name</Label>
                <Input 
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-muted/50 border-border/50 h-11"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input 
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/50 border-border/50 h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/50 border-border/50 h-11 pr-10"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button className="text-sm text-primary hover:underline">Forgot password?</button>
              </div>
            )}

            <Button 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium"
              onClick={handleSubmit}
              disabled={isLoading || (isMounted && (!email || !password))}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>
          </div>

          {/* Toggle Auth Mode */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                className="text-primary hover:underline font-medium"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <button className="text-primary hover:underline">Terms of Service</button>
          {" "}and{" "}
          <button className="text-primary hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  )
}
