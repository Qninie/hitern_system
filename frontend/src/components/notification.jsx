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
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Document reminders and approval updates.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification, index) => (
              <div key={`${notification}-${index}`} className="flex gap-3 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{notification}</p>
                  <p className="mt-1 text-xs text-gray-500">Hitern System</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-gray-500">
            No notifications found.
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
