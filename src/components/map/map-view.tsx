"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Bed, Bath, DollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";

type MapListing = {
  id: string;
  title: string;
  type: string;
  area: string;
  price: number;
  image: string;
  verified: boolean;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
};

type MapViewProps = {
  listings: MapListing[];
  center?: [number, number];
  zoom?: number;
};

// Default center: Arusha, Tanzania
const DEFAULT_CENTER: [number, number] = [-3.3869, 36.6830];
const DEFAULT_ZOOM = 12;

export function MapView({ listings, center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Guard against stale async callbacks after cleanup
    let cancelled = false;

    // Dynamic import of Leaflet (client-only)
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      // Bail if component unmounted or effect was cleaned up during import
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      // Fix default marker icon issue
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Use OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `<div style="
          width: 32px; height: 32px; 
          background: linear-gradient(135deg, #0d9488, #8b5cf6);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        "><span style="
          transform: rotate(45deg); 
          color: white; 
          font-size: 14px; 
          font-weight: bold;
        ">🏠</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      // Add markers for listings with coordinates
      const listingsWithCoords = listings.filter(
        (l) => l.latitude && l.longitude
      );

      if (listingsWithCoords.length === 0) {
        listings.forEach((listing, index) => {
          const angle = (index / listings.length) * 2 * Math.PI;
          const radius = 0.005;
          const lat = center[0] + Math.sin(angle) * radius;
          const lng = center[1] + Math.cos(angle) * radius;

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
          marker.on("click", () => {
            setSelectedListing(listing);
            map.flyTo([lat, lng], 15, { duration: 0.5 });
          });
          marker.bindPopup(createPopupContent(listing), {
            maxWidth: 280,
            className: "custom-popup",
          });
        });
      } else {
        listingsWithCoords.forEach((listing) => {
          const marker = L.marker(
            [listing.latitude!, listing.longitude!],
            { icon: customIcon }
          ).addTo(map);
          marker.on("click", () => {
            setSelectedListing(listing);
            map.flyTo([listing.latitude!, listing.longitude!], 15, {
              duration: 0.5,
            });
          });
          marker.bindPopup(createPopupContent(listing), {
            maxWidth: 280,
            className: "custom-popup",
          });
        });
      }

      // Fit bounds to show all markers
      if (listings.length > 0) {
        const allCoords = listingsWithCoords.length > 0
          ? listingsWithCoords.map((l) => [l.latitude!, l.longitude!] as [number, number])
          : listings.map((_, i) => {
              const angle = (i / listings.length) * 2 * Math.PI;
              return [
                center[0] + Math.sin(angle) * 0.005,
                center[1] + Math.cos(angle) * 0.005,
              ] as [number, number];
            });
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="h-[400px] w-full rounded-xl overflow-hidden border border-[var(--glass-border)] sm:h-[500px]"
        style={{ background: "var(--glass-fill)" }}
      />

      {/* Listing count badge */}
      <div className="absolute left-3 top-3 z-[1000]">
        <span className="glass-surface flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold shadow-lg">
          <MapPin size={14} className="text-[var(--accent)]" />
          {listings.length} {listings.length === 1 ? "listing" : "listings"}
        </span>
      </div>

      {/* Selected listing card */}
      {selectedListing && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] sm:left-auto sm:right-3 sm:bottom-3 sm:w-80">
          <div className="glass-surface flex gap-3 p-3 shadow-xl animate-slide-up">
            {selectedListing.image && selectedListing.image !== "/listing-placeholder.svg" ? (
              <img
                src={selectedListing.image}
                alt={selectedListing.title}
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--glass-fill)]">
                <span className="text-2xl">🏠</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-sm font-bold text-[var(--text-primary)]">
                {selectedListing.title}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {selectedListing.type} · {selectedListing.area}
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--accent)]">
                TZS {selectedListing.price.toLocaleString()}
                <span className="text-xs font-normal text-[var(--text-tertiary)]"> / mo</span>
              </p>
              <Link
                href={`/listings/${selectedListing.id}`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                View details <ExternalLink size={12} />
              </Link>
            </div>
            <button
              onClick={() => setSelectedListing(null)}
              className="absolute right-2 top-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Leaflet marker styles */}
      <style jsx global>{`
        .custom-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          min-width: 240px;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }
        .leaflet-control-zoom a {
          background: var(--glass-surface) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--glass-border) !important;
        }
      `}</style>
    </div>
  );
}

function createPopupContent(listing: MapListing): string {
  const imgHtml = listing.image && listing.image !== "/listing-placeholder.svg"
    ? `<img src="${listing.image}" alt="${listing.title}" style="width:100%;height:120px;object-fit:cover;" />`
    : `<div style="width:100%;height:80px;display:flex;align-items:center;justify-content:center;background:#f0fdf4;font-size:32px;">🏠</div>`;

  return `
    <div style="font-family: system-ui, sans-serif;">
      ${imgHtml}
      <div style="padding: 12px;">
        <div style="font-weight: 700; font-size: 14px; color: #1a1a2e;">${listing.title}</div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${listing.type} · ${listing.area}</div>
        <div style="font-weight: 700; font-size: 16px; color: #0d9488; margin-top: 6px;">
          TZS ${listing.price.toLocaleString()}<span style="font-size: 12px; font-weight: 400; color: #9ca3af;"> / mo</span>
        </div>
        <a href="/listings/${listing.id}" style="
          display: inline-block; margin-top: 8px; padding: 6px 12px; 
          background: #0d9488; color: white; border-radius: 8px; 
          text-decoration: none; font-size: 12px; font-weight: 600;
        ">View Details →</a>
      </div>
    </div>
  `;
}
