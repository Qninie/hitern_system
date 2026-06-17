import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Check, Download, Eye, Send, Trash2, UploadCloud } from "lucide-react"

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

const getStatusBadge = (status) => {
  const styles = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-slate-200 text-slate-800 border-slate-300",
  }

  return styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
}

function DocumentReview() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const user = getStoredUser()
  const role = (user.role || "intern").toLowerCase()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [comment, setComment] = useState("")
  const [signedFile, setSignedFile] = useState(null)
  const signedFileInputRef = useRef(null)

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(`http://localhost:5001/documents/${documentId}`, {
        params: {
          role,
          email: user.email,
        },
      })

      if (res.data.success) {
        setDocument(res.data.document)
        setComment(res.data.document.remarks || "")
      } else {
        setMessage(res.data.message || "Document not found.")
      }
    } catch {
      setMessage("Cannot load document right now.")
    } finally {
      setLoading(false)
    }
  }, [documentId, role, user.email])

  useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  const handleSendBack = async () => {
    if (!comment.trim()) {
      setMessage("Please leave a comment before sending back to intern.")
      return
    }

    try {
      const res = await axios.post("http://localhost:5001/approve-document", {
        documentId,
        status: "rejected",
        remarks: comment.trim(),
        reviewerEmail: user.email,
      })

      if (res.data.success) {
        setMessage("Document sent back to intern.")
        window.dispatchEvent(new Event("signature-count-changed"))
        fetchDocument()
      } else {
        setMessage(res.data.message || "Unable to send back document.")
      }
    } catch {
      setMessage("Unable to send back document.")
    }
  }

  const handleUploadSignedDocument = async () => {
    if (!signedFile) {
      setMessage("Please choose the signed document first.")
      return
    }

    try {
      const formData = new FormData()
      formData.append("documentId", documentId)
      formData.append("reviewerEmail", user.email)
      formData.append("remarks", comment.trim())
      formData.append("signedDocument", signedFile)

      const res = await axios.post("http://localhost:5001/supervisor/upload-signed-document", formData)

      if (res.data.success) {
        setMessage("Signed document uploaded.")
        setSignedFile(null)
        if (signedFileInputRef.current) {
          signedFileInputRef.current.value = ""
        }
        window.dispatchEvent(new Event("signature-count-changed"))
        fetchDocument()
      } else {
        setMessage(res.data.message || "Unable to upload signed document.")
      }
    } catch {
      setMessage("Unable to upload signed document.")
    }
  }

  const handleViewSignedFile = () => {
    if (!signedFile) return

    const fileUrl = URL.createObjectURL(signedFile)
    window.open(fileUrl, "_blank", "noopener,noreferrer")
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000)
  }

  const handleRemoveSignedFile = () => {
    setSignedFile(null)

    if (signedFileInputRef.current) {
      signedFileInputRef.current.value = ""
    }
  }

  if (loading) {
    return <div className="glass-card p-8 text-center text-sm text-slate-500">Loading document...</div>
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate("/documents")} className="glass-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="glass-card p-8 text-center text-sm text-slate-500">{message || "Document not found."}</div>
      </div>
    )
  }

  const dueText = document.due_date
    ? `${formatDate(document.due_date)} | ${getDaysLeftText(document.due_date)}`
    : "No due date"
  const shouldShowDescription = document.document_type === "Others" && document.description
  const canWorkOnDocument =
    document.status === "pending" &&
    (
      (role === "supervisor" && String(document.assigned_to || "").toLowerCase() === String(user.email || "").toLowerCase()) ||
      (role === "hr" && document.need_signature && !document.assigned_to)
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Document Review &gt; {document.title}</h1>
        <p className="page-subtitle">Review document details and supervisor work status.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-sky-200/70 bg-sky-50/70 px-4 py-3 text-sm text-sky-700">
          {message}
        </div>
      )}

      <section className="glass-card p-5">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Document Name</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{document.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Submitted by {document.uploaded_by}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {document.file_path && (
              <>
                <a
                  href={`http://localhost:5001/uploads/${document.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button-secondary"
                >
                  <Eye className="h-4 w-4" />
                  View Document
                </a>
                <a
                  href={`http://localhost:5001/download/${document.file_path}`}
                  download
                  className="glass-button-secondary"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Type</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{document.document_type || "Document"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Due Date</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{dueText}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusBadge(document.status)}`}>
              {document.status}
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Signature</p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              document.need_signature
                ? "border-sky-200 bg-sky-100 text-sky-800"
                : "border-slate-200 bg-white text-slate-600"
            }`}>
              {document.need_signature ? "Required" : "Not required"}
            </span>
          </div>
        </div>

        {shouldShowDescription && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Intern Description</p>
            <p className="mt-1 text-sm text-slate-700">{document.description}</p>
          </div>
        )}

        {document.signed_file_path && (
          <div className="mt-5">
            <a
              href={`http://localhost:5001/uploads/${document.signed_file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button-secondary"
            >
              <Check className="h-4 w-4" />
              View Signed Document
            </a>
          </div>
        )}
      </section>

      {canWorkOnDocument && (
        <section className="glass-card p-5">
          <h3 className="font-semibold text-slate-950">Supervisor Working Section</h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload the signed document, or leave a comment and send it back to the intern.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Signed document</span>
              <input
                ref={signedFileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => setSignedFile(event.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => signedFileInputRef.current?.click()}
                className="glass-field mt-1 flex h-11 w-full items-center gap-3 px-3 py-0 text-left"
              >
                <span className="flex h-8 shrink-0 items-center rounded-md bg-sky-50 px-3 text-sm font-semibold text-sky-700">
                  Choose file
                </span>
                <span className="min-w-0 truncate text-sm text-slate-500">
                  {signedFile?.name || "No file chosen"}
                </span>
              </button>
              {signedFile && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/75 px-3 py-2 shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{signedFile.name}</p>
                    <p className="text-xs text-slate-500">{(signedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={handleViewSignedFile}
                      title="View selected file"
                      className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveSignedFile}
                      title="Remove selected file"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Comment</span>
              <textarea
                className="glass-field mt-1 min-h-24 w-full resize-y"
                placeholder="Leave a comment for the intern"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button onClick={handleSendBack} className="glass-button-secondary">
              <Send className="h-4 w-4" />
              Send Back to Intern
            </button>
            <button onClick={handleUploadSignedDocument} className="glass-button">
              <UploadCloud className="h-4 w-4" />
              Upload Signed
            </button>
          </div>
        </section>
      )}

      <div className="flex justify-start">
        <button onClick={() => navigate("/documents")} className="glass-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </div>
  )
}

export default DocumentReview
