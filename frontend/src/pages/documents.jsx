import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, FileText, Check, X, Eye } from "lucide-react";


function Documents() {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5001/documents");
      if (res.data.success) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter logic
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || doc.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Approve
  const handleApprove = async (docId) => {
    try {
      const res = await axios.post(
        "http://localhost:5001/approve-document",
        {
          documentId: docId,
          status: "approved",
        }
      );

      if (res.data.success) {
        fetchDocuments(); // refresh
      }
    } catch (err) {
      alert("Error approving document");
    }
  };

  // Reject
  const handleReject = async (docId) => {
    try {
      const res = await axios.post(
        "http://localhost:5001/approve-document",
        {
          documentId: docId,
          status: "rejected",
        }
      );

      if (res.data.success) {
        fetchDocuments(); // refresh
      }
    } catch (err) {
      alert("Error rejecting document");
    }
  };

  // Status badge style
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Document Approval
        </h1>
        <p className="text-gray-500 text-sm">
          Review and approve documents in Hitern System
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading documents...
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                    Document
                  </th>
                  <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                    Uploaded By
                  </th>
                  <th className="px-6 py-4 text-xs text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs text-gray-500 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-medium text-gray-700">
                        {doc.title}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {doc.uploaded_by}
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
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-5 h-5" />
                        </button>

                        {doc.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(doc.id)}
                              className="p-2 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Check className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => handleReject(doc.id)}
                              className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
              <div className="p-10 text-center text-red-500">
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