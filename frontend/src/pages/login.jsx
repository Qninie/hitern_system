import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRoundCheck,
} from "lucide-react"

const roles = [
  { value: "intern", label: "Intern" },
  { value: "supervisor", label: "SV" },
  { value: "hr", label: "HR" },
]

function Login() {
  const [mode, setMode] = useState("login")
  const [role, setRole] = useState("intern")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [supervisorEmail, setSupervisorEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const resetFeedback = () => {
    setError("")
    setMessage("")
  }

  const validateForm = () => {
    if (!email.trim()) {
      setError("Email is required.")
      return false
    }

    if (!password.trim()) {
      setError("Password is required.")
      return false
    }

    if (mode === "signup" && !name.trim()) {
      setError("Full name is required.")
      return false
    }

    return true
  }

  const handleLogin = async () => {
    resetFeedback()
    if (!validateForm()) return

    setLoading(true)

    try {
      const res = await axios.post(
        "http://localhost:5001/login",
        {
          email: email.trim().toLowerCase(),
          password,
          role,
        },
        { timeout: 8000 }
      )

      if (res.data.success) {
        localStorage.setItem("hiternUser", JSON.stringify(res.data.user))
        navigate("/")
      } else {
        setError(res.data.message || "Login failed")
      }
    } catch {
      setError("Login is taking too long. Please check that the backend and MySQL are running.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    resetFeedback()
    if (!validateForm()) return

    setLoading(true)

    try {
      const res = await axios.post(
        "http://localhost:5001/signup-request",
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          supervisorEmail: supervisorEmail.trim().toLowerCase(),
        },
        { timeout: 8000 }
      )

      if (res.data.success) {
        setMessage("Signup request sent. Please wait for HR approval before login.")
        setPassword("")
      } else {
        setError(res.data.message || "Signup failed")
      }
    } catch {
      setError("Signup is taking too long. Please check that the backend and MySQL are running.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (mode === "login") {
      handleLogin()
    } else {
      handleSignup()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-700 to-rose-400 p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex items-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-md">
            <p className="text-sm font-medium text-gray-500">Welcome to</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">Hitern System</h1>
            <p className="mt-3 text-sm text-gray-500">
              Sign in or request access for internship document management.
            </p>

            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-gray-700">Choose your role</p>
              <div className="grid grid-cols-3 rounded-xl bg-red-50 p-1">
                {roles.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setRole(item.value)
                      resetFeedback()
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      role === item.value
                        ? "bg-white text-red-700 shadow"
                        : "text-red-500 hover:text-red-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 flex rounded-xl border bg-gray-50 p-1">
              <button
                onClick={() => {
                  setMode("login")
                  resetFeedback()
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                  mode === "login" ? "bg-red-700 text-white shadow" : "text-gray-500"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMode("signup")
                  resetFeedback()
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                  mode === "signup" ? "bg-red-700 text-white shadow" : "text-gray-500"
                }`}
              >
                Sign up
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {mode === "signup" && (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Full name</span>
                  <div className="relative mt-1">
                    <UserRoundCheck className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full rounded-xl border px-10 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      placeholder="Your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email address</span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full rounded-xl border px-10 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>

              {mode === "signup" && role === "intern" && (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Supervisor email</span>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full rounded-xl border px-10 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      placeholder="supervisor@example.com"
                      value={supervisorEmail}
                      onChange={(event) => setSupervisorEmail(event.target.value)}
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Password</span>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMessage("Please contact HR to reset your password.")}
                      className="text-xs font-semibold text-red-700 hover:text-red-900"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full rounded-xl border px-10 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSubmit()
                    }}
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {message}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-800 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/20 hover:from-red-900 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {mode === "login" ? <ShieldCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Request HR approval"}
              </button>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-gradient-to-br from-red-900 via-rose-700 to-red-400 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_70%_80%,rgba(255,220,220,0.2),transparent_30%)]" />
          <div className="relative flex h-full flex-col items-center justify-center">
            <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Building2 className="h-9 w-9" />
            </div>

            <div className="relative h-[430px] w-[360px]">
              <div className="absolute inset-x-10 bottom-0 h-24 rounded-[2rem] bg-red-950/35 blur-xl" />
              <div className="absolute bottom-8 left-10 h-28 w-72 rotate-[-10deg] rounded-3xl border border-white/30 bg-white/20 shadow-2xl backdrop-blur" />
              <div className="absolute bottom-20 left-20 h-64 w-48 rounded-t-[5rem] border border-white/70 bg-white/10 backdrop-blur-sm">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="mx-7 mt-5 h-px bg-white/55"
                  />
                ))}
                <div className="absolute left-1/2 top-10 h-48 w-px -translate-x-1/2 bg-white/40" />
                <div className="absolute left-8 top-16 h-3 w-3 rounded-full bg-rose-200 shadow-[0_0_22px_rgba(255,255,255,0.95)]" />
                <div className="absolute right-10 top-28 h-3 w-3 rounded-full bg-rose-100 shadow-[0_0_22px_rgba(255,255,255,0.95)]" />
                <div className="absolute left-16 bottom-16 h-3 w-3 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.95)]" />
              </div>

              <div className="absolute right-0 top-16 space-y-5">
                {["HR approves users", "SV reviews progress", "Intern submits docs"].map((text) => (
                  <div key={text} className="rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-xs font-semibold backdrop-blur">
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-8 max-w-sm text-center text-sm text-red-50">
              HR controls access, supervisors track assigned interns, and interns submit documents in one workflow.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
