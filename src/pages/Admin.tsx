import { Navigate } from "react-router-dom";
import { APPROVERS } from "../types";
import { addReminder, getApprovals, getSession, saveApprovals } from "../lib/store";
import { useState } from "react";

export function Admin() {
  const session = getSession();
  if (!session || session.role !== "admin") return <Navigate to="/login" replace />;
  const [approver, setApprover] = useState<string>(APPROVERS[0]);
  const [items, setItems] = useState(() => getApprovals());
  const [flash, setFlash] = useState("");

  function decide(id: string, status: "approved" | "denied") {
    if (!APPROVERS.includes(approver as (typeof APPROVERS)[number])) {
      setFlash("Only vocalbacco, Approver B, or Approver C can approve.");
      return;
    }
    const next = items.map((it) =>
      it.id === id ? { ...it, status, decidedBy: approver, decidedAt: new Date().toISOString() } : it
    );
    saveApprovals(next);
    setItems(next);
    setFlash(`${status} by ${approver}`);
  }

  function remind(id: string) {
    addReminder({ id: `rem-${Date.now()}`, approvalId: id, at: new Date().toISOString(), by: approver });
    setFlash(`Reminder event logged for ${id} at ${new Date().toLocaleString()}`);
  }

  return (
    <div className="page">
      <h1>Approval queue</h1>
      <p>Pending content changes. Only three approvers can act.</p>
      <label className="field">
        Acting as approver
        <select value={approver} onChange={(e) => setApprover(e.target.value)}>
          {APPROVERS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </label>
      {flash && <p>{flash}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Org</th>
            <th>Change</th>
            <th>Requested</th>
            <th>Status</th>
            <th>Decision</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.orgName}</td>
              <td>
                <strong>{it.field}</strong> — {it.summary}
              </td>
              <td>
                {it.requestedBy}
                <br />
                <span className="muted">{new Date(it.requestedAt).toLocaleString()}</span>
              </td>
              <td>{it.status}</td>
              <td>
                {it.decidedBy ? (
                  <>
                    {it.decidedBy}
                    <br />
                    <span className="muted">{it.decidedAt ? new Date(it.decidedAt).toLocaleString() : ""}</span>
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td>
                {it.status === "pending" && (
                  <div className="row">
                    <button className="btn" onClick={() => decide(it.id, "approved")}>
                      Approve
                    </button>
                    <button className="btn ghost" onClick={() => decide(it.id, "denied")}>
                      Deny
                    </button>
                    <button className="btn ghost" onClick={() => remind(it.id)}>
                      Reminder
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
