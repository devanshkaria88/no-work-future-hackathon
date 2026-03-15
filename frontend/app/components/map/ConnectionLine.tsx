'use client';

import { Source, Layer } from 'react-map-gl/mapbox';

interface ConnectionLineProps {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  status: string;
}

export default function ConnectionLine({ from, to, status }: ConnectionLineProps) {
  const lineColor = status === 'deal-reached' ? '#22bb22' : '#ffffff';

  const geojson = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
    },
  };

  return (
    <Source id="connection-line" type="geojson" data={geojson}>
      <Layer
        id="connection-line-layer"
        type="line"
        paint={{
          'line-color': lineColor,
          'line-width': status === 'deal-reached' ? 3 : 2,
          'line-dasharray': status === 'deal-reached' ? [1] : [4, 4],
          'line-opacity': 0.8,
        }}
      />
    </Source>
  );
}
