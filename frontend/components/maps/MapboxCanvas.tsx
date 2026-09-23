"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { config } from "@/lib/config";
import {
  getCaseMapData,
  type SpatialFeature,
  type SpatialMapResponse,
} from "@/services/api/spatial";

declare global {
  interface Window {
    mapboxgl?: any;
  }
}

interface MapboxCanvasProps {
  caseId: string;
  onSelectFeature?: (feature: SpatialFeature | null) => void;
}

// Canonical entity colors matching lib/graphData.ts
export const ENTITY_PIN_CONFIG: Record<
  string,
  { color: string; label: string; icon: string; bgClass: string; textClass: string }
> = {
  person: {
    color: "#3B82F6", // Blue
    label: "Person / Suspect",
    icon: "person",
    bgClass: "bg-blue-500/10 border-blue-500/30",
    textClass: "text-blue-400",
  },
  location: {
    color: "#F97316", // Orange-Red
    label: "Location / Scene",
    icon: "location_on",
    bgClass: "bg-orange-500/10 border-orange-500/30",
    textClass: "text-orange-400",
  },
  vehicle: {
    color: "#F59E0B", // Amber
    label: "Vehicle / Transit",
    icon: "directions_car",
    bgClass: "bg-amber-500/10 border-amber-500/30",
    textClass: "text-amber-400",
  },
  phone: {
    color: "#22C55E", // Green
    label: "Phone / Intercept",
    icon: "phone_android",
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
    textClass: "text-emerald-400",
  },
  organization: {
    color: "#A855F7", // Purple
    label: "Enterprise / Front",
    icon: "corporate_fare",
    bgClass: "bg-purple-500/10 border-purple-500/30",
    textClass: "text-purple-400",
  },
  account: {
    color: "#14B8A6", // Teal
    label: "Bank Account / Wire",
    icon: "account_balance",
    bgClass: "bg-teal-500/10 border-teal-500/30",
    textClass: "text-teal-400",
  },
  case: {
    color: "#8B5CF6", // Violet
    label: "Case Overlap",
    icon: "folder_shared",
    bgClass: "bg-violet-500/10 border-violet-500/30",
    textClass: "text-violet-400",
  },
  evidence: {
    color: "#CBD5E1", // Silver / Slate
    label: "Physical Evidence / Weapon",
    icon: "description",
    bgClass: "bg-slate-400/10 border-slate-400/30",
    textClass: "text-slate-300",
  },
};

export const FALLBACK_MAPBOX_TOKEN =
  "pk.eyJ1IjoiamF0aW4xMTEyIiwiYSI6ImNtdWEycWF2djB5cjcyeXM5ZHg3MnQ1bjkifQ.mWhTcaDNa-ySEszTwb42zg";

export function getFeatureStyle(feature: SpatialFeature) {
  const type = feature.properties.entity_type?.toLowerCase() || "";
  if (ENTITY_PIN_CONFIG[type]) {
    return ENTITY_PIN_CONFIG[type];
  }
  return ENTITY_PIN_CONFIG.location;
}

