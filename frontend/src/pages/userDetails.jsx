import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, FileText, UserRound } from "lucide-react"

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {}
  } catch {
    return {}
  }
}

function UserDetails() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const currentUser = getStoredUser()
  const isHr = (currentUser.role || "").toLowerCase() === "hr"
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const fetchDetails = useCallback(async () => {
    if (!isHr) return

    try {
      setLoading(true)
      const res = await axios.get(`http://localhost:5001/hr/users/${userId}`)

      if (res.data.success) {
        setDetails(res.data)
      } else {
        setMessage(res.data.message || "User not found.")
      }
    } catch {
      setMessage("Cannot load user details right now.")
    } finally {
      setLoading(false)
    }
  }, [isHr, userId])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  if (!isHr) {
    return (
      <div className="glass-card p-8 text-center text-sm text-slate-500">
        Human Resources access only.
      </div>
    )
  }

  if (loading) {
    return <div className="glass-card p-8 text-center text-sm text-slate-500">Loading user details...</div>
  }

  if (!details?.user) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8 text-center text-sm text-slate-500">{message || "User not found."}</div>
        <div className="flex justify-start">
          <button onClick={() => navigate("/users")} className="glass-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>
    )
  }

  const selectedUser = details.user
  const role = (selectedUser.role || "").toLowerCase()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Users &gt; {selectedUser.name || selectedUser.email}</h1>
        <p className="page-subtitle">View account details and related assignments.</p>
      </div>

      <section className="glass-card p-5">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
          <div className="glass-icon h-11 w-11">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{selectedUser.name || "-"}</h2>
            <p className="text-sm capitalize text-slate-500">{selectedUser.role} account</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{selectedUser.email}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-900">{selectedUser.status || "active"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Supervisor</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {details.supervisor?.name || selectedUser.supervisor_email || "-"}
            </p>
          </div>
        </div>
      </section>

      {role === "intern" && (
        <section className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-4">
            <FileText className="h-5 w-5 text-sky-600" />
            <h2 className="font-semibold text-slate-950">
              Uploaded Documents ({details.documents?.length || 0})
            </h2>
          </div>
          {details.documents?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="glass-table-head">
                  <tr>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="glass-divider divide-y">
                  {details.documents.map((document) => (
                    <tr key={document.id} className="hover:bg-sky-50/50">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/documents/${document.id}`)}
                          className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
                        >
                          {document.title || "-"}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{document.document_type || "-"}</td>
                      <td className="px-5 py-4 text-sm capitalize text-slate-600">{document.status || "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{document.assigned_to || "Human Resources"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-sm text-slate-500">No uploaded documents.</div>
          )}
        </section>
      )}

      {role === "supervisor" && (
        <section className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-4">
            <UserRound className="h-5 w-5 text-sky-600" />
            <h2 className="font-semibold text-slate-950">Assigned Interns ({details.interns?.length || 0})</h2>
          </div>
          {details.interns?.length ? (
            <div className="divide-y divide-slate-200/70">
              {details.interns.map((intern) => (
                <button
                  key={intern.id}
                  onClick={() => navigate(`/users/${intern.id}`)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-sky-50/50"
                >
                  <span className="font-medium text-sky-700">{intern.name || intern.email}</span>
                  <span className="text-sm text-slate-500">{intern.email}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-sm text-slate-500">No assigned interns.</div>
          )}
        </section>
      )}

      <div className="flex justify-start">
        <button onClick={() => navigate("/users")} className="glass-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </div>
  )
}

export default UserDetails
