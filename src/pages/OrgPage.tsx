import { useParams } from "react-router-dom";
import { addOnTheWay, formatPhoneHref, getOrg, getSession } from "../lib/store";
import { AvailabilityLights } from "../components/AvailabilityLights";
import { AppLink } from "../components/WebViewOverlay";
import { useState } from "react";

function mapsUrls(address: string, city: string, state: string) {
  const q = encodeURIComponent([address, city, state].filter(Boolean).join(", "));
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple: `https://maps.apple.com/?q=${q}`,
  };
}

export function OrgPage() {
  const { slug } = useParams();
  const org = slug ? getOrg(slug) : undefined;
  const [sent, setSent] = useState(false);
  if (!org) {
    return (
      <div className="page">
        <p>That organization is not in the United Way listings.</p>
      </div>
    );
  }
  const tel = formatPhoneHref(org.phone);
  const maps = !org.hideAddress && org.address ? mapsUrls(org.address, org.city || "Lawton", org.state || "OK") : null;

  return (
    <div className="page">
      <article className="card">
        <div className="row">
          <div className="photo-tile" style={{ background: org.photo.color }}>
            {org.photo.initials}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>
              {org.name}
              {org.unitedWayPartner && <span className="badge">United Way partner</span>}
            </h1>
            <p className="muted">{org.categories.join(" · ")}</p>
          </div>
        </div>
        <p>{org.description}</p>
        {org.hideAddress ? (
          <p>
            <strong>Confidential location — call first.</strong> Street address and map pin are hidden.
          </p>
        ) : (
          <p>
            <strong>Address:</strong> {[org.address, org.city, org.state, org.zip].filter(Boolean).join(", ") || "Lawton, OK"}
            {maps && (
              <span className="row" style={{ marginTop: "0.4rem" }}>
                <AppLink href={maps.google} title="Google Maps">
                  Open Google Maps
                </AppLink>
                <AppLink href={maps.apple} title="Apple Maps">
                  Open Apple Maps
                </AppLink>
              </span>
            )}
          </p>
        )}
        <p>
          <strong>Phone:</strong> {tel ? <a href={tel}>{org.phone}</a> : org.phone || "Not listed."}
        </p>
        <p>
          <strong>Hours:</strong> {org.hours || "Not listed. Call to confirm."}
        </p>
        <p>
          <strong>Point of contact:</strong> {org.pointOfContact || "Not listed."}
        </p>
        <h2>Availability</h2>
        <AvailabilityLights availability={org.availability} detailed />
        <h2>Services</h2>
        <p>{org.services.join(", ")}</p>
        <h2>Eligibility</h2>
        <p>{org.eligibility}</p>
        <h2>Restrictions</h2>
        <p>{org.restrictions}</p>
        <h2>Categories</h2>
        <p>{org.categories.join(", ")}</p>
        {org.audiences.length > 0 && (
          <p className="muted">Audiences mentioned in the listing: {org.audiences.join(", ")}</p>
        )}
        {org.links.length > 0 && (
          <>
            <h2>Links</h2>
            <ul>
              {org.links.map((l) => (
                <li key={l.url}>
                  <AppLink href={l.url} title={l.label}>
                    {l.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="coming" style={{ margin: "1rem 0" }}>
          <strong>C-suite vanishing messages — Coming</strong> when a secure backend is approved. Placeholder only.
        </div>
        <button
          className="btn"
          disabled={sent}
          onClick={() => {
            const session = getSession();
            addOnTheWay({
              id: `otw-${Date.now()}`,
              orgSlug: org.slug,
              orgName: org.name,
              createdAt: new Date().toISOString(),
              note: "I’m on the way. This does not reserve a bed or a spot.",
              fromRole: session?.role || "public",
            });
            setSent(true);
          }}
        >
          {sent ? "Notice sent — not a reservation" : "I’m on the way"}
        </button>
        <p className="muted">This never reserves a bed or spot. Staff may see a notice if they use the demo inbox.</p>
        <p className="muted">Source: {org.source}</p>
      </article>
    </div>
  );
}
