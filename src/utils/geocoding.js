/**
 * Reverse geocodes coordinates using OpenStreetMap Nominatim API.
 * Falls back gracefully to "Daufuskie Island" or general descriptors if offline.
 */
export async function getIslandLocation(lat, lng) {
  if (!lat || !lng) return 'Daufuskie Island';

  // Check if we are near Daufuskie Island coordinate box
  // Lat range: ~32.08 to ~32.14, Lng range: ~-80.91 to ~-80.84
  const isNearDaufuskie = 
    lat >= 32.08 && lat <= 32.16 && 
    lng >= -80.92 && lng <= -80.82;

  const defaultName = isNearDaufuskie ? 'Daufuskie Island Beach' : 'Local Beach';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'TurtleTracks-App/1.0 (Sea Turtle Monitoring SPA)'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Geocoding service error');

    const data = await response.json();
    const addr = data.address || {};
    
    // Attempt to extract the most descriptive name
    const island = addr.island || addr.suburb || addr.town || addr.hamlet || addr.county || '';
    const state = addr.state === 'South Carolina' ? 'SC' : (addr.state || '');
    
    if (island) {
      return `${island}${state ? ', ' + state : ''}`;
    }

    if (data.display_name) {
      // Split display name and take the first few segments
      const parts = data.display_name.split(',');
      return parts.slice(0, 2).join(',').trim();
    }

    return defaultName;
  } catch (error) {
    console.warn('Reverse geocoding failed or timed out. Using offline fallback name.', error);
    return defaultName;
  }
}