export default function MapboxCanvas({ caseId, onSelectFeature }: MapboxCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [spatialData, setSpatialData] = useState<SpatialMapResponse | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<SpatialFeature | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [mapStyle, setMapStyle] = useState<string>("mapbox://styles/mapbox/dark-v11");
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    config.mapboxToken ||
    FALLBACK_MAPBOX_TOKEN;

  // 1. Fetch Spatial GeoJSON Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setSpatialData(null);
    setSelectedFeature(null);
    onSelectFeature?.(null);
    try {
      const data = await getCaseMapData(caseId, {
        entityType: filterType !== "all" ? filterType : undefined,
      });
      setSpatialData(data);
      const nextSelected = data.features[0] || null;
      setSelectedFeature(nextSelected);
      onSelectFeature?.(nextSelected);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load spatial telemetry";
      console.warn("[Mapbox] Data load notice:", msg);
    } finally {
      setLoading(false);
    }
  }, [caseId, filterType, onSelectFeature]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Load Mapbox GL JS library dynamically via CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!token) {
      setLoadError("Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment.");
      setIsMapLoaded(false);
      return;
    }

    if (!document.getElementById("mapbox-gl-css")) {
      const link = document.createElement("link");
      link.id = "mapbox-gl-css";
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    if (window.mapboxgl) {
      initializeMap();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
    script.async = true;
    script.onload = () => {
      initializeMap();
    };
    script.onerror = () => {
      setLoadError("Failed to load Mapbox GL JS library. Check network connection.");
    };
    document.head.appendChild(script);

    function initializeMap() {
      if (!mapContainerRef.current || !window.mapboxgl) return;
      window.mapboxgl.accessToken = token;

      try {
        const map = new window.mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center: [73.5, 18.8], // Tactical center across Western India corridor
          zoom: 6.5,
          pitch: 0, // 0 pitch prevents perspective tilt drift when zooming out
          bearing: 0,
        });

        map.addControl(new window.mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
        map.addControl(new window.mapboxgl.FullscreenControl(), "top-right");

        map.on("load", () => {
          setIsMapLoaded(true);
          map.resize();
        });

        map.on("idle", () => {
          map.resize();
        });

        mapInstanceRef.current = map;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(`Map initialization error: ${msg}`);
      }
    }

    // Ensure map updates canvas dimensions whenever container resizes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapStyle, token]);

  // 3. Update Map Style when toggled
  const handleStyleChange = (newStyle: string) => {
    setMapStyle(newStyle);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setStyle(newStyle);
    }
  };

  // 4. Render Markers on the Mapbox Map with Exact Centered Pinning
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded || !window.mapboxgl) return;
    const map = mapInstanceRef.current;

    // Trigger canvas recalibration to avoid projection scale errors
    map.resize();

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const features = spatialData?.features || [];
    if (features.length === 0) return;

    const bounds = new window.mapboxgl.LngLatBounds();

    features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties;
      const cfg = getFeatureStyle(feature);

      // Dedicated Mapbox Tactical Marker Container
      // NOTE: Do NOT set position: relative here; Mapbox requires absolute positioning
      const el = document.createElement("div");
      el.className = "mapboxgl-marker tracia-marker-wrapper cursor-pointer group";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";

      // Inner tactical graphic with pulsing halo and exact center reticle
      el.innerHTML = `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
          <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: ${cfg.color}; opacity: 0.35; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: #0b1329; border: 2px solid ${cfg.color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${cfg.color}aa; z-index: 2; transition: transform 0.15s ease;">
            <span class="material-symbols-outlined" style="font-size: 14px; color: ${cfg.color}; font-variation-settings: 'FILL' 1;">${cfg.icon}</span>
          </div>
          <!-- Precision target center dot (anchored exactly on coordinate) -->
          <div style="position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #ffffff; z-index: 3; box-shadow: 0 0 4px #ffffff;"></div>
        </div>
      `;

      // Popup content
      const popupHtml = `
        <div style="color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; min-width: 250px; max-width: 290px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); padding-bottom: 4px;">
            <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; font-weight: bold; color: ${cfg.color};">● ${cfg.label}</span>
            <span style="font-size: 9px; color: #94a3b8; font-family: monospace;">${props.case_id}</span>
          </div>
          <div style="font-size: 13px; font-weight: bold; margin-bottom: 2px; color: #ffffff;">${props.entity_name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">📍 ${props.location}</div>
          ${props.evidence_text ? `<div style="font-size: 11px; color: #cbd5e1; background: rgba(30, 41, 59, 0.8); padding: 6px; border-radius: 6px; margin-bottom: 6px; line-height: 1.4; border-left: 3px solid ${cfg.color};">${props.evidence_text}</div>` : ""}
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace;">
            <span>Source: ${props.source_document || "Neo4j Aura"}</span>
            <span>${props.date_time ? props.date_time.substring(0, 16) : ""}</span>
          </div>
        </div>
      `;

      const popup = new window.mapboxgl.Popup({
        offset: 18,
        closeButton: false,
        className: "tracia-mapbox-popup",
      }).setHTML(popupHtml);

      // Create marker with exact center anchoring
      const marker = new window.mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        setSelectedFeature(feature);
        onSelectFeature?.(feature);
      });

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    });

    // Fit map bounds smoothly
    if (features.length > 1) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 1200 });
    } else if (features.length === 1) {
      map.flyTo({
        center: features[0].geometry.coordinates,
        zoom: 11,
        duration: 1000,
      });
    }
  }, [spatialData, isMapLoaded, onSelectFeature]);

  // Fly to specific coordinates
  const flyToCity = (coords: [number, number], zoom = 11) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo({
      center: coords,
      zoom,
      essential: true,
      duration: 1400,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[640px]">
      {/* 1. Map Canvas Section */}
      <div className="flex-1 flex flex-col rounded-xl border border-outline-variant bg-surface-container overflow-hidden relative shadow-md">
        {/* Map Header Toolbar */}
        <div className="p-3 border-b border-outline-variant bg-surface-container-high/80 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">map</span>
            <span className="font-bold text-xs text-on-surface">Spatial AI Intelligence Map</span>
            <span className="rounded bg-primary/10 border border-primary/25 px-2 py-0.5 text-[10px] font-mono text-primary font-bold">
              Case {caseId}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Map Style Selector */}
            <div className="flex rounded-lg border border-outline-variant bg-surface-container-low p-0.5 text-[11px]">
              <button
                onClick={() => handleStyleChange("mapbox://styles/mapbox/dark-v11")}
                className={`px-2 py-1 rounded font-medium transition ${
                  mapStyle.includes("dark") ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Tactical Dark
              </button>
              <button
                onClick={() => handleStyleChange("mapbox://styles/mapbox/satellite-streets-v12")}
                className={`px-2 py-1 rounded font-medium transition ${
                  mapStyle.includes("satellite") ? "bg-primary text-on-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Satellite Recon
              </button>
            </div>

            {/* Quick Tactical City Sector Jumps */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => flyToCity([72.8722, 18.6414], 12)}
                className="px-2 py-1 rounded border border-rose-500/40 bg-rose-500/10 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition"
              >
                Alibaug (Crime Scene)
              </button>
              <button
                onClick={() => flyToCity([72.8295, 19.0596], 12)}
                className="px-2 py-1 rounded border border-blue-500/40 bg-blue-500/10 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20 transition"
              >
                Mumbai (Bandra HQ)
              </button>
              <button
                onClick={() => flyToCity([73.8939, 18.5362], 12)}
                className="px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition"
              >
                Pune (Safehouse)
              </button>
              <button
                onClick={() => flyToCity([77.2167, 28.6315], 11)}
                className="px-2 py-1 rounded border border-purple-500/40 bg-purple-500/10 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/20 transition"
              >
                Delhi (Raj Hideout)
              </button>
              <button
                onClick={() => flyToCity([73.74, 15.58], 11)}
                className="px-2 py-1 rounded border border-violet-500/40 bg-violet-500/10 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/20 transition"
              >
                Goa (NDPS Hub)
              </button>
            </div>
          </div>
        </div>

        {/* The Mapbox Container */}
        <div ref={mapContainerRef} className="flex-1 w-full h-full relative">
          {loading && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-xs shadow-xl">
                <span className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <span>Synchronizing Spatial Telemetry from Neo4j Aura...</span>
              </div>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-x-4 top-4 z-20 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 backdrop-blur-sm">
              {loadError}
            </div>
          )}
        </div>

        {/* Bottom Legend with Exact Desired Entity Colors */}
        <div className="p-2.5 border-t border-outline-variant bg-surface-container-high/90 backdrop-blur-sm flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10px] text-outline uppercase font-bold">Entity Colors:</span>
            {Object.entries(ENTITY_PIN_CONFIG).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: val.color }} />
                <span className="text-on-surface-variant text-[10px]">{val.label}</span>
              </div>
            ))}
          </div>

          <span className="font-mono text-[10px] text-emerald-400 font-bold">
            {spatialData?.features.length || 0} Entities Geocoded from Neo4j
          </span>
        </div>
      </div>

      {/* 2. Side Panel: Telemetry List & Feature Inspector */}
      <div className="w-full lg:w-80 flex flex-col rounded-xl border border-outline-variant bg-surface-container overflow-hidden shadow-md">
        <div className="p-3.5 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
          <div className="font-bold text-xs text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">radar</span>
            <span>Entities &amp; Pinpoints ({spatialData?.features.length || 0})</span>
          </div>
        </div>

        <div className="p-3 border-b border-outline-variant bg-surface-container-low">
          <label className="text-[10px] font-mono text-outline uppercase font-bold block mb-1">
            Filter by Entity Type:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">All Intelligence Nodes</option>
            <option value="person">Persons &amp; Suspects</option>
            <option value="location">Locations &amp; Crime Scenes</option>
            <option value="vehicle">Vehicles</option>
            <option value="phone">Phones &amp; Intercepts</option>
            <option value="account">Bank Accounts &amp; Shells</option>
            <option value="organization">Corporate Entities</option>
            <option value="evidence">Physical &amp; Ballistics Evidence</option>
            <option value="case">Cross-Case Overlaps</option>
          </select>
        </div>

        {/* Feature List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[320px]">
          {spatialData?.features.map((f, idx) => {
            const pinCfg = getFeatureStyle(f);
            const isSelected = selectedFeature?.properties.entity_id === f.properties.entity_id;

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedFeature(f);
                  onSelectFeature?.(f);
                  flyToCity(f.geometry.coordinates, 12);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition space-y-1.5 ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-outline-variant/60 bg-surface-container-low hover:border-primary/40 hover:bg-surface-variant/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${pinCfg.bgClass} ${pinCfg.textClass}`}>
                    {pinCfg.label}
                  </span>
                  <span className="font-mono text-[9px] text-outline uppercase">
                    {f.properties.entity_type}
                  </span>
                </div>

                <div className="font-bold text-xs text-on-surface">{f.properties.entity_name}</div>
                <div className="text-[11px] text-outline line-clamp-1">{f.properties.location}</div>
              </div>
            );
          })}
        </div>

        {/* Selected Feature Deep Detail Inspector */}
        {selectedFeature && (
          <div className="p-3.5 border-t border-outline-variant bg-surface-container-high/60 space-y-2 text-xs">
            <div className="font-mono text-[10px] text-primary uppercase font-bold flex items-center justify-between">
              <span>Target Inspection</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-outline">
                {selectedFeature.properties.entity_type}
              </span>
            </div>
            <div className="font-bold text-sm text-on-surface">{selectedFeature.properties.entity_name}</div>
            <div className="text-xs text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {selectedFeature.properties.location}
            </div>
            <div className="text-[11px] text-on-surface-variant leading-relaxed bg-surface-container/60 p-2 rounded border border-outline-variant/40">
              {selectedFeature.properties.evidence_text || "Geocoded spatial location registered to investigation case."}
            </div>

            {selectedFeature.properties.investigative_lead && (
              <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[10px] space-y-1">
                <div className="font-bold text-rose-400 uppercase font-mono flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  Lead: {selectedFeature.properties.investigative_lead.priority || "Actionable"}
                </div>
                <div className="text-on-surface leading-tight">
                  {selectedFeature.properties.investigative_lead.recommendation}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
