import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { Organization } from "../types";

const icon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#C46A4A;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function MapView({ orgs }: { orgs: Organization[] }) {
  const pins = orgs.filter((o) => !o.hideAddress && o.lat != null && o.lng != null);
  const center: [number, number] = [34.6086, -98.3903];
  return (
    <div className="map-wrap">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((o) => (
          <Marker key={o.slug} position={[o.lat as number, o.lng as number]} icon={icon}>
            <Popup>
              <Link to={`/org/${o.slug}`}>{o.name}</Link>
              <div>{o.address}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
