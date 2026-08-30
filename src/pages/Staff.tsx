import { Navigate } from "react-router-dom";
import { getOrg, getSession, setLight } from "../lib/store";
import type { Availability, LightStatus } from "../types";
import { useState } from "react";
import { AvailabilityLights } from "../components/AvailabilityLights";

const KEYS: (keyof Availability)[] = ["space", "staff", "transport", "appointments"];

export function Staff() {
  const session = getSession();
  if (!session || session.role !== "staff") return <Navigate to="/login" replace />;
  const slug = session.assignedOrgSlug || "lawton-food-bank";
  const [tick, setTick] = useState(0);
  const org = getOrg(slug);
  if (!org) return <div className="page">Assigned organization missing.</div>;

  return (
    <div className="page">
      <h1>Staff dashboard</h1>
      <p>
        Signed in as {session.email}. You can only toggle lights for <strong>{org.name}</strong>.
      </p>
      <AvailabilityLights availability={org.availability} detailed />
      {KEYS.map((k) => (
        <div key={k} className="row" style={{ margin: "0.6rem 0" }}>
          <strong style={{ textTransform: "capitalize", minWidth: 120 }}>{k}</strong>
          {(["green", "amber", "red"] as LightStatus[]).map((s) => (
            <button
              key={s}
              className="btn ghost"
              onClick={() => {
                setLight(org.slug, k, s);
                setTick(tick + 1);
              }}
            >
              <span className={`dot ${s}`} /> {s}
            </button>
          ))}
        </div>
      ))}
      <p className="muted">Changes stay in this browser (localStorage) and show on the public directory.</p>
    </div>
  );
}
