import { DEMO_ACCOUNTS, APPROVERS } from "../types";
import { setSession } from "../lib/store";
import { useNavigate } from "react-router-dom";

export function Demo() {
  const nav = useNavigate();
  return (
    <div className="page">
      <h1>Demo accounts</h1>
      <p>Local-only. Nothing is verified. Passwords are shown so reviewers can click through roles.</p>
      <div className="grid">
        {DEMO_ACCOUNTS.map((a) => (
          <article className="card" key={a.email}>
            <h2>{a.displayName}</h2>
            <p>
              {a.email} / {a.password}
            </p>
            <p className="muted">Role: {a.role}</p>
            <button
              className="btn"
              onClick={() => {
                setSession({
                  email: a.email,
                  role: a.role,
                  displayName: a.displayName,
                  assignedOrgSlug: a.assignedOrgSlug,
                });
                nav(a.role === "staff" ? "/staff" : a.role === "admin" ? "/admin" : "/");
              }}
            >
              Sign in as {a.role}
            </button>
          </article>
        ))}
      </div>
      <h2>Approvers</h2>
      <p>Only these three names can approve content: {APPROVERS.join(", ")} (placeholders).</p>
    </div>
  );
}
