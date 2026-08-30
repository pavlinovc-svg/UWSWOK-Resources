import type { Availability } from "../types";

const KEYS: (keyof Availability)[] = ["space", "staff", "transport", "appointments"];

export function AvailabilityLights({
  availability,
  detailed,
}: {
  availability: Availability;
  detailed?: boolean;
}) {
  if (!detailed) {
    return (
      <div className="lights" title="Space / staff / transport / appointments">
        {KEYS.map((k) => (
          <span key={k} className={`dot ${availability[k].status}`} title={`${k}: ${availability[k].label}`} />
        ))}
      </div>
    );
  }
  return (
    <div>
      {KEYS.map((k) => (
        <div key={k} className="row" style={{ margin: "0.35rem 0" }}>
          <span className={`dot ${availability[k].status}`} />
          <strong style={{ textTransform: "capitalize" }}>{k}</strong>
          <span>{availability[k].label}</span>
          <span className="muted">{availability[k].note}</span>
        </div>
      ))}
    </div>
  );
}
