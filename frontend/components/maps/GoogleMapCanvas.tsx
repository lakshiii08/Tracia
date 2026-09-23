"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  getCaseMapData,
  type SpatialFeature,
  type SpatialMapResponse,
} from "@/services/api/spatial";

declare global {
  interface Window {
    google?: any;
    initGoogleMapsCallback?: () => void;
  }
}

interface GoogleMapCanvasProps {
  caseId: string;
  onSelectFeature?: (feature: SpatialFeature | null) => void;
}

const PIN_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  crime_scene: { bg: "#ef4444", border: "#f87171", text: "text-rose-400", label: "Crime Scene" },
  suspect_sighting: { bg: "#f59e0b", border: "#fbbf24", text: "text-amber-400", label: "Suspect Sighting" },
  cell_tower: { bg: "#06b6d4", border: "#22d3ee", text: "text-cyan-400", label: "Cell Tower Mast" },
  cyber_telemetry: { bg: "#a855f7", border: "#c084fc", text: "text-purple-400", label: "Cyber IP Origin" },
  financial_wire: { bg: "#10b981", border: "#34d399", text: "text-emerald-400", label: "Financial Endpoint" },
  safehouse: { bg: "#ec4899", border: "#f472b6", text: "text-pink-400", label: "Suspect Safehouse" },
  default: { bg: "#3b82f6", border: "#60a5fa", text: "text-blue-400", label: "Geo Point" },
};

export default function GoogleMapCanvas({ caseId, onSelectFeature }: GoogleMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [spatialData, setSpatialData] = useState<SpatialMapResponse | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<SpatialFeature | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Google Maps API Key State
  const [apiKey, setApiKey] = useState<string>("");
  const [mapKeyInput, setMapKeyInput] = useState<string>("");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState<boolean>(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  // Initialize API Key from localStorage or env
  useEffect(() => {
    const storedKey =
      localStorage.getItem("tracia_google_maps_api_key") ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "";
    setApiKey(storedKey);
    setMapKeyInput(storedKey);
  }, []);

  // Fetch Spatial GeoJSON Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setSpatialData(null);
    setSelectedFeature(null);
    onSelectFeature?.(null);
    try {
      const data = await getCaseMapData(caseId, {
        entityType: filterType !== "all" ? filterType : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setSpatialData(data);
      const nextSelected = data.features[0] || null;
      setSelectedFeature(nextSelected);
      onSelectFeature?.(nextSelected);
    } catch {
      // Fallback handled in service
    } finally {
      setLoading(false);
    }
  }, [caseId, filterType, dateFrom, dateTo, onSelectFeature]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save Key Handler
  const handleSaveApiKey = () => {
    const trimmed = mapKeyInput.trim();
    setApiKey(trimmed);
    localStorage.setItem("tracia_google_maps_api_key", trimmed);
    setIsKeyModalOpen(false);
    // Reload map script
    if (trimmed) {
      loadGoogleMapsScript(trimmed);
    }
  };

  // Load Google Maps JavaScript API
  const loadGoogleMapsScript = useCallback((key: string) => {
    if (!key) return;
    if (window.google?.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.remove();
    }

    setMapLoadError(null);
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleMapsLoaded(true);
    };
    script.onerror = () => {
      setMapLoadError("Failed to authenticate Google Maps API key. Check API console permissions.");
      setIsGoogleMapsLoaded(false);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (apiKey) {
      loadGoogleMapsScript(apiKey);
    }
  }, [apiKey, loadGoogleMapsScript]);

  // Mount Google Maps instance when API is ready and container exists
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapContainerRef.current || !window.google?.maps) return;

    try {
      const darkMapStyles = [
        { elementType: "geometry", stylers: [{ color: "#090d16" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#040711" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
      ];

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: 28.6139, lng: 77.209 }, // Default Delhi NCR
        zoom: 11,
        styles: darkMapStyles,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      mapInstanceRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error initializing Google Map";
      setMapLoadError(msg);
    }
  }, [isGoogleMapsLoaded]);

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps || !spatialData) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    spatialData.features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const position = { lat, lng };
      bounds.extend(position);

      const pinType = feature.properties.pin_type || "default";
      const color = PIN_COLORS[pinType] || PIN_COLORS.default;

      // Custom SVG Pin Icon
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: feature.properties.entity_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: selectedFeature?.properties.entity_id === feature.properties.entity_id ? 12 : 9,
          fillColor: color.bg,
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        setSelectedFeature(feature);
        onSelectFeature?.(feature);

        if (infoWindowRef.current) {
          const content = `
            <div style="background:#0f172a; color:#f8fafc; padding:12px; border-radius:8px; font-family:sans-serif; min-width:220px; font-size:12px;">
              <div style="font-weight:bold; color:${color.bg}; font-size:13px; margin-bottom:4px;">
                ${feature.properties.entity_name}
              </div>
              <div style="color:#94a3b8; font-size:11px; margin-bottom:6px;">
                ${feature.properties.relationship_context} · ${feature.properties.date_time || "Date N/A"}
              </div>
              <div style="color:#cbd5e1; line-height:1.4; margin-bottom:8px;">
                ${feature.properties.evidence_text || feature.properties.location}
              </div>
              ${
                feature.properties.evidence_id
                  ? `<div style="font-family:monospace; color:#38bdf8; font-size:10px;">Source: ${feature.properties.evidence_id}</div>`
                  : ""
              }
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      markersRef.current.push(marker);
    });

    if (spatialData.features.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      if (spatialData.features.length === 1) {
        mapInstanceRef.current.setZoom(13);
      }
    }
  }, [spatialData, selectedFeature, onSelectFeature]);

  // Center map on selected feature
  const handleFocusFeature = (feature: SpatialFeature) => {
    setSelectedFeature(feature);
    onSelectFeature?.(feature);
    if (mapInstanceRef.current && window.google?.maps) {
      const [lng, lat] = feature.geometry.coordinates;
      mapInstanceRef.current.panTo({ lat, lng });
      mapInstanceRef.current.setZoom(14);
    }
  };

  return (
    <div className="relative flex flex-col h-[750px] w-full rounded-xl border border-outline-variant bg-surface-container overflow-hidden">
      {/* 1. Map Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-outline-variant bg-surface-container-high/60 z-10 text-xs">
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-primary">map</span>
            <span className="font-bold text-on-surface">Spatial Intelligence</span>
          </div>

          <div className="h-4 w-[1px] bg-outline-variant mx-1" />

          {/* Entity Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary"
          >
            <option value="all">All Entity Types</option>
            <option value="location">Crime Locations</option>
            <option value="person">Suspect Sightings</option>
            <option value="phone">Cell Towers</option>
            <option value="account">Financial Endpoints</option>
          </select>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 text-outline text-[11px]">
            <span>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1 text-xs text-on-surface outline-none focus:border-primary"
            />
            <span>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Right: API Key Config & Pinned Stats */}
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-mono font-bold text-primary">
            {spatialData?.features.length || 0} Pinned AI Locations
          </span>

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface hover:border-primary/50 transition"
          >
            <span className="material-symbols-outlined text-[15px] text-amber-400">key</span>
            <span>{apiKey ? "Google Maps Connected" : "Set Google Map API Key"}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace: Map Canvas + Intelligence Sidebar */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left/Center: Interactive Map Area */}
        <div className="flex-1 relative bg-[#090d16] overflow-hidden">
          {/* Real Google Maps Container */}
          <div
            ref={mapContainerRef}
            className={`w-full h-full ${apiKey && isGoogleMapsLoaded ? "block" : "hidden"}`}
          />

          {/* Fallback Tactical Grid Map Display (Active when no Google Maps Key is supplied yet) */}
          {(!apiKey || !isGoogleMapsLoaded) && (
            <div className="w-full h-full relative flex flex-col items-center justify-center p-6 select-none">
              {/* Tactical Cyber Grid Background */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              {/* Tactical Radar Sweep Rings */}
              <div className="absolute w-[440px] h-[440px] rounded-full border border-primary/20 pointer-events-none animate-pulse" />
              <div className="absolute w-[260px] h-[260px] rounded-full border border-cyan-500/15 pointer-events-none" />

              {/* Pinpoint Pins Overlay onto Tactical Canvas */}
              <div className="absolute inset-8 pointer-events-auto">
                {spatialData?.features.map((feature, idx) => {
                  const [lng, lat] = feature.geometry.coordinates;
                  const isSelected = selectedFeature?.properties.entity_id === feature.properties.entity_id;
                  const color = PIN_COLORS[feature.properties.pin_type || "default"] || PIN_COLORS.default;

                  // Normalize coordinates to percentage positions for tactical visual canvas
                  const xPct = Math.min(85, Math.max(15, 20 + ((lng - 72.8) / (77.6 - 72.8)) * 60));
                  const yPct = Math.min(85, Math.max(15, 80 - ((lat - 12.9) / (28.7 - 12.9)) * 60));

                  return (
                    <button
                      key={feature.properties.entity_id || idx}
                      onClick={() => handleFocusFeature(feature)}
                      style={{ left: `${xPct}%`, top: `${yPct}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-200 z-10 ${
                        isSelected ? "scale-125 z-20" : "hover:scale-110"
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <span
                          className="absolute w-7 h-7 rounded-full opacity-30 animate-ping"
                          style={{ backgroundColor: color.bg }}
                        />
                        <div
                          className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: color.bg }}
                        >
                          <span className="material-symbols-outlined text-white text-[11px]">location_on</span>
                        </div>
                      </div>
                      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-0.5 rounded bg-surface-container-high/90 border border-outline-variant text-[10px] font-bold text-on-surface whitespace-nowrap shadow-md pointer-events-none">
                        {feature.properties.entity_name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Overlay Prompt: Google Maps Key */}
              <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto p-3.5 rounded-xl border border-primary/30 bg-surface-container/95 backdrop-blur-md text-xs shadow-2xl flex items-center justify-between gap-3 z-30">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">Tactical AI Radar Active</div>
                    <div className="text-[11px] text-on-surface-variant">
                      {spatialData?.features.length || 0} locations pinpointed from case telemetry. Enter Google Maps API key to activate high-res satellite tiles.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsKeyModalOpen(true)}
                  className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded-lg text-xs shrink-0 hover:bg-primary/90 transition shadow-sm"
                >
                  Configure Key
                </button>
              </div>
            </div>
          )}

          {/* Map Error Banner */}
          {mapLoadError && (
            <div className="absolute top-3 left-3 right-3 p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center justify-between z-20">
              <span>{mapLoadError}</span>
              <button onClick={() => setMapLoadError(null)} className="text-xs underline ml-2">Dismiss</button>
            </div>
          )}
        </div>

        {/* Right: Pinned Entity Inspector & Unmapped Locations */}
        <div className="w-84 bg-surface-container-low border-l border-outline-variant flex flex-col shrink-0 overflow-y-auto p-3.5 space-y-4">
          {/* Selected Location Card */}
          {selectedFeature ? (
            <div className="rounded-xl border border-primary/30 bg-surface-container p-4 space-y-3 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        PIN_COLORS[selectedFeature.properties.pin_type || "default"]?.bg || "#38bdf8",
                    }}
                  />
                  <span className="font-bold text-sm text-on-surface leading-tight">
                    {selectedFeature.properties.entity_name}
                  </span>
                </div>
                <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono text-primary uppercase">
                  {selectedFeature.properties.relationship_context}
                </span>
              </div>

              <div className="text-xs text-on-surface-variant space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-mono text-outline">
                  <span className="material-symbols-outlined text-[13px]">pin_drop</span>
                  <span>
                    {selectedFeature.geometry.coordinates[1].toFixed(5)}, {selectedFeature.geometry.coordinates[0].toFixed(5)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/40 text-[11px]">
                  {selectedFeature.properties.evidence_text || selectedFeature.properties.location}
                </div>
              </div>

              {/* Source Document & Confidence */}
              <div className="flex items-center justify-between text-[11px] font-mono border-t border-outline-variant/40 pt-2 text-outline">
                <span>Doc: {selectedFeature.properties.source_document || "Case Record"}</span>
                {selectedFeature.properties.extraction_confidence && (
                  <span className="text-emerald-400 font-bold">
                    {Math.round(Number(selectedFeature.properties.extraction_confidence) * 100)}% Conf
                  </span>
                )}
              </div>

              {/* Investigative Lead */}
              {selectedFeature.properties.investigative_lead?.recommendation && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-300 space-y-1">
                  <div className="font-bold uppercase text-[10px] tracking-wider text-amber-400">
                    AI Investigative Lead:
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {selectedFeature.properties.investigative_lead.recommendation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container text-center text-xs text-outline space-y-2">
              <span className="material-symbols-outlined text-2xl text-outline/60">location_searching</span>
              <p>Select any pinpoint marker on the map to inspect case telemetry, evidence excerpts, and leads.</p>
            </div>
          )}

          {/* List of All Pinned AI Locations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">AI Pinpoints</span>
              <span className="text-[10px] text-outline font-mono">{spatialData?.features.length || 0} Total</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {spatialData?.features.map((f) => {
                const isSelected = selectedFeature?.properties.entity_id === f.properties.entity_id;
                const color = PIN_COLORS[f.properties.pin_type || "default"] || PIN_COLORS.default;

                return (
                  <button
                    key={f.properties.entity_id}
                    onClick={() => handleFocusFeature(f)}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/15 border-primary/50 text-on-surface"
                        : "bg-surface-container hover:bg-surface-container-high border-outline-variant/60 text-on-surface-variant"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color.bg }} />
                        <span className="truncate">{f.properties.entity_name}</span>
                      </div>
                      <div className="text-[10px] text-outline truncate mt-0.5">{f.properties.location}</div>
                    </div>
                    <span className="text-[10px] font-mono text-outline shrink-0">{f.properties.relationship_context}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unmapped Textual Locations from AI */}
          {spatialData?.unmapped_locations && spatialData.unmapped_locations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-outline-variant">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">warning</span>
                  Unmapped Locations ({spatialData.unmapped_locations.length})
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {spatialData.unmapped_locations.map((u, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1">
                    <div className="font-bold text-on-surface text-[11px]">{u.entity_name}</div>
                    <div className="text-[10px] text-outline">{u.location}</div>
                    <div className="text-[10px] text-on-surface-variant italic">&ldquo;{u.evidence_text}&rdquo;</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Google Maps API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-outline-variant bg-surface-container-high p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">map</span>
                <h3 className="font-bold text-base text-on-surface">Configure Google Maps API</h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-outline hover:text-on-surface text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Enter a valid Google Maps JavaScript API key to load tactical dark vector map tiles, street terrain, and satellite views for all pinpointed AI crime scenes and cell towers.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-outline uppercase font-semibold">Google Maps API Key</label>
              <input
                type="password"
                value={mapKeyInput}
                onChange={(e) => setMapKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-xs font-mono text-on-surface outline-none focus:border-primary transition"
              />
              <span className="text-[10px] text-outline">Stored locally in your browser session for security.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold hover:bg-surface-variant transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition shadow-md"
              >
                Save &amp; Connect Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
