export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  style: 'mapbox://styles/mapbox/standard',
  center: [-0.1276, 51.5074] as [number, number],
  zoom: 17,
  minZoom: 10,
  maxZoom: 25,
  maxBounds: [
    [-0.5103, 51.2868],
    [0.3340, 51.6919],
  ] as [[number, number], [number, number]],
};
