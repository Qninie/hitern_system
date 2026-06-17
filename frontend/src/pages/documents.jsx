import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Search, Filter, FileText, Check, X, Eye, RefreshCw, Trash2 } from "lucide-react"

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {}
  } catch {
    return {}
  }
}

const formatDate = (dateValue) => {
  if (!dateValue) return "No due date"

  const date = new Date(dateValue)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

const getDaysLeftText = (dateValue) => {
  if (!dateValue) return ""

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateValue)
  due.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return `${Math.abs(daysLeft)} day(s) overdue`
  if (daysLeft === 0) return "Due today"
  return `${daysLeft} day(s) left`
}

const getDeadlineText = (dateValue) => {
  if (!dateValue) return "No due date"
  return `${formatDate(dateValue)} | ${getDaysLeftText(dateValue)}`
}

const getDeadlineBadge = (dateValue) => {
  if (!dateValue) return "bg-white/60 text-slate-700"

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateValue)
  due.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return "bg-slate-200 text-slate-800"
  if (daysLeft <= 3) return "bg-amber-100 text-amber-800"
  return "bg-emerald-100 text-emerald-800"
}

const getStatusBadge = (status) => {
  const styles = {
    pending: "border-amber-200 bg-amber-100 text-amber-800",
    approved: "border-emerald-200 bg-emerald-100 text-emerald-800",
    rejected: "border-slate-300 bg-slate-200 text-slate-800",
  }

  return styles[status] || "border-slate-200 bg-white/60 text-slate-800"
}

function Documents() {
  const [documents, setDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState("")
  const user = getStoredUser()
  const role = (user.role || "intern").toLowerCase()
  const canReview = role === "supervisor" || role === "hr"
  const navigate = useNavigate()

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("http://localhost:5001/documents", {
        params: {
          role,
          email: user.email,
        },
      })

      if (res.data.success) {
        setDocuments(res.data.documents)
      }
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [role, user.email])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const filteredDocuments = documents.filter((doc) => {
    const title = doc.title || ""
    const uploader = doc.uploaded_by || ""
    const matchesSearch = `${title} ${uploader}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || doc.status === filterStatus
    const matchesRole = canReview || !user.email || uploader.toLowerCase() === user.email.toLowerCase()

    return matchesSearch && matchesFilter && matchesRole
  })

  const documentCounts = documents.reduce(
    (counts, doc) => ({
      ...counts,
      [doc.status]: (counts[doc.status] || 0) + 1,
    }),
    { pending: 0, approved: 0, rejected: 0 }
  )

  const handleStatusChange = async (doc, status) => {
    const remarks = status === "rejected"
      ? window.prompt("Comment for intern")
      : ""

    if (status === "rejected" && !remarks) return

    try {
      const res = await axios.post("http://localhost:5001/approve-document", {
        documentId: doc.id,
        status,
        remarks,
        reviewerEmail: user.email,
      })

      if (res.data.success) {
        setActionMessage(`Document ${status}.`)
        window.dispatchEvent(new Event("signature-count-changed"))
        fetchDocuments()
      } else {
        setActionMessage(res.data.message || "Unable to update document.")
      }
    } catch {
      setActionMessage("Unable to update document.")
    }
  }

  const handleDelete = async (doc) => {
    try {
      const res = await axios.post("http://localhost:5001/delete-document", {
        documentId: doc.id,
        email: user.email,
        role,
      })

      if (res.data.success) {
        setActionMessage("Document deleted.")
        fetchDocuments()
      } else {
        setActionMessage(res.data.message || "Unable to delete document.")
      }
    } catch {
      setActionMessage("Unable to delete document.")
    }
  }

  const canActOnDocument = (doc) => {
    if (doc.status !== "pending") return false
    if (role === "supervisor") {
      return String(doc.assigned_to || "").toLowerCase() === String(user.email || "").toLowerCase()
    }

    if (role === "hr") {
      return doc.need_signature && !doc.assigned_to
    }

    return false
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          {canReview ? "Document Review" : "My Documents"}
        </h1>
        <p className="page-subtitle">
          {canReview
            ? "Review submitted documents and update approval status."
            : "Track documents you submitted for internship approval."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{documentCounts.pending}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{documentCounts.approved}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-slate-500">Rejected</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{documentCounts.rejected}</p>
        </div>
      </div>

      <div className="glass-card flex flex-col gap-4 p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search title or uploader..."
            value={searchTerm}
            className="glass-field w-full pl-10 pr-4"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={filterStatus}
            className="glass-field pr-10"
            onChange={(event) => setFilterStatus(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button onClick={fetchDocuments} className="glass-button-secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-sky-200/70 bg-sky-50/70 px-4 py-3 text-sm text-sky-700">
          {actionMessage}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading documents...</div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead className="glass-table-head">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Uploaded By</th>
                  <th className="px-6 py-4">Type / File</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Signature</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Remarks</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="glass-divider divide-y">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/45">
                    <td className="flex items-center gap-3 px-6 py-4">
                      <div className="rounded-lg bg-white/55 p-2">
                        <FileText className="h-5 w-5 text-sky-600" />
                      </div>
                      <button
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        className="text-left font-medium text-sky-700 hover:text-sky-900 hover:underline"
                      >
                        {doc.title}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-slate-500">{doc.uploaded_by}</td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      <span className="block font-medium text-slate-700">
                        {doc.document_type || "Document"}
                      </span>
                      <span className="block max-w-40 truncate">
                        {doc.file_path || "No file selected"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getDeadlineBadge(doc.due_date)}`}>
                        {getDeadlineText(doc.due_date)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        doc.need_signature
                          ? "border-sky-200 bg-sky-100 text-sky-800"
                          : "border-slate-200 bg-white/70 text-slate-600"
                      }`}>
                        {doc.need_signature ? "Required" : "Not required"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">{doc.remarks || "-"}</td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          title="View document details"
                          className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        {canActOnDocument(doc) && (
                          <>
                            <button
                              onClick={() => handleStatusChange(doc, "approved")}
                              title="Approve document"
                              className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(doc, "rejected")}
                              title="Wrong document / send back"
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </>
                        )}

                        {role === "intern" && (
                          <button
                            onClick={() => handleDelete(doc)}
                            title="Delete document"
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDocuments.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">No documents found.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Documents
