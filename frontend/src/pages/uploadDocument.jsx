import { useState } from "react"
import axios from "axios"
import { CheckCircle2, FileUp, ShieldCheck, Upload } from "lucide-react"

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
  const [fileName, setFileName] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [needSignature, setNeedSignature] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const user = getStoredUser()
  const role = (user.role || "intern").toLowerCase()
  const defaultSupervisor = user.supervisor_email || ""

  const handleUpload = async () => {
    if (!title.trim()) {
      setMessage("Please enter a document title.")
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
      formData.append("assignedTo", assignedTo || defaultSupervisor)

      if (selectedFile) {
        formData.append("documentFile", selectedFile)
      }

      const res = await axios.post("http://localhost:5001/upload-document", formData)

      if (res.data.success) {
        setTitle("")
        setDocumentType("Report")
        setFileName("")
        setSelectedFile(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
          <p className="mt-1 text-sm text-gray-500">
            Only interns can submit new documents.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-red-700" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Review access enabled
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Supervisors and HR use the Documents page to review, approve, or reject submitted documents.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit internship documents for supervisor or HR review.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <FileUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Document details</h2>
            <p className="text-sm text-gray-500">Add file details, deadline, and approval requirement.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Document title</span>
            <input
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Example: Duty Report Form"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Document type</span>
            <select
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
            >
              <option>Report</option>
              <option>Form</option>
              <option>Image</option>
              <option>PDF</option>
              <option>Other</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Document file</span>
            <input
              type="file"
              className="mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              onChange={(event) => {
                const file = event.target.files?.[0]
                setSelectedFile(file || null)
                setFileName(file?.name || "")
              }}
            />
            {fileName && <p className="mt-1 text-xs text-gray-500">{fileName}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Due date</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Supervisor email</span>
            <input
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Assigned supervisor email"
              value={assignedTo || defaultSupervisor}
              onChange={(event) => setAssignedTo(event.target.value)}
            />
          </label>

          <label className="flex items-start gap-3 rounded-lg border p-4 md:col-span-2">
            <input
              type="checkbox"
              checked={needSignature}
              onChange={(e) => setNeedSignature(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-500"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">
                Need supervisor signature
              </span>
              <span className="block text-sm text-gray-500">
                Supervisor will be notified when this document is submitted.
              </span>
            </span>
          </label>

          {message && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          )}

          <div className="flex justify-end md:col-span-2">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Upload className="h-4 w-4" />
              {loading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadDocument
