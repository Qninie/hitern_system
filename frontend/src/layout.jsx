import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";
import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Upload,
  UserRound,
  Users,
} from "lucide-react";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("hiternUser");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const internNavItems = [
  { to: "/upload", label: "Upload", icon: Upload },
];

const hrNavItems = [
  { to: "/users", label: "Users", icon: Users },
];

function Layout({ children }) {
  const user = getStoredUser();
  const role = (user?.role || "").toLowerCase();
  const displayName = user?.name || user?.email || "Hitern User";
  const [signatureCount, setSignatureCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("hiternUser");
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchSignatureCount = async () => {
      if (role !== "supervisor" || !user?.email) {
        setSignatureCount(0);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5001/signature-count", {
          params: { role, email: user.email },
        });
        setSignatureCount(res.data.count || 0);
      } catch {
        setSignatureCount(0);
      }
    };

    fetchSignatureCount();
    window.addEventListener("signature-count-changed", fetchSignatureCount);

    return () => {
      window.removeEventListener("signature-count-changed", fetchSignatureCount);
    };
  }, [role, user?.email]);

  if (!user?.email) {
    window.location.href = "/login";
    return null;
  }

  const visibleNavItems = [
    ...navItems,
    ...(role === "intern" ? internNavItems : []),
    ...(role === "hr" ? hrNavItems : []),
  ];

  return (
    <div className="app-surface lg:flex">

      <aside className="glass-panel text-slate-800 lg:fixed lg:inset-y-0 lg:left-0 lg:m-5 lg:w-72 lg:rounded-2xl">
        <div className="flex h-full flex-col p-5">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
              Hitern System
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Document Center</h1>
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
                        ? "bg-sky-200 text-slate-950 shadow-sm"
                        : "text-slate-600 hover:bg-white/45 hover:text-sky-700"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-slate-200/80 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="glass-icon h-10 w-10">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="text-xs capitalize text-slate-500">{role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen flex-1 p-4 sm:p-6 lg:ml-80 lg:p-8">
        <div className="relative mb-5 flex justify-end">
          <button
            type="button"
            onClick={() => setShowNotifications((current) => !current)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/75 text-slate-600 shadow-sm transition hover:bg-sky-50 hover:text-sky-700"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {signatureCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1 text-xs font-bold text-white">
                {signatureCount}
              </span>
            ) : (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sky-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 z-20 w-80 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-xl shadow-sky-900/10 backdrop-blur">
              <p className="text-sm font-semibold text-slate-950">Notifications</p>

              {role === "supervisor" && signatureCount > 0 ? (
                <Link
                  to="/documents"
                  onClick={() => setShowNotifications(false)}
                  className="mt-3 flex items-start gap-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-3 text-left transition hover:bg-sky-100"
                >
                  <div className="glass-icon h-9 w-9 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      You have {signatureCount} document{signatureCount > 1 ? "s" : ""} to sign.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Click here to open the document page.
                    </p>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="mt-3 block rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50"
                >
                  View all notifications
                </Link>
              )}
            </div>
          )}
        </div>
        {children}
      </main>

    </div>
  );
}

export default Layout;
