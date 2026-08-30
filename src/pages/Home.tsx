import { useMemo, useState } from "react";
import { FILTERS } from "../types";
import { getOrganizations } from "../lib/store";
import { OrgCard } from "../components/OrgCard";
import { MapView } from "../components/MapView";

export function Home() {
  const [q, setQ] = useState("");
  const [chip, setChip] = useState<string | null>(null);
  const orgs = getOrganizations();

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    const norm = (s: string) => s.toLowerCase().replace(/[’'–—-]/g, " ").replace(/\s+/g, " ");
    const qn = norm(t);
    return orgs.filter((o) => {
      if (chip && !o.categories.includes(chip)) return false;
      if (!t) return true;
      const blob = norm(
        [
          o.name,
          o.shortDescription,
          o.description,
          o.phone,
          o.categories.join(" "),
          o.keywords.join(" "),
          o.services.join(" "),
          o.situations.join(" "),
        ].join(" ")
      );
      return blob.includes(t) || blob.includes(qn);
    });
  }, [orgs, q, chip]);

  return (
    <div className="page">
      <section className="hero">
        <h1>Know before you go</h1>
        <p>
          United Way of Southwest Oklahoma community resources for Lawton and surrounding counties — food, beds,
          clothing, tribal programs, and homeless veteran services. Green lights mean the listing is currently offering
          services. Staff can update. This directory is free. No PHI is stored.
        </p>
        <input
          className="search"
          placeholder="Search name, phone, food, shelter, tribal, veteran…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search resources"
        />
      </section>
      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${chip === f ? "on" : ""}`} onClick={() => setChip(chip === f ? null : f)}>
            {f}
          </button>
        ))}
      </div>
      <MapView orgs={visible} />
      <p className="muted" style={{ marginTop: "0.75rem" }}>
        {visible.length} organizations shown. Confidential domestic-violence locations are phone-only and have no map
        pin.
      </p>
      <div className="grid" style={{ marginTop: "0.75rem" }}>
        {visible.map((o) => (
          <OrgCard key={o.slug} org={o} />
        ))}
      </div>
    </div>
  );
}
