"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
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
  selectedId?: string | null;
  onSelectListing?: (listing: MapListing | null) => void;
};

// Default center: Arusha, Tanzania
const DEFAULT_CENTER: [number, number] = [-3.3869, 36.6830];
const DEFAULT_ZOOM = 12;

export function MapView({
  listings,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  selectedId,
  onSelectListing,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<Map<string, unknown>>(new Map());
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add markers for all listings
      const listingsWithCoords = listings.filter((l) => l.latitude && l.longitude);

      const addMarker = (listing: MapListing, lat: number, lng: number) => {
        const priceLabel = listing.price >= 1000
          ? `${Math.round(listing.price / 1000)}k`
          : listing.price.toLocaleString();

        const customIcon = L.divIcon({
          className: "custom-map-marker",
          html: `<div class="marker-badge">
            <span class="marker-price">TZS ${priceLabel}</span>
            <span class="marker-type">${listing.type}</span>
          </div>`,
          iconSize: [120, 44],
          iconAnchor: [60, 44],
          popupAnchor: [0, -44],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        markersRef.current.set(listing.id, marker);

        marker.on("click", () => {
          setSelectedListing(listing);
          onSelectListing?.(listing);
          map.flyTo([lat, lng], 15, { duration: 0.5 });
        });

        marker.bindPopup(createPopupContent(listing), {
          maxWidth: 280,
          className: "custom-popup",
        });
      };

      if (listingsWithCoords.length === 0) {
        listings.forEach((listing, index) => {
          const angle = (index / Math.max(listings.length, 1)) * 2 * Math.PI;
          const radius = 0.005;
          const lat = center[0] + Math.sin(angle) * radius;
          const lng = center[1] + Math.cos(angle) * radius;
          addMarker(listing, lat, lng);
        });
      } else {
        listingsWithCoords.forEach((listing) => {
          addMarker(listing, listing.latitude!, listing.longitude!);
        });
      }

      // Fit bounds
      if (listings.length > 0) {
        const allCoords = listingsWithCoords.length > 0
          ? listingsWithCoords.map((l) => [l.latitude!, l.longitude!] as [number, number])
          : listings.map((_, i) => {
              const angle = (i / Math.max(listings.length, 1)) * 2 * Math.PI;
              return [
                center[0] + Math.sin(angle) * 0.005,
                center[1] + Math.cos(angle) * 0.005,
              ] as [number, number];
            });
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapInstanceRef.current = map;
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

  // Sync selected marker highlight from parent
  useEffect(() => {
    if (!selectedId) {
      setSelectedListing(null);
      return;
    }
    const found = listings.find((l) => l.id === selectedId);
    if (found) setSelectedListing(found);
  }, [selectedId, listings]);

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="h-full w-full"
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
                <span className="text-2xl font-bold text-[var(--accent)]">H</span>
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
              onClick={() => {
                setSelectedListing(null);
                onSelectListing?.(null);
              }}
              className="absolute right-2 top-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Leaflet + marker badge styles */}
      <style jsx global>{`
        .custom-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .marker-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, var(--accent, #0d9488), var(--accent-hover, #0f766e));
          border-radius: 8px;
          padding: 4px 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          border: 2px solid white;
          cursor: pointer;
          white-space: nowrap;
        }
        .marker-price {
          color: white;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
        }
        .marker-type {
          color: rgba(255,255,255,0.85);
          font-size: 10px;
          font-weight: 500;
          line-height: 1.2;
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
    : `<div style="width:100%;height:80px;display:flex;align-items:center;justify-content:center;background:var(--glass-fill);font-size:16px;font-weight:bold;color:var(--accent);">H</div>`;

  return `
    <div style="font-family: system-ui, sans-serif;">
      ${imgHtml}
      <div style="padding: 12px;">
        <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${listing.title}</div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${listing.type} · ${listing.area}</div>
        <div style="font-weight: 700; font-size: 16px; color: var(--accent); margin-top: 6px;">
          TZS ${listing.price.toLocaleString()}<span style="font-size: 12px; font-weight: 400; color: var(--text-tertiary);"> / mo</span>
        </div>
        <a href="/listings/${listing.id}" style="
          display: inline-block; margin-top: 8px; padding: 6px 12px; 
          background: var(--accent); color: white; border-radius: 8px; 
          text-decoration: none; font-size: 12px; font-weight: 600;
        ">View Details →</a>
      </div>
    </div>
  `;
}
