import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, FileText, Check, X, Eye, RefreshCw } from "lucide-react";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {};
  } catch {
    return {};
  }
};

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const user = getStoredUser();
  const role = (user.role || "intern").toLowerCase();
  const canReview = role === "supervisor" || role === "hr";

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5001/documents", {
        params: {
          role,
          email: user.email,
        },
      });
      if (res.data.success) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [role, user.email]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = documents.filter((doc) => {
    const title = doc.title || "";
    const uploader = doc.uploaded_by || "";
    const matchesSearch = `${title} ${uploader}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || doc.status === filterStatus;
    const matchesRole =
      canReview || !user.email || uploader.toLowerCase() === user.email.toLowerCase();

    return matchesSearch && matchesFilter && matchesRole;
  });

  const documentCounts = documents.reduce(
    (counts, doc) => ({
      ...counts,
      [doc.status]: (counts[doc.status] || 0) + 1,
    }),
    { pending: 0, approved: 0, rejected: 0 }
  );

  const handleStatusChange = async (docId, status) => {
    try {
      const res = await axios.post(
        "http://localhost:5001/approve-document",
        {
          documentId: docId,
          status,
        }
      );

      if (res.data.success) {
        setActionMessage(`Document ${status}.`);
        fetchDocuments();
      }
    } catch {
      setActionMessage(`Error updating document status.`);
    }
  };

  const handleView = (doc) => {
    if (doc.file_path) {
      window.open(`http://localhost:5001/uploads/${doc.file_path}`, "_blank", "noopener,noreferrer");
      return;
    }

    setActionMessage(`File: ${doc.file_path || "No file selected"} for "${doc.title}".`);
  };

  const getDeadlineText = (dueDate) => {
    if (!dueDate) return "No due date";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return `${Math.abs(daysLeft)} day(s) overdue`;
    if (daysLeft === 0) return "Due today";
    return `${daysLeft} day(s) left`;
  };

  const getDeadlineBadge = (dueDate) => {
    if (!dueDate) return "bg-gray-100 text-gray-700";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return "bg-red-100 text-red-800";
    if (daysLeft <= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {canReview ? "Document Review" : "My Documents"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {canReview
            ? "Review submitted documents and update approval status."
            : "Track documents you submitted for internship approval."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pending</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{documentCounts.pending}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Approved</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{documentCounts.approved}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Rejected</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{documentCounts.rejected}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm md:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search title or uploader..."
            value={searchTerm}
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            className="rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={fetchDocuments}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {actionMessage && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading documents...
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                    Document
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                    Uploaded By
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                    Type / File
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                    Signature
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="rounded-lg bg-red-50 p-2">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-medium text-gray-700">
                        {doc.title}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {doc.uploaded_by}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="block font-medium text-gray-700">
                        {doc.document_type || "Document"}
                      </span>
                      <span className="block max-w-40 truncate">
                        {doc.file_path || "No file selected"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getDeadlineBadge(
                          doc.due_date
                        )}`}
                      >
                        {getDeadlineText(doc.due_date)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.need_signature ? "Required" : "Not required"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleView(doc)}
                          title="View document"
                          className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {canReview && doc.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(doc.id, "approved")}
                              title="Approve document"
                              className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600"
                            >
                              <Check className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => handleStatusChange(doc.id, "rejected")}
                              title="Reject document"
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDocuments.length === 0 && (
              <div className="p-10 text-center text-sm text-gray-500">
                No documents found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}



export default Documents;
