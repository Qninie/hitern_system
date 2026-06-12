import { Link } from "react-router-dom";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage internship documents from one consistent workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/documents"
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow"
        >
          <FileText className="h-6 w-6 text-red-700" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            {canReview ? "Review documents" : "My documents"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Search, filter, view status, and keep document work moving.
          </p>
        </Link>

        <Link
          to="/upload"
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow"
        >
          <Upload className="h-6 w-6 text-red-700" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Upload document
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Interns can submit new documents for supervisor or HR approval.
          </p>
        </Link>

        <Link
          to="/notifications"
          className="rounded-lg border bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow"
        >
          <ClipboardCheck className="h-6 w-6 text-red-700" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Notifications
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Check document updates and pending approval reminders.
          </p>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
