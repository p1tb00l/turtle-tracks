// Ray-casting algorithm to determine if a point is inside a polygon
export function isPointInPolygon(point, polygon) {
  const x = point.lng || point[0];
  const y = point.lat || point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

// Map a coordinate point to its closest point on a line segment
function getClosestPointOnSegment(p, p1, p2) {
  const x = p.lng;
  const y = p.lat;
  const x1 = p1[0];
  const y1 = p1[1];
  const x2 = p2[0];
  const y2 = p2[1];

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return { lat: yy, lng: xx };
}

// Calculate the unique linear beach coverage from a list of path coordinates
export function calculateBeachCoverage(path, southCenterline, melroseCenterline, southPolygon, melrosePolygon) {
  if (!path || path.length === 0) return 0;

  // Segment size of 15 meters to divide the centerline
  const segmentLengthMeters = 15;
  const coverageSlots = new Set();

  // Helper to project a coordinate onto a centerline and identify visited slots
  const projectToCenterline = (pt, centerline, polygon, sectionKey) => {
    if (!isPointInPolygon(pt, polygon)) return;

    // Find the closest segment on the centerline
    let minDistance = Infinity;
    let closestIndex = -1;
    let closestProjPt = null;

    for (let i = 0; i < centerline.length - 1; i++) {
      const p1 = centerline[i];
      const p2 = centerline[i + 1];
      const projPt = getClosestPointOnSegment(pt, p1, p2);
      
      // Calculate distance using Haversine
      const dist = calculateDistance(pt, projPt);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
        closestProjPt = projPt;
      }
    }

    // Only map if the point is reasonably close to the centerline (e.g. within 120m)
    if (closestIndex !== -1 && minDistance < 120) {
      // Calculate cumulative distance from start of centerline to projection point
      let cumDistance = 0;
      for (let i = 0; i < closestIndex; i++) {
        cumDistance += calculateDistance(
          { lat: centerline[i][1], lng: centerline[i][0] },
          { lat: centerline[i + 1][1], lng: centerline[i + 1][0] }
        );
      }
      cumDistance += calculateDistance(
        { lat: centerline[closestIndex][1], lng: centerline[closestIndex][0] },
        closestProjPt
      );

      // Divide by slot length to get unique segment ID
      const slotId = Math.floor(cumDistance / segmentLengthMeters);
      coverageSlots.add(`${sectionKey}-${slotId}`);
    }
  };

  const calculateDistance = (c1, c2) => {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const lat1 = c1.lat * rad;
    const lat2 = c2.lat * rad;
    const dLat = (c2.lat - c1.lat) * rad;
    const dLng = (c2.lng - c1.lng) * rad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Map each path coordinate point to slots
  path.forEach(pt => {
    projectToCenterline(pt, southCenterline, southPolygon, 'south');
    projectToCenterline(pt, melroseCenterline, melrosePolygon, 'melrose');
  });

  // Unique coverage is the sum of unique visited slots multiplied by slot length
  return coverageSlots.size * segmentLengthMeters;
}
