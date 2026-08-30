import { Link, useNavigate } from "react-router-dom";
import { DEMO_ACCOUNTS } from "../types";
import { setSession } from "../lib/store";
import { useState, type FormEvent } from "react";

export function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  function asPublic() {
    setSession({ email: "public@local", role: "public", displayName: "Public visitor" });
    nav("/");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const acc = DEMO_ACCOUNTS.find((a) => a.email === email.trim() && a.password === password);
    if (!acc) {
      setErr("Unknown demo account. See Demo for passwords.");
      return;
    }
    setSession({
      email: acc.email,
      role: acc.role,
      displayName: acc.displayName,
      assignedOrgSlug: acc.assignedOrgSlug,
    });
    if (acc.role === "staff") nav("/staff");
    else if (acc.role === "admin") nav("/admin");
    else nav("/");
  }

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1>Sign in</h1>
        <p>Choose a role. Public continues without a password. Staff, police, and admin use demo accounts.</p>
        <button className="btn" onClick={asPublic}>
          Public — continue
        </button>
        <form onSubmit={submit}>
          <label className="field">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@lawtonfoodbank.org" />
          </label>
          <label className="field">
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {err && <p>{err}</p>}
          <div className="row">
            <button className="btn secondary" type="submit">
              Org staff / Police / Super admin
            </button>
          </div>
        </form>
        <p className="muted">
          <Link to="/demo">Demo accounts</Link>
        </p>
      </div>
    </div>
  );
}
