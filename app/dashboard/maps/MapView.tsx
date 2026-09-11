"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapInspection {
  id: string;
  product: string;
  lat: number;
  lng: number;
  status: "compliant" | "non-compliant";
  violations: number;
  maxSeverity: string;
  time: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  major: "#EA580C",
  minor: "#CA8A04",
  needs_review: "#9333EA",
  compliant: "#43a047",
};

const makeIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="
      background:${color};
      width:16px;
      height:16px;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const greenIcon = makeIcon(SEVERITY_COLORS.compliant);
const criticalIcon = makeIcon(SEVERITY_COLORS.critical);
const majorIcon = makeIcon(SEVERITY_COLORS.major);
const minorIcon = makeIcon(SEVERITY_COLORS.minor);
const needsReviewIcon = makeIcon(SEVERITY_COLORS.needs_review);

function getIconForInspection(insp: MapInspection) {
  if (insp.status === "compliant") return greenIcon;
  switch (insp.maxSeverity) {
    case "critical": return criticalIcon;
    case "needs_review": return needsReviewIcon;
    case "minor": return minorIcon;
    default: return majorIcon;
  }
}

interface MapViewProps {
  inspections: MapInspection[];
  onSelect: (inspection: MapInspection) => void;
}

export default function MapView({ inspections, onSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const markers: L.Marker[] = [];
    inspections.forEach((insp) => {
      const icon = getIconForInspection(insp);
      const marker = L.marker([insp.lat, insp.lng], { icon })
        .addTo(map)
        .on("click", () => onSelect(insp));
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [inspections, onSelect]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
}
