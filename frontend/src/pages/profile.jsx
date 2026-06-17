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
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account details and internship assignment.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Personal details</h2>
            <p className="text-sm capitalize text-gray-500">
              {form.role} account · {form.status}
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />
          </label>

          {form.role === "intern" && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Supervisor email</span>
              <input
                className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                value={form.supervisorEmail}
                onChange={(event) => handleChange("supervisorEmail", event.target.value)}
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-gray-700">New password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Leave blank to keep current password"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
            />
          </label>
        </div>

        {message && (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
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
