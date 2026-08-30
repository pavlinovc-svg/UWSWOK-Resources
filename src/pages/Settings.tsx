import { Navigate } from "react-router-dom";
import { getSession } from "../lib/store";

export function Settings() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return (
    <div className="page">
      <h1>Notification settings</h1>
      <div className="coming">
        Email and SMS alerts — Coming when a secure backend is approved. This page is a placeholder. No messages are sent.
      </div>
      <label className="field">
        Email (not saved to a server)
        <input placeholder="you@example.org" disabled />
      </label>
      <label className="field">
        SMS (not saved to a server)
        <input placeholder="580-555-0100" disabled />
      </label>
    </div>
  );
}
