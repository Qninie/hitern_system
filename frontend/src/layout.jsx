import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("hiternSidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("hiternUser");
    window.location.href = "/login";
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((current) => {
      const nextValue = !current;
      localStorage.setItem("hiternSidebarCollapsed", String(nextValue));
      return nextValue;
    });
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

      <aside
        className={`glass-panel overflow-visible text-slate-800 transition-[width] duration-300 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:m-5 lg:rounded-2xl ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-72"
        }`}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/75 text-slate-600 shadow-lg shadow-sky-900/15 backdrop-blur-xl transition hover:bg-sky-100 hover:text-sky-800 lg:flex"
          title={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        <div className={`flex h-full flex-col ${isSidebarCollapsed ? "p-3" : "p-5"}`}>
          <div className="mb-8 flex justify-center">
            {isSidebarCollapsed ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/90 bg-gradient-to-br from-white/90 to-sky-100/80 text-base font-bold text-sky-700 shadow-lg shadow-sky-900/10 backdrop-blur-xl">
                H
              </div>
            ) : (
              <div className="flex w-full items-center justify-center rounded-full border border-white/90 bg-gradient-to-br from-white/85 to-sky-100/70 px-5 py-4 shadow-lg shadow-sky-900/10 backdrop-blur-xl">
                <span className="text-xl font-bold text-slate-950">Hitern</span>
              </div>
            )}
          </div>

          <nav className={`space-y-2 ${isSidebarCollapsed ? "flex flex-col items-center" : ""}`}>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `group relative flex items-center text-sm font-medium transition ${
                      isSidebarCollapsed
                        ? "h-12 w-12 justify-center rounded-full border border-white/70 px-0 py-0 shadow-sm backdrop-blur-xl"
                        : "gap-3 rounded-lg px-3 py-2.5"
                    } ${
                      isActive
                        ? "bg-sky-200/90 text-slate-950 shadow-md shadow-sky-900/10"
                        : "bg-white/35 text-slate-600 hover:bg-white/75 hover:text-sky-700"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {!isSidebarCollapsed && item.label}
                  {isSidebarCollapsed && (
                    <span className="pointer-events-none absolute left-14 top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xl shadow-sky-900/15 backdrop-blur-xl group-hover:block">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className={`mt-auto border border-white/80 bg-white/55 shadow-sm backdrop-blur-xl ${
            isSidebarCollapsed ? "rounded-full p-2" : "rounded-lg p-4"
          }`}>
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
              <div className={`glass-icon shrink-0 ${isSidebarCollapsed ? "h-10 w-10 rounded-full" : "h-10 w-10"}`}>
                <UserRound className="h-5 w-5" />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="text-xs capitalize text-slate-500">
                    {role === "hr" ? "Human Resources" : role}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className={`flex items-center justify-center border border-white/80 bg-white/65 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-sky-50 ${
                isSidebarCollapsed
                  ? "mx-auto mt-2 h-10 w-10 rounded-full p-0"
                  : "mt-4 w-full gap-2 rounded-lg px-3 py-2"
              }`}
              title={isSidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isSidebarCollapsed && "Logout"}
            </button>
          </div>
        </div>
      </aside>

      <main
        className={`relative z-0 min-h-screen min-w-0 flex-1 p-4 transition-[margin] duration-300 sm:p-6 lg:p-8 ${
          isSidebarCollapsed ? "lg:ml-28" : "lg:ml-80"
        }`}
      >
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
