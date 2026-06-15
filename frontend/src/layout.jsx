import { NavLink } from "react-router-dom";
import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Upload,
  UserRound,
  Users,
} from "lucide-react";

const defaultUser = {
  name: "Intern User",
  email: "intern@test.com",
  role: "intern",
};

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("hiternUser");
    return storedUser ? JSON.parse(storedUser) : defaultUser;
  } catch {
    return defaultUser;
  }
};

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

const hrNavItems = [
  { to: "/users", label: "Users", icon: Users },
];

function Layout({ children }) {
  const user = getStoredUser();
  const role = (user.role || "intern").toLowerCase();
  const displayName = user.name || user.email || "Hitern User";

  const handleLogout = () => {
    localStorage.removeItem("hiternUser");
    window.location.href = "/login";
  };

  const visibleNavItems = role === "hr" ? [...navItems, ...hrNavItems] : navItems;

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">

      <aside className="bg-red-700 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
        <div className="flex h-full flex-col p-5">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-100">
              Hitern System
            </p>
            <h1 className="mt-2 text-2xl font-bold">Document Center</h1>
          </div>

          <nav className="space-y-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-red-700 shadow-sm"
                        : "text-red-50 hover:bg-red-600"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg bg-red-800/60 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-red-700">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="text-xs capitalize text-red-100">{role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-50 hover:bg-red-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen flex-1 p-4 sm:p-6 lg:ml-72 lg:p-8">
        {children}
      </main>

    </div>
  );
}

export default Layout;
