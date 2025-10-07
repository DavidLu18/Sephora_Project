"use client"
import { useState } from "react"

export default function SignInModal({
  isOpen,
  onClose,
  onSwitchToSignUp,
}: {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignUp: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-lg shadow-lg p-6 relative">
        {/* Close */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">Sign In</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sign in or create an account to enjoy{" "}
          <span className="font-semibold">FREE standard shipping</span> on all
          orders.
        </p>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            alert(`Sign In with ${email}`)
            onClose()
          }}
        >
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" /> Keep me signed in
            </label>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded mb-4"
          >
            Sign In
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm mb-2">New to Sephora?</p>
          <button
            className="w-full border py-2 rounded"
            onClick={onSwitchToSignUp}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
