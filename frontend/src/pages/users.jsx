import { useEffect, useState } from "react"
import axios from "axios"
import { Check, Hourglass, UserRound, X } from "lucide-react"

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {}
  } catch {
    return {}
  }
}

function Users() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [activeUsers, setActiveUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const user = getStoredUser()
  const isHr = (user.role || "").toLowerCase() === "hr"

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5001/hr/users")
      setPendingUsers(res.data.pendingUsers || [])
      setActiveUsers(res.data.activeUsers || [])
    } catch {
      setMessage("Cannot load users right now.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isHr) fetchUsers()
  }, [isHr])

  const handleApproval = async (requestId, status) => {
    setMessage("")
    try {
      const res = await axios.post("http://localhost:5001/hr/approve-user", {
        requestId,
        status,
      })

      if (res.data.success) {
        setMessage(status === "approved" ? "User approved." : "User rejected.")
        fetchUsers()
      } else {
        setMessage(res.data.message || "Unable to update request.")
      }
    } catch {
      setMessage("Unable to update request.")
    }
  }

  if (!isHr) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <UserRound className="mx-auto h-10 w-10 text-red-700" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">HR access only</h1>
        <p className="mt-2 text-sm text-gray-500">
          User approval and intern assignment tracking are managed by HR.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Approve signup requests and monitor intern-supervisor assignments.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <Hourglass className="h-5 w-5 text-red-700" />
          <h2 className="font-semibold text-gray-900">Pending HR Approval</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading users...</div>
        ) : pendingUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Supervisor</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{item.email}</td>
                    <td className="px-5 py-4 text-sm capitalize text-gray-500">{item.role}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{item.supervisor_email || "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApproval(item.id, "approved")}
                          title="Approve user"
                          className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleApproval(item.id, "rejected")}
                          title="Reject user"
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">No pending signup requests.</div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <UserRound className="h-5 w-5 text-red-700" />
          <h2 className="font-semibold text-gray-900">Approved Users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Supervisor</th>
                <th className="px-5 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeUsers.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">{item.name || "-"}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{item.email}</td>
                  <td className="px-5 py-4 text-sm capitalize text-gray-500">{item.role || "-"}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{item.supervisor_email || "-"}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      {item.document_count || 0} documents
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Users
