import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Edit3, KeyRound, Plus, Power, Save, Search, UserRound, X } from "lucide-react"

const emptyUser = {
  name: "",
  email: "",
  password: "",
  role: "intern",
  supervisorEmail: "",
}

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {}
  } catch {
    return {}
  }
}

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [newUser, setNewUser] = useState(emptyUser)
  const [editingUser, setEditingUser] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [resetPassword, setResetPassword] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const user = getStoredUser()
  const isHr = (user.role || "").toLowerCase() === "hr"
  const navigate = useNavigate()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5001/hr/users")
      setUsers(res.data.users || res.data.activeUsers || [])
    } catch {
      setMessage("Cannot load users right now.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isHr) fetchUsers()
  }, [isHr])

  const updateNewUser = (field, value) => {
    setNewUser((current) => ({ ...current, [field]: value }))
  }

  const handleCreateUser = async () => {
    setMessage("")

    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage("Name, email, and password are required.")
      return
    }

    try {
      const res = await axios.post("http://localhost:5001/hr/create-user", newUser)

      if (res.data.success) {
        setMessage("User created.")
        setNewUser(emptyUser)
        fetchUsers()
      } else {
        setMessage(res.data.message || "Unable to create user.")
      }
    } catch {
      setMessage("Unable to create user.")
    }
  }

  const startEdit = (item) => {
    setEditingUser({
      id: item.id,
      name: item.name || "",
      email: item.email || "",
      role: item.role || "intern",
      status: ["inactive", "deactivated"].includes((item.status || "").toLowerCase()) ? "inactive" : "active",
      supervisorEmail: item.supervisor_email || "",
    })
    setMessage("")
  }

  const handleUpdateUser = async () => {
    if (!editingUser?.name || !editingUser?.email) {
      setMessage("Name and email are required.")
      return
    }

    try {
      const res = await axios.post("http://localhost:5001/hr/update-user", {
        userId: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status,
        supervisorEmail: editingUser.supervisorEmail,
      })

      if (res.data.success) {
        setMessage("User updated.")
        setEditingUser(null)
        fetchUsers()
      } else {
        setMessage(res.data.message || "Unable to update user.")
      }
    } catch {
      setMessage("Unable to update user.")
    }
  }

  const handleResetPassword = async () => {
    if (!resetUser || !resetPassword) {
      setMessage("New password is required.")
      return
    }

    try {
      const res = await axios.post("http://localhost:5001/hr/reset-password", {
        userId: resetUser.id,
        password: resetPassword,
      })

      if (res.data.success) {
        setMessage(`Password reset for ${resetUser.name || resetUser.email}.`)
        setResetUser(null)
        setResetPassword("")
      } else {
        setMessage(res.data.message || "Unable to reset password.")
      }
    } catch {
      setMessage("Unable to reset password.")
    }
  }

  const handleToggleStatus = async (item) => {
    const currentStatus = (item.status || "active").toLowerCase()
    const nextStatus = ["inactive", "deactivated"].includes(currentStatus) ? "active" : "inactive"

    try {
      const res = await axios.post("http://localhost:5001/hr/toggle-user-status", {
        userId: item.id,
        status: nextStatus,
      })

      if (res.data.success) {
        setMessage(res.data.message || "User status updated.")
        fetchUsers()
      } else {
        setMessage(res.data.message || "Unable to update status.")
      }
    } catch {
      setMessage("Unable to update status.")
    }
  }

  const filteredUsers = users.filter((item) => {
    const matchesRole = roleFilter === "all" || (item.role || "").toLowerCase() === roleFilter
    const matchesSearch = (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())

    return matchesRole && matchesSearch
  })

  const listTitle = {
    all: "All Users",
    intern: "Interns",
    supervisor: "Supervisors",
    hr: "Human Resources",
  }[roleFilter]

  if (!isHr) {
    return (
      <div className="glass-card p-8 text-center">
        <UserRound className="mx-auto h-10 w-10 text-sky-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-950">HR access only</h1>
        <p className="mt-2 text-sm text-slate-500">
          User accounts are created and managed by HR Administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">
          Create intern and supervisor accounts, reset passwords, and manage access.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 shadow-sm">
          {message}
        </div>
      )}

      <section className="glass-card p-5">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
          <Plus className="h-5 w-5 text-sky-600" />
          <h2 className="font-semibold text-slate-950">Create Account</h2>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <input
            className="glass-field"
            placeholder="Name"
            value={newUser.name}
            onChange={(event) => updateNewUser("name", event.target.value)}
          />
          <input
            className="glass-field"
            placeholder="Email"
            value={newUser.email}
            onChange={(event) => updateNewUser("email", event.target.value)}
          />
          <input
            className="glass-field"
            placeholder="Password"
            value={newUser.password}
            onChange={(event) => updateNewUser("password", event.target.value)}
          />
          <select
            className="glass-field pr-10"
            value={newUser.role}
            onChange={(event) => updateNewUser("role", event.target.value)}
          >
            <option value="intern">Intern</option>
            <option value="supervisor">Supervisor</option>
            <option value="hr">HR Admin</option>
          </select>
          <button onClick={handleCreateUser} className="glass-button">
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>

        {newUser.role === "intern" && (
          <input
            className="glass-field mt-4 w-full"
            placeholder="Assigned supervisor email"
            value={newUser.supervisorEmail}
            onChange={(event) => updateNewUser("supervisorEmail", event.target.value)}
          />
        )}
      </section>

      {editingUser && (
        <section className="glass-card p-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-3">
              <Edit3 className="h-5 w-5 text-sky-600" />
              <h2 className="font-semibold text-slate-950">Edit User</h2>
            </div>
            <button
              onClick={() => setEditingUser(null)}
              className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
              title="Close edit form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-5">
            <input
              className="glass-field"
              value={editingUser.name}
              onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })}
            />
            <input
              className="glass-field"
              value={editingUser.email}
              onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })}
            />
            <select
              className="glass-field pr-10"
              value={editingUser.role}
              onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value })}
            >
              <option value="intern">Intern</option>
              <option value="supervisor">Supervisor</option>
              <option value="hr">HR Admin</option>
            </select>
            <select
              className="glass-field pr-10"
              value={editingUser.status}
              onChange={(event) => setEditingUser({ ...editingUser, status: event.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={handleUpdateUser} className="glass-button">
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>

          {editingUser.role === "intern" && (
            <input
              className="glass-field mt-4 w-full"
              placeholder="Assigned supervisor email"
              value={editingUser.supervisorEmail}
              onChange={(event) => setEditingUser({ ...editingUser, supervisorEmail: event.target.value })}
            />
          )}
        </section>
      )}

      {resetUser && (
        <section className="glass-card p-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-sky-600" />
              <h2 className="font-semibold text-slate-950">Reset Password</h2>
            </div>
            <button
              onClick={() => {
                setResetUser(null)
                setResetPassword("")
              }}
              className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
              title="Close reset form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="rounded-lg border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-700">
              {resetUser.name || resetUser.email}
            </div>
            <input
              className="glass-field"
              placeholder="New password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
            />
            <button onClick={handleResetPassword} className="glass-button">
              <KeyRound className="h-4 w-4" />
              Reset
            </button>
          </div>
        </section>
      )}

      <section className="glass-card overflow-hidden">
        <div className="space-y-4 border-b border-slate-200/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="font-semibold text-slate-950">{listTitle}</h2>
              <p className="text-sm text-slate-500">Filter users by role or search by name.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            {[
              { value: "all", label: "All" },
              { value: "intern", label: "Intern" },
              { value: "supervisor", label: "SV" },
              { value: "hr", label: "HR" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setRoleFilter(item.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  roleFilter === item.value
                    ? "border-sky-300 bg-sky-200 text-slate-950"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:bg-sky-50 hover:text-sky-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className="glass-field w-full pl-10"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="glass-table-head">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="glass-divider divide-y">
                {filteredUsers.map((item) => {
                  const isInactive = ["inactive", "deactivated"].includes((item.status || "").toLowerCase())

                  return (
                    <tr key={item.id} className="hover:bg-sky-50/50">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/users/${item.id}`)}
                          className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
                        >
                          {item.name || "-"}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{item.email}</td>
                      <td className="px-5 py-4 text-sm capitalize text-slate-600">{item.role || "-"}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isInactive ? "bg-slate-100 text-slate-600" : "bg-sky-100 text-sky-800"}`}>
                          {isInactive ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
                            {item.document_count || 0} total
                          </span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            {item.pending_count || 0} pending
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {item.approved_count || 0} approved
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(item)} title="Edit user" className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700">
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setResetUser(item)
                              setResetPassword("")
                            }}
                            title="Reset password"
                            className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                          >
                            <KeyRound className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleToggleStatus(item)} title={isInactive ? "Activate user" : "Deactivate user"} className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700">
                            <Power className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">No users found.</div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default Users
