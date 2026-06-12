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
  const [needSignature, setNeedSignature] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const user = getStoredUser()
  const role = (user.role || "intern").toLowerCase()

  const handleUpload = async () => {
    if (!title.trim()) {
      setMessage("Please enter a document title.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await axios.post("http://localhost:5001/upload-document", {
        title: title.trim(),
        uploadedBy: user.email || "intern@test.com",
        needSignature: needSignature
      })

      if (res.data.success) {
        setTitle("")
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
            <p className="text-sm text-gray-500">Add the document name and approval requirement.</p>
          </div>
        </div>

        <div className="grid gap-5">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Document title</span>
            <input
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Example: Duty Report Form"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="flex items-start gap-3 rounded-lg border p-4">
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

          <div className="flex justify-end">
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
