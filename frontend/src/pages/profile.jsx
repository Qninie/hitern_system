import { useEffect, useState } from "react"
import axios from "axios"
import { Save, UserRound } from "lucide-react"

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {}
  } catch {
    return {}
  }
}

function Profile() {
  const storedUser = getStoredUser()
  const [form, setForm] = useState({
    name: storedUser.name || "",
    email: storedUser.email || "",
    password: "",
    supervisorEmail: storedUser.supervisor_email || "",
    role: storedUser.role || "intern",
    status: storedUser.status || "approved",
  })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!storedUser.email) return

      try {
        const res = await axios.get("http://localhost:5001/profile", {
          params: { email: storedUser.email },
        })

        if (res.data.success) {
          setForm((current) => ({
            ...current,
            name: res.data.user.name || "",
            email: res.data.user.email || "",
            supervisorEmail: res.data.user.supervisor_email || "",
            role: res.data.user.role || "intern",
            status: res.data.user.status || "approved",
          }))
        }
      } catch {
        setMessage("Cannot load profile right now.")
      }
    }

    fetchProfile()
  }, [storedUser.email])

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setMessage("Name and email are required.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await axios.post("http://localhost:5001/profile", {
        currentEmail: storedUser.email,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        supervisorEmail: form.supervisorEmail.trim().toLowerCase(),
      })

      if (res.data.success) {
        localStorage.setItem("hiternUser", JSON.stringify(res.data.user))
        setForm((current) => ({ ...current, password: "" }))
        setMessage("Profile updated.")
      } else {
        setMessage(res.data.message || "Unable to update profile.")
      }
    } catch {
      setMessage("Unable to update profile.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">
          Manage your account details and internship assignment.
        </p>
      </div>

      <div className="glass-card p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200/80 pb-5">
          <div className="glass-icon h-11 w-11">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Personal details</h2>
            <p className="text-sm capitalize text-slate-500">
              {form.role} account · {form.status}
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              className="glass-field mt-1 w-full"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="glass-field mt-1 w-full"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />
          </label>

          {form.role === "intern" && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Supervisor email</span>
              <input
                className="glass-field mt-1 w-full"
                value={form.supervisorEmail}
                onChange={(event) => handleChange("supervisorEmail", event.target.value)}
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-slate-700">New password</span>
            <input
              type="password"
              className="glass-field mt-1 w-full"
              placeholder="Leave blank to keep current password"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
            />
          </label>
        </div>

        {message && (
          <div className="mt-5 rounded-lg border border-sky-200/70 bg-sky-50/70 px-4 py-3 text-sm font-medium text-sky-700">
            {message}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="glass-button px-5"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
