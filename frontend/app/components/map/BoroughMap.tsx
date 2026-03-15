'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, GeolocateControl, type MapRef } from 'react-map-gl/mapbox';
import { MAPBOX_CONFIG } from '../../lib/mapbox';
import { CATEGORY_COLORS } from '../../lib/constants';
import { useBoroughStore } from '../../stores/borough.store';
import ConnectionLine from './ConnectionLine';

export default function BoroughMap() {
  const mapRef = useRef<MapRef>(null);
  const geolocateRef = useRef<any>(null);
  const supplyBubbles = useBoroughStore((s) => s.supplyBubbles);
  const activeNegotiation = useBoroughStore((s) => s.activeNegotiation);
  const isNegotiationOpen = useBoroughStore((s) => s.isNegotiationTheaterOpen);
  const setSelectedBubble = useBoroughStore((s) => s.setSelectedBubble);

  const [styleLoaded, setStyleLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const pendingFlyTo = useRef<{ lng: number; lat: number } | null>(null);
  const mapLoaded = useRef(false);
  const hasFlewTo = useRef(false);

  const flyToUser = useCallback((loc: { lng: number; lat: number }) => {
    if (hasFlewTo.current) return;
    const map = mapRef.current;
    if (map) {
      hasFlewTo.current = true;
      map.flyTo({ center: [loc.lng, loc.lat], zoom: 17, duration: 2500 });
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        setUserLocation(loc);
        if (mapLoaded.current) {
          flyToUser(loc);
        } else {
          pendingFlyTo.current = loc;
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [flyToUser]);

  const supplyGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: supplyBubbles.map((b) => ({
        type: 'Feature' as const,
        id: b.id,
        properties: {
          id: b.id,
          title: b.title,
          category: b.category,
          price: b.price,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [b.lng, b.lat],
        },
      })),
    }),
    [supplyBubbles]
  );

  const handleSupplyClick = useCallback(
    (e: any) => {
      if (e.features?.[0]) {
        const id = e.features[0].properties.id;
        const bubble = supplyBubbles.find((b) => b.id === id);
        if (bubble) setSelectedBubble(bubble);
      }
    },
    [supplyBubbles, setSelectedBubble]
  );

  const handleStyleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.setConfigProperty('basemap', 'theme', 'faded');
      map.setConfigProperty('basemap', 'lightPreset', 'dusk');
      setStyleLoaded(true);
      mapLoaded.current = true;
      if (pendingFlyTo.current) {
        flyToUser(pendingFlyTo.current);
        pendingFlyTo.current = null;
      }
    }
  }, [flyToUser]);

  const showConnection =
    activeNegotiation?.buyerLocation && activeNegotiation?.sellerLocation;

  return (
    <div
      className="w-full h-full transition-opacity duration-500"
      style={{ opacity: isNegotiationOpen ? 0.4 : 1 }}
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_CONFIG.accessToken}
        initialViewState={{
          longitude: MAPBOX_CONFIG.center[0],
          latitude: MAPBOX_CONFIG.center[1],
          zoom: MAPBOX_CONFIG.zoom,
        }}
        minZoom={MAPBOX_CONFIG.minZoom}
        maxZoom={MAPBOX_CONFIG.maxZoom}
        maxBounds={MAPBOX_CONFIG.maxBounds}
        mapStyle={MAPBOX_CONFIG.style}
        pitch={45}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={['supply-circles']}
        onClick={handleSupplyClick}
        onLoad={handleStyleLoad}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          ref={geolocateRef}
          position="top-right"
          trackUserLocation
          showUserHeading
        />

        {styleLoaded && (
          <>
            {/* Supply bubbles */}
            <Source id="supply-data" type="geojson" data={supplyGeoJSON}>
              <Layer
                id="supply-circles"
                type="circle"
                paint={{
                  'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 15, 14],
                  'circle-color': [
                    'match',
                    ['get', 'category'],
                    'food', CATEGORY_COLORS.food,
                    'music', CATEGORY_COLORS.music,
                    'tech', CATEGORY_COLORS.tech,
                    'creative', CATEGORY_COLORS.creative,
                    'repair', CATEGORY_COLORS.repair,
                    'language', CATEGORY_COLORS.language,
                    'wellness', CATEGORY_COLORS.wellness,
                    'career', CATEGORY_COLORS.career,
                    'pets', CATEGORY_COLORS.pets,
                    CATEGORY_COLORS.default,
                  ],
                  'circle-opacity': 0.85,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                }}
              />

              {/* Labels at higher zoom */}
              <Layer
                id="supply-labels"
                type="symbol"
                minzoom={13}
                layout={{
                  'text-field': ['get', 'title'],
                  'text-size': 11,
                  'text-offset': [0, 1.5],
                  'text-anchor': 'top',
                  'text-max-width': 12,
                }}
                paint={{
                  'text-color': '#ffffff',
                  'text-halo-color': '#000000',
                  'text-halo-width': 1,
                }}
              />
            </Source>

            {/* Connection line during negotiation */}
            {showConnection && (
              <ConnectionLine
                from={activeNegotiation!.buyerLocation!}
                to={activeNegotiation!.sellerLocation!}
                status={activeNegotiation!.status}
              />
            )}
          </>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-8 h-8 rounded-full bg-blue-500/20 animate-ping" />
              <div className="absolute w-5 h-5 rounded-full bg-blue-500/30" />
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
