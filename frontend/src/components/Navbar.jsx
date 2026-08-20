import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { listNotifications } from "../api/notifications.js";
import { ROLES, homePathForRole } from "../utils/roles.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Refresh the unread count whenever the route changes (cheap, keeps the
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

  // Collapse the mobile menu on navigation so it never lingers over a new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-white/15 text-white"
        : "text-mint hover:bg-white/10 hover:text-white"
    }`;

  const role = user?.role;

  // Role-aware primary links (Notifications is rendered separately for its badge).
  const links = [];
  if (role === ROLES.CITIZEN) {
    links.push({ to: "/reports", label: "My Reports", end: true });
    links.push({ to: "/reports/new", label: "New Report" });
  }
  if (role === ROLES.AUTHORITY || role === ROLES.ADMINISTRATOR) {
    links.push({ to: "/dashboard", label: "Dashboard" });
  }
  if (role === ROLES.ADMINISTRATOR) {
    links.push({ to: "/admin/users", label: "Users" });
  }

  const notificationsLink = (
    <NavLink to="/notifications" className={linkClass}>
      <span className="inline-flex items-center gap-1.5">
        Notifications
        {unread > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-mint px-1.5 text-xs font-semibold text-forest">
            {unread}
          </span>
        )}
      </span>
    </NavLink>
  );

  return (
    <nav className="border-b border-forest-line bg-forest-surface">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={homePathForRole(role)}
              className="flex items-center gap-2 text-lg font-bold text-white"
            >
              <img src="/logo.png" alt="" className="h-8 w-8" />
              SaySomething
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                  {l.label}
                </NavLink>
              ))}
              {notificationsLink}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm leading-tight text-white">
                {user?.full_name}
              </span>
              {role && (
                <span className="block text-xs leading-tight text-mint">
                  {role}
                </span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="hidden rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 sm:block"
            >
              Logout
            </button>

            {/* Mobile menu toggle (below sm the desktop links are hidden) */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              className="relative rounded-md border border-white/15 bg-white/5 p-2 text-white transition hover:bg-white/10 sm:hidden"
            >
              {/* Keep the unread signal visible while the menu is closed */}
              {!menuOpen && unread > 0 && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mint" />
              )}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-forest-line px-4 py-3 sm:hidden">
          <div className="mb-3 flex flex-col">
            <span className="text-sm font-medium text-white">
              {user?.full_name}
            </span>
            {role && <span className="text-xs text-mint">{role}</span>}
          </div>
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            {notificationsLink}
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
