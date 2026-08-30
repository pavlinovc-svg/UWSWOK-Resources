import { Link, Navigate } from "react-router-dom";
import { getOnTheWay, getSession } from "../lib/store";

export function OnTheWay() {
  const session = getSession();
  if (!session || session.role === "public") return <Navigate to="/login" replace />;
  let items = getOnTheWay();
  if (session.role === "staff" && session.assignedOrgSlug) {
    items = items.filter((x) => x.orgSlug === session.assignedOrgSlug);
  }
  return (
    <div className="page">
      <h1>On the way inbox</h1>
      <p className="muted">These notices never reserve a bed or spot. Settings for email/SMS are a stub.</p>
      <p>
        <Link to="/settings">Notification settings</Link>
      </p>
      {items.length === 0 && <p>No notices yet. Use “I’m on the way” on an organization page.</p>}
      {items.map((it) => (
        <article className="card" key={it.id} style={{ marginBottom: "0.75rem" }}>
          <strong>{it.orgName}</strong>
          <p>{it.note}</p>
          <p className="muted">
            {new Date(it.createdAt).toLocaleString()} · from {it.fromRole}
          </p>
        </article>
      ))}
    </div>
  );
}
