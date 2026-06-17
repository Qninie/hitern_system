import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { CheckCircle2, ChevronDown, Eye, FileUp, ShieldCheck, Trash2, Upload } from "lucide-react"

const documentTypes = [
  "Report",
  "Logbook",
  "Resume / CV",
  "University Document",
  "Company Document",
  "Others",
]

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {}
  } catch {
    return {}
  }
}

function UploadDocument() {

  const [title, setTitle] = useState("")
  const [documentType, setDocumentType] = useState("Report")
  const [description, setDescription] = useState("")
  const [fileName, setFileName] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [approvers, setApprovers] = useState([])
  const [needSignature, setNeedSignature] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const fileInputRef = useRef(null)
  const dueDateInputRef = useRef(null)
  const user = getStoredUser()
  const role = (user.role || "intern").toLowerCase()
  const defaultSupervisor = user.supervisor_email || ""

  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        const res = await axios.get("http://localhost:5001/approvers", {
          params: { supervisorEmail: defaultSupervisor },
        })
        setApprovers(res.data.approvers || [])
      } catch {
        setApprovers([])
      }
    }

    fetchApprovers()
  }, [defaultSupervisor])

  const handleViewSelectedFile = () => {
    if (!selectedFile) return

    const fileUrl = URL.createObjectURL(selectedFile)
    window.open(fileUrl, "_blank", "noopener,noreferrer")
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000)
  }

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    setFileName("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const openDueDatePicker = () => {
    if (typeof dueDateInputRef.current?.showPicker === "function") {
      dueDateInputRef.current.showPicker()
    }
  }

  const handleUpload = async () => {
    if (!title.trim()) {
      setMessage("Please enter a document name.")
      return
    }

    if (documentType === "Others" && !description.trim()) {
      setMessage("Please enter a description for Others.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("title", title.trim())
      formData.append("uploadedBy", user.email || "intern@test.com")
      formData.append("needSignature", needSignature)
      formData.append("dueDate", dueDate)
      formData.append("fileName", fileName)
      formData.append("documentType", documentType)
      formData.append("description", description.trim())
      formData.append("assignedTo", needSignature && assignedTo !== "hr" ? assignedTo || defaultSupervisor : "")

      if (selectedFile) {
        formData.append("documentFile", selectedFile)
      }

      const res = await axios.post("http://localhost:5001/upload-document", formData)

      if (res.data.success) {
        setTitle("")
        setDocumentType("Report")
        setDescription("")
        setFileName("")
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        setDueDate("")
        setAssignedTo("")
        setNeedSignature(false)
        setMessage("Document uploaded successfully.")
      } else {
        setMessage("Upload failed.")
      }
    } catch {
      setMessage("Cannot upload document right now.")
    } finally {
      setLoading(false)
    }
  }

  if (role !== "intern") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Upload Document</h1>
          <p className="page-subtitle">
            Only interns can submit new documents.
          </p>
        </div>

        <div className="glass-card p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-sky-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            Review access enabled
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Supervisors and Human Resources use the Documents page to review, approve, or reject submitted documents.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Upload Document</h1>
        <p className="page-subtitle">
          Submit internship documents for supervisor or Human Resources review.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-200/70 bg-sky-50/70 px-4 py-3 text-sm text-sky-700 shadow-sm">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      <div className="glass-card p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200/80 pb-5">
          <div className="glass-icon h-11 w-11">
            <FileUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Document details</h2>
            <p className="text-sm text-slate-500">Add file details, deadline, and approval requirement.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Document name</span>
            <input
              className="glass-field mt-1 w-full"
              placeholder="Example: Weekly Logbook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Document type</span>
            <div className="relative mt-1">
              <select
                className="glass-field w-full appearance-none pr-12"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          {documentType === "Others" && (
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                className="glass-field mt-1 min-h-24 w-full resize-y"
                placeholder="Describe this document"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Document file</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                setSelectedFile(file || null)
                setFileName(file?.name || "")
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass-field mt-1 flex h-11 w-full items-center gap-3 px-3 py-0 text-left"
            >
              <span className="flex h-8 shrink-0 items-center rounded-md bg-sky-50 px-3 text-sm font-semibold text-sky-700">
                Choose file
              </span>
              <span className="min-w-0 truncate text-sm text-slate-500">
                {fileName || "No file chosen"}
              </span>
            </button>
            {selectedFile && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/75 px-3 py-2 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{fileName}</p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={handleViewSelectedFile}
                    title="View selected file"
                    className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveSelectedFile}
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
            <span className="text-sm font-medium text-slate-700">Due date</span>
            <input
              ref={dueDateInputRef}
              type="date"
              className="glass-field mt-1 h-11 w-full"
              value={dueDate}
              onClick={openDueDatePicker}
              onFocus={openDueDatePicker}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-white/70 p-4 md:col-span-2">
            <input
              type="checkbox"
              checked={needSignature}
              onChange={(e) => {
                setNeedSignature(e.target.checked)
                if (!e.target.checked) setAssignedTo("")
              }}
              className="mt-1 h-4 w-4 rounded border-sky-200 text-sky-600 focus:ring-sky-300"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Need supervisor signature
              </span>
              <span className="block text-sm text-slate-500">
                Supervisor will be notified when this document is submitted.
              </span>
            </span>
          </label>

          {needSignature && (
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Supervisor / approver</span>
              <div className="relative mt-1">
                <select
                  className="glass-field w-full appearance-none pr-12"
                  value={assignedTo || defaultSupervisor}
                  onChange={(event) => setAssignedTo(event.target.value)}
                >
                  <option value="">Select approver</option>
                  {approvers.map((approver) => {
                    const label = approver.role === "hr" ? "Human Resources" : "Supervisor"

                    return (
                      <option
                        key={`${approver.role}-${approver.id}`}
                        value={approver.role === "hr" ? "hr" : approver.email}
                      >
                        {label} - {approver.name || (approver.role === "hr" ? "Human Resources" : "Supervisor")}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>
          )}

          <div className="flex justify-end md:col-span-2">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="glass-button px-5"
            >
              <Upload className="h-4 w-4" />
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadDocument
