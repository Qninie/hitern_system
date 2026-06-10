import { NavLink } from "react-router-dom";

function Layout({ children }) {
  return (
    <div className="flex">

      {/* Sidebar */}
      <div className="w-64 bg-red-600 text-white min-h-screen p-4">
        <h2 className="text-xl font-bold mb-6">Hitern</h2>

        <ul className="space-y-3">

          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "block bg-red-800 p-2 rounded"
                  : "block hover:bg-red-500 p-2 rounded"
              }
            >
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                isActive
                  ? "block bg-red-800 p-2 rounded"
                  : "block hover:bg-red-500 p-2 rounded"
              }
            >
              Upload
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/documents"
              className={({ isActive }) =>
                isActive
                  ? "block bg-red-800 p-2 rounded"
                  : "block hover:bg-red-500 p-2 rounded"
              }
            >
              Documents
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                isActive
                  ? "block bg-red-800 p-2 rounded"
                  : "block hover:bg-red-500 p-2 rounded"
              }
            >
              Notifications
            </NavLink>
          </li>

        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50">
        {children}
      </div>

    </div>
  );
}

export default Layout;