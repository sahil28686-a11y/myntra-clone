"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { loginCustomer, registerCustomer } from "@/lib/medusa"

export default function AccountPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        await loginCustomer(email, password)
      } else {
        await registerCustomer({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        })
      }
      router.push("/account/dashboard")
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-myntra-dark">
            {isLogin ? "Login" : "Create Account"}
          </h1>
          <p className="text-sm text-myntra-muted mt-2">
            {isLogin
              ? "Sign in to access your account"
              : "Create an account to start shopping"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border border-myntra-border rounded-sm p-6 space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
            required
            minLength={6}
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-myntra-primary text-white font-semibold py-3 uppercase tracking-wider text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </button>

          <p className="text-center text-sm text-myntra-muted">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null) }}
              className="text-myntra-primary font-semibold hover:underline"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
