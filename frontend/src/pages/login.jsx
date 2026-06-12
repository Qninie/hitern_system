import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LockKeyhole, Mail, UserRoundCheck } from "lucide-react"

function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      const res = await axios.post("http://localhost:5001/login", {
        email,
        password
      })

      if (res.data.success) {
        localStorage.setItem("hiternUser", JSON.stringify(res.data.user))
        navigate("/")
      } else {
        setError(res.data.message || "Login failed")
      }
    } catch {
      setError("Cannot connect to the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <UserRoundCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hitern Login</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage internship documents.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border px-10 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <div className="relative mt-1">
              <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border px-10 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleLogin()
                }}
              />
            </div>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
