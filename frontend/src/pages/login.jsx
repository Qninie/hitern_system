import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  LockKeyhole,
  Mail,
} from "lucide-react"

const roles = [
  { value: "intern", label: "Intern" },
  { value: "supervisor", label: "SV" },
  { value: "hr", label: "HR" },
]

function Login() {
  const [role, setRole] = useState("intern")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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

    return true
  }

  const handleSubmit = async () => {
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

  return (
    <div className="app-surface flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="glass-panel grid w-full max-w-6xl overflow-hidden rounded-2xl lg:min-h-[min(720px,calc(100vh-3rem))] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-md">
            <p className="text-sm font-medium text-sky-600">Welcome to</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Hitern System</h1>
            <p className="mt-3 text-sm text-slate-500">
              Sign in with the account created by your HR Administrator.
            </p>

            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-slate-700">Choose your role</p>
              <div className="grid grid-cols-3 rounded-xl border border-slate-200/80 bg-white/70 p-1 shadow-sm">
                {roles.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setRole(item.value)
                      resetFeedback()
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      role === item.value
                        ? "bg-sky-200 text-slate-950 shadow"
                        : "text-slate-500 hover:text-sky-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email address</span>
                <div className="relative mt-1">
                  <Mail className="glass-field-icon" />
                  <input
                    className="glass-field w-full rounded-xl px-10 py-3"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <div className="relative mt-1">
                  <LockKeyhole className="glass-field-icon" />
                  <input
                    className="glass-field w-full rounded-xl px-10 py-3"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSubmit()
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMessage("Please contact HR Administrator to reset your password.")}
                  className="mt-2 text-xs font-semibold text-sky-700 hover:text-sky-900"
                >
                  Forgot password?
                </button>
              </label>

              {error && (
                <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-sky-200/70 bg-sky-50/70 px-4 py-3 text-sm font-medium text-sky-700">
                  {message}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="glass-button w-full rounded-xl px-4 py-3 font-bold"
              >
                {loading ? "Please wait..." : "Sign in"}
              </button>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-gradient-to-br from-sky-300/80 via-blue-300/70 to-slate-100 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.42),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.28),transparent_24%),radial-gradient(circle_at_70%_80%,rgba(186,230,253,0.35),transparent_30%)]" />
          <div className="relative flex h-full flex-col items-center justify-center">
            <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Building2 className="h-9 w-9" />
            </div>

            <div className="relative h-[430px] w-[360px]">
              <div className="absolute inset-x-10 bottom-0 h-24 rounded-[2rem] bg-sky-950/20 blur-xl" />
              <div className="absolute bottom-8 left-10 h-28 w-72 rotate-[-10deg] rounded-3xl border border-white/30 bg-white/20 shadow-2xl backdrop-blur" />
              <div className="absolute bottom-20 left-20 h-64 w-48 rounded-t-[5rem] border border-white/70 bg-white/10 backdrop-blur-sm">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="mx-7 mt-5 h-px bg-white/55"
                  />
                ))}
                <div className="absolute left-1/2 top-10 h-48 w-px -translate-x-1/2 bg-white/40" />
                <div className="absolute left-8 top-16 h-3 w-3 rounded-full bg-sky-200 shadow-[0_0_22px_rgba(255,255,255,0.95)]" />
                <div className="absolute right-10 top-28 h-3 w-3 rounded-full bg-sky-100 shadow-[0_0_22px_rgba(255,255,255,0.95)]" />
                <div className="absolute left-16 bottom-16 h-3 w-3 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.95)]" />
              </div>

              <div className="absolute right-0 top-16 space-y-5">
                {["HR creates accounts", "SV reviews progress", "Intern submits docs"].map((text) => (
                  <div key={text} className="rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-xs font-semibold backdrop-blur">
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-8 max-w-sm text-center text-sm text-white/85">
              HR controls access, supervisors track assigned interns, and interns submit documents in one workflow.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
