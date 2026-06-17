import { useEffect, useState } from "react";
import axios from "axios";
import { Bell } from "lucide-react";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("hiternUser")) || {};
  } catch {
    return {};
  }
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://localhost:5001/notifications", {
          params: {
            role: user.role,
            email: user.email,
          },
        });
        setNotifications(res.data.notifications || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user.email, user.role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">
          Document reminders and approval updates.
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <div className="glass-divider divide-y">
            {notifications.map((notification, index) => (
              <div key={`${notification}-${index}`} className="flex gap-3 p-5">
                <div className="glass-icon h-10 w-10 shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{notification}</p>
                  <p className="mt-1 text-xs text-slate-500">Hitern System</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-slate-500">
            No notifications found.
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
