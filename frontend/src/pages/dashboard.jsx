import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { ClipboardCheck, FileText, Upload } from "lucide-react";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {};
  } catch {
    return {};
  }
};

function Dashboard() {
  const user = getStoredUser();
  const role = (user.role || "intern").toLowerCase();
  const canReview = role === "supervisor" || role === "hr";
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get("http://localhost:5001/documents", {
          params: {
            role,
            email: user.email,
          },
        });

        if (res.data.success) {
          setDocuments(res.data.documents || []);
        }
      } catch {
        setDocuments([]);
      }
    };

    fetchDocuments();
  }, [role, user.email]);

  const counts = documents.reduce(
    (summary, document) => ({
      ...summary,
      [document.status]: (summary[document.status] || 0) + 1,
    }),
    { pending: 0, approved: 0, rejected: 0 }
  );

  const urgentDocuments = documents
    .filter((document) => document.due_date && document.status === "pending")
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Manage internship documents from one consistent workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{documents.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{counts.pending}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{counts.approved}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm font-medium text-slate-500">Rejected</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{counts.rejected}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/documents"
          className="glass-card p-5 transition hover:bg-white/70 hover:shadow-md"
        >
          <FileText className="h-6 w-6 text-sky-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            {canReview ? "Review documents" : "My documents"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Search, filter, view status, and keep document work moving.
          </p>
        </Link>

        <Link
          to="/upload"
          className="glass-card p-5 transition hover:bg-white/70 hover:shadow-md"
        >
          <Upload className="h-6 w-6 text-sky-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            Upload document
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Interns can submit new documents for supervisor or HR approval.
          </p>
        </Link>

        <Link
          to="/notifications"
          className="glass-card p-5 transition hover:bg-white/70 hover:shadow-md"
        >
          <ClipboardCheck className="h-6 w-6 text-sky-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            Notifications
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Check document updates and pending approval reminders.
          </p>
        </Link>
      </div>

      <div className="glass-card p-5">
        <h2 className="font-semibold text-slate-950">Upcoming deadlines</h2>
        <div className="glass-divider mt-4 divide-y">
          {urgentDocuments.length > 0 ? (
            urgentDocuments.map((document) => (
              <div key={document.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">{document.title}</p>
                  <p className="text-sm text-slate-500">{document.uploaded_by}</p>
                </div>
                <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-sky-700">
                  {document.due_date ? new Date(document.due_date).toLocaleDateString() : "No due date"}
                </span>
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-slate-500">No pending deadlines.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
