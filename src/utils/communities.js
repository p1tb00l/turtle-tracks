// Ray-casting algorithm to determine if a point is inside a polygon
// Supports point as {lat, lng} and polygon coordinates as array of [lat, lng] or [lng, lat]
export function isPointInPolygon(point, polygon) {
  const x = point.lng !== undefined ? point.lng : point[0];
  const y = point.lat !== undefined ? point.lat : point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    // Determine coordinate ordering.
    // If element is [lat, lng] vs [lng, lat], we check which index represents longitude (usually index 1 if lat is index 0)
    // For standard GeoJSON it is [lng, lat]. In our communities array in MapView.jsx, coordinates are defined as [lat, lng].
    // Let's make it robust by checking if the coordinate values represent lat/lng bounds.
    let xi = polygon[i][0];
    let yi = polygon[i][1];
    let xj = polygon[j][0];
    let yj = polygon[j][1];

    // If coordinates are [lat, lng] (e.g. lat is ~32, lng is ~-80), swap them so xi is lng, yi is lat
    if (Math.abs(xi) > 50 && Math.abs(yi) < 50) {
      const tempI = xi;
      xi = yi;
      yi = tempI;
      const tempJ = xj;
      xj = yj;
      yj = tempJ;
    }

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

// Map of Daufuskie Island communities with their bounding coordinates
export const COMMUNITIES = [
  {
    name: 'Haig Point',
    coordinates: [
      [32.121547, -80.8567697],
      [32.1240999, -80.8606868],
      [32.1297295, -80.85346],
      [32.1368864, -80.8483746],
      [32.1440135, -80.856527],
      [32.1481908, -80.8482041],
      [32.1498064, -80.8369452],
      [32.1448126, -80.8329344],
      [32.1378207, -80.8305752],
      [32.1248802, -80.8386763],
      [32.1200416, -80.8423898],
      [32.1173198, -80.8476031],
      [32.1215537, -80.8567443]
    ]
  },
  {
    name: 'Melrose',
    coordinates: [
      [32.121547, -80.8567697],
      [32.1143493, -80.8684104],
      [32.1121112, -80.867482],
      [32.1007899, -80.8563098],
      [32.1067946, -80.8468176],
      [32.11611, -80.8394618],
      [32.1248802, -80.8386763],
      [32.1200416, -80.8423898],
      [32.1173198, -80.8476031],
      [32.1215537, -80.8567443]
    ]
  },
  {
    name: 'Oak Ridge',
    coordinates: [
      [32.0982819, -80.8737836],
      [32.1015763, -80.8803766],
      [32.1121112, -80.867482],
      [32.1007899, -80.8563098],
      [32.0927859, -80.8619271],
      [32.0982819, -80.8737836]
    ]
  },
  {
    name: 'Bloody Point',
    coordinates: [
      [32.0982819, -80.8737836],
      [32.0987241, -80.8828811],
      [32.0876686, -80.8889212],
      [32.0896903, -80.8839997],
      [32.0900694, -80.8804949],
      [32.0869737, -80.8787798],
      [32.0824879, -80.8779595],
      [32.0805292, -80.8772138],
      [32.0804029, -80.8716957],
      [32.082172, -80.8681164],
      [32.0927859, -80.8619271],
      [32.0982819, -80.8737836]
    ]
  }
];

export function getPointCommunity(point) {
  if (!point) return null;
  for (const comm of COMMUNITIES) {
    if (isPointInPolygon(point, comm.coordinates)) {
      return comm.name;
    }
  }
  return null;
}
