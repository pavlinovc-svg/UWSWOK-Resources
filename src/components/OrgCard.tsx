import { Link } from "react-router-dom";
import type { Organization } from "../types";
import { AvailabilityLights } from "./AvailabilityLights";

export function OrgCard({ org }: { org: Organization }) {
  const loc = org.hideAddress
    ? "Confidential location — call first."
    : [org.address, org.city, org.state].filter(Boolean).join(", ") || "Lawton, OK";
  return (
    <article className="card">
      <div className="row">
        <div className="photo-tile" style={{ background: org.photo.color, width: 52, height: 52, fontSize: "1rem" }}>
          {org.photo.initials}
        </div>
        <div>
          <Link className="title" to={`/org/${org.slug}`}>
            {org.name}
          </Link>
          {org.unitedWayPartner && <span className="badge">United Way partner</span>}
          <div className="muted">{loc}</div>
        </div>
      </div>
      <p className="muted">{org.shortDescription}</p>
      <div className="row">
        <AvailabilityLights availability={org.availability} />
        <span className="muted">{org.categories.join(" · ")}</span>
      </div>
    </article>
  );
}
