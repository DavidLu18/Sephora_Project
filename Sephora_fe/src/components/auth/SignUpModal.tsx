"use client"
import { useState } from "react"

export default function SignUpModal({
  isOpen,
  onClose,
  onSwitchToSignIn,
}: {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignIn: () => void
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

        <h2 className="text-xl font-bold mb-4">Create Account</h2>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            alert(`Sign Up: ${name}, ${email}`)
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

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded mb-4"
          >
            Create Account
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm mb-2">Already have an account?</p>
          <button
            className="w-full border py-2 rounded"
            onClick={onSwitchToSignIn}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
