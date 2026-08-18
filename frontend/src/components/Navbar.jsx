import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { listNotifications } from "../api/notifications.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  // Refresh the unread count whenever the route changes (cheap and keeps the
  // badge current after visiting the notifications page).
  useEffect(() => {
    let active = true;
    listNotifications({ unread: true })
      .then((data) => {
        if (active) setUnread(data.unread ?? data.count ?? 0);
      })
      .catch(() => {
        if (active) setUnread(0);
      });
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-indigo-800 text-white"
        : "text-indigo-100 hover:bg-indigo-500 hover:text-white"
    }`;

  return (
    <nav className="bg-indigo-600 shadow">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/reports" className="text-lg font-bold text-white">
              📣 SaySomething
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              <NavLink to="/reports" end className={linkClass}>
                My Reports
              </NavLink>
              <NavLink to="/reports/new" className={linkClass}>
                New Report
              </NavLink>
              <NavLink to="/notifications" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  Notifications
                  {unread > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                      {unread}
                    </span>
                  )}
                </span>
              </NavLink>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-indigo-100 sm:inline">
              {user?.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-indigo-800 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
