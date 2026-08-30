import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CrisisBar } from "./CrisisBar";
import { AskButton } from "./AskButton";
import { getOnTheWay, getSession, setSession } from "../lib/store";
import { useMemo } from "react";

export function Layout() {
  const loc = useLocation();
  const nav = useNavigate();
  const session = getSession();
  const inbox = useMemo(() => {
    if (!session || session.role === "public") return [];
    const all = getOnTheWay();
    if (session.role === "staff" && session.assignedOrgSlug) {
      return all.filter((x) => x.orgSlug === session.assignedOrgSlug);
    }
    return all;
  }, [session, loc.key]);

  const publicPage = !["/login", "/demo"].includes(loc.pathname);

  return (
    <>
      <CrisisBar />
      <header className="topnav">
        <Link className="brand" to="/">
          UWSWOK Resources
        </Link>
        <nav className="nav-links">
          <NavLink to="/">Directory</NavLink>
          <NavLink to="/ask">Ask</NavLink>
          {session?.role === "staff" && <NavLink to="/staff">Staff</NavLink>}
          {session?.role === "staff" && (
            <NavLink to="/on-the-way">On the way{inbox.length ? ` (${inbox.length})` : ""}</NavLink>
          )}
          {session?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          {session?.role === "admin" && <NavLink to="/on-the-way">On the way</NavLink>}
          {session?.role === "police" && <NavLink to="/on-the-way">On the way</NavLink>}
          <NavLink to="/demo">Demo</NavLink>
          {session ? (
            <button
              className="linkish"
              onClick={() => {
                setSession(null);
                nav("/");
              }}
            >
              Sign out
            </button>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </nav>
      </header>
      {session?.role === "staff" && inbox.length > 0 && loc.pathname !== "/on-the-way" && (
        <div className="caution" style={{ textAlign: "center" }}>
          {inbox.length} “I’m on the way” notice{inbox.length === 1 ? "" : "s"} for your organization.{" "}
          <Link to="/on-the-way">Open inbox</Link>
        </div>
      )}
      <Outlet />
      {publicPage && <AskButton />}
      <footer className="site">
        Free community directory for southwest Oklahoma. Seeded from{" "}
        <a href="https://www.uwswok.org/resources">uwswok.org/resources</a>. No medical advice. No PHI stored.
        Separate from Lawton-America (v1).
      </footer>
    </>
  );
}
