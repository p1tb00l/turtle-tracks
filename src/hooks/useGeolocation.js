import { useState, useEffect, useRef, useMemo } from 'react';

// Haversine formula to calculate distance between two coordinates in meters
export function calculateDistance(coords1, coords2) {
  if (!coords1 || !coords2) return 0;
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const lat1 = coords1.lat * rad;
  const lat2 = coords2.lat * rad;
  const dLat = (coords2.lat - coords1.lat) * rad;
  const dLng = (coords2.lng - coords1.lng) * rad;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Default starting point: Melrose Beach, Daufuskie Island, SC
const DAUFUSKIE_START = { lat: 32.1220, lng: -80.8650 };

import { calculateBeachCoverage } from '../utils/beachCoverage';

// SouthBeach geometries
const SOUTH_BEACH_POLYGON = [
  [-80.8765279, 32.0833093],
  [-80.8783191, 32.0826494],
  [-80.8775403, 32.0806698],
  [-80.8742694, 32.0804719],
  [-80.8697523, 32.0804719],
  [-80.8674938, 32.0825175],
  [-80.8632104, 32.0881261],
  [-80.8593943, 32.0945922],
  [-80.8560455, 32.0991445],
  [-80.8541764, 32.1012557],
  [-80.8541764, 32.1030369],
  [-80.8562013, 32.1041584],
  [-80.8586155, 32.1020473],
  [-80.8626653, 32.0973632],
  [-80.8661699, 32.0930087],
  [-80.8696745, 32.08872],
  [-80.8724781, 32.0844311],
  [-80.8730233, 32.0830454],
  [-80.8754376, 32.0827154],
  [-80.8765279, 32.0833093]
];

const SOUTH_BEACH_CENTERLINE = [
  [-80.8767842, 32.0823854],
  [-80.8765599, 32.0821661],
  [-80.8763399, 32.0819614],
  [-80.8761415, 32.0818262],
  [-80.8758956, 32.0817165],
  [-80.8755936, 32.0816507],
  [-80.8752141, 32.0816494],
  [-80.8747958, 32.0817417],
  [-80.8744005, 32.0818145],
  [-80.8739995, 32.0818776],
  [-80.8736557, 32.0818921],
  [-80.8733406, 32.0819261],
  [-80.8730141, 32.0819213],
  [-80.8725557, 32.0819029],
  [-80.8722063, 32.081898],
  [-80.8718568, 32.0820534],
  [-80.8716391, 32.0823204],
  [-80.8713927, 32.082733],
  [-80.8712037, 32.0831407],
  [-80.8709516, 32.0836892],
  [-80.8707396, 32.0841164],
  [-80.8704806, 32.084578],
  [-80.870303, 32.0849275],
  [-80.8700348, 32.0853427],
  [-80.869628, 32.0859058],
  [-80.8693244, 32.0864349],
  [-80.8690723, 32.0868329],
  [-80.8687859, 32.0872892],
  [-80.8685051, 32.0877358],
  [-80.8681068, 32.0882678],
  [-80.8676313, 32.0889085],
  [-80.867276, 32.089389],
  [-80.8669266, 32.0898695],
  [-80.8665431, 32.0903381],
  [-80.8661363, 32.090872],
  [-80.8657696, 32.0913865],
  [-80.8654316, 32.0918379],
  [-80.8651348, 32.0922023],
  [-80.8647281, 32.0926925],
  [-80.8643041, 32.0932264],
  [-80.863926, 32.0937506],
  [-80.8634329, 32.0943593],
  [-80.8629257, 32.0950277],
  [-80.862334, 32.0958392],
  [-80.8619247, 32.0964618],
  [-80.8612626, 32.0972376],
  [-80.8605582, 32.0981804],
  [-80.8599946, 32.0989562],
  [-80.8594452, 32.0996722],
  [-80.8588676, 32.1004122],
  [-80.8584027, 32.1009731],
  [-80.8579659, 32.1014266],
  [-80.8574024, 32.1019994],
  [-80.8568389, 32.1025365],
  [-80.8563317, 32.1029303],
  [-80.8557964, 32.1032406],
  [-80.8553737, 32.1034076]
];

// Melrose geometries
const MELROSE_POLYGON = [
  [-80.848516, 32.1102024],
  [-80.8466595, 32.1093619],
  [-80.8439709, 32.1124526],
  [-80.8407702, 32.1166275],
  [-80.8386897, 32.1192571],
  [-80.8377615, 32.1219408],
  [-80.8381456, 32.1238383],
  [-80.8405461, 32.124028],
  [-80.8408022, 32.1220492],
  [-80.8418904, 32.1202059],
  [-80.8430747, 32.1186065],
  [-80.844323, 32.1169799],
  [-80.8457313, 32.1153534],
  [-80.8472677, 32.113293],
  [-80.8478438, 32.1113139],
  [-80.848516, 32.1102024]
];

const MELROSE_CENTERLINE = [
  [-80.8479398, 32.1099458],
  [-80.847729, 32.1102831],
  [-80.8474792, 32.1107724],
  [-80.8471669, 32.1113279],
  [-80.8468845, 32.1118008],
  [-80.8465261, 32.1123592],
  [-80.8461391, 32.1129298],
  [-80.8457235, 32.1134397],
  [-80.8453365, 32.1139617],
  [-80.8442357, 32.1153264],
  [-80.8436555, 32.1160362],
  [-80.8431075, 32.1166915],
  [-80.8425274, 32.1172921],
  [-80.8419149, 32.1180019],
  [-80.8413347, 32.1187117],
  [-80.8407545, 32.1194487],
  [-80.840271, 32.1201039],
  [-80.8399165, 32.1207591],
  [-80.8394975, 32.1214689],
  [-80.839433, 32.1220422],
  [-80.8393685, 32.1225881],
  [-80.8393685, 32.1232706]
];

export function useGeolocation(isTracking = false, options = {}) {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [path, setPath] = useState([]);
  const [distance, setDistance] = useState(0); // in meters
  const [isSimulated, setIsSimulated] = useState(false);

  const watchIdRef = useRef(null);
  const simIntervalRef = useRef(null);
  const lastLocationRef = useRef(null);

  // Toggle simulator mode
  const startSimulator = () => {
    setError(null);
    setIsSimulated(true);
    setLocation(DAUFUSKIE_START);
    setAccuracy(5); // Simulated high accuracy (5m)
    setPath([DAUFUSKIE_START]);
    setDistance(0);
    lastLocationRef.current = DAUFUSKIE_START;
  };

  const stopSimulator = () => {
    setIsSimulated(false);
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  // Real GPS Tracking
  useEffect(() => {
    if (!isTracking || isSimulated) {
      // Clean up watch if tracking is stopped
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const lastTimestampRef = { current: Date.now() };
    let tentativePoints = [];

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const newLoc = { lat: latitude, lng: longitude };
      const now = Date.now();

      // 1. FILTER: Coordinate must be physically located on Daufuskie Island bounds
      const minLat = 32.0800;
      const maxLat = 32.1700;
      const minLng = -80.9200;
      const maxLng = -80.8000;

      const isOnIsland = latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
      if (!isOnIsland) {
        console.warn("Discarded errant GPS point outside Daufuskie Island boundary:", newLoc);
        return;
      }

      setLocation(newLoc);
      setAccuracy(accuracy);
      setError(null);

      // If we are tracking, build the path and accumulate distance
      setPath((prevPath) => {
        if (prevPath.length === 0) {
          lastLocationRef.current = newLoc;
          lastTimestampRef.current = now;
          tentativePoints = [];
          return [newLoc];
        }
        
        const lastLoc = prevPath[prevPath.length - 1];
        const distMoved = calculateDistance(lastLoc, newLoc);
        const timeElapsedSec = (now - lastTimestampRef.current) / 1000;
        const maxSpeedMPS = 11.176; // 25 mph converted to meters per second

        // 2. SPEED FILTER: Check speed relative to the last confirmed point
        let isSpeedInvalid = false;
        if (timeElapsedSec > 1) {
          const speedMPS = distMoved / timeElapsedSec;
          if (speedMPS > maxSpeedMPS) {
            isSpeedInvalid = true;
          }
        }

        if (isSpeedInvalid) {
          // Check if this point matches the tentative sequence we're building
          if (tentativePoints.length === 0) {
            console.warn(`Tentative errant point detected (speed: ${((distMoved / timeElapsedSec) * 2.23694).toFixed(1)} mph). Buffering...`);
            tentativePoints.push({ loc: newLoc, timestamp: now });
            return prevPath;
          } else {
            // Check speed relative to the PREVIOUS tentative point instead of the stale lastLoc
            const prevTentative = tentativePoints[tentativePoints.length - 1];
            const distFromTentative = calculateDistance(prevTentative.loc, newLoc);
            const timeFromTentativeSec = (now - prevTentative.timestamp) / 1000;
            
            let isTentativeSpeedValid = true;
            if (timeFromTentativeSec > 0.5) {
              const speedTentativeMPS = distFromTentative / timeFromTentativeSec;
              if (speedTentativeMPS > maxSpeedMPS) {
                isTentativeSpeedValid = false;
              }
            }

            if (isTentativeSpeedValid) {
              tentativePoints.push({ loc: newLoc, timestamp: now });
              console.log(`Buffered tentative point #${tentativePoints.length}`);

              // If we have accumulated 3 consecutive realistic tentative points, the user's new position is real!
              // Commit the entire sequence to the path.
              if (tentativePoints.length >= 3) {
                console.log("Committing 3 consecutive valid tentative points after GPS outage/jump.");
                
                // Add the direct gap distance between the last confirmed point and the first tentative point
                const gapDistance = calculateDistance(lastLoc, tentativePoints[0].loc);
                
                // Accumulate distance for the entire tentative chain
                let additionalDistance = gapDistance;
                for (let i = 1; i < tentativePoints.length; i++) {
                  additionalDistance += calculateDistance(tentativePoints[i - 1].loc, tentativePoints[i].loc);
                }

                setDistance((prevDist) => prevDist + additionalDistance);
                lastLocationRef.current = newLoc;
                lastTimestampRef.current = now;

                const committedLocs = tentativePoints.map(p => p.loc);
                tentativePoints = [];
                return [...prevPath, ...committedLocs];
              }
              return prevPath;
            } else {
              // The new point is also moving errantly (not matching a stable path). 
              // Discard the whole tentative chain and start fresh with this new point.
              console.warn("Tentative buffer disrupted by irregular velocity. Resetting tentative queue.");
              tentativePoints = [{ loc: newLoc, timestamp: now }];
              return prevPath;
            }
          }
        } else {
          // Point is valid relative to lastLoc. Clear tentative buffer since we are back on track.
          tentativePoints = [];

          // Only append and calculate distance if moved significantly (e.g. > 2 meters)
          if (distMoved > 2) {
            setDistance((prevDist) => prevDist + distMoved);
            lastLocationRef.current = newLoc;
            lastTimestampRef.current = now;
            return [...prevPath, newLoc];
          }
          return prevPath;
        }
      });
    };

    const handleError = (err) => {
      console.warn('Geolocation error:', err.message);
      const isLocal = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setError(`GPS Error: ${err.message}.${isLocal ? ' Switch to Simulator Mode if indoors.' : ''}`);
    };

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, isSimulated, options]);

  // Simulated GPS Movement Loop
  useEffect(() => {
    if (!isTracking || !isSimulated) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      return;
    }

    // Start simulation interval if tracking is active
    simIntervalRef.current = setInterval(() => {
      setLocation((prevLoc) => {
        if (!prevLoc) return DAUFUSKIE_START;
        
        // Simulating walking south-west along Daufuskie Island beach shoreline
        // Incur a small randomized step: delta lat is slightly negative, delta lng is slightly negative
        const deltaLat = -0.00005 - Math.random() * 0.00005;
        const deltaLng = -0.00004 - Math.random() * 0.00004;

        const nextLoc = {
          lat: prevLoc.lat + deltaLat,
          lng: prevLoc.lng + deltaLng
        };

        const stepDistance = calculateDistance(prevLoc, nextLoc);
        setDistance((prevDist) => prevDist + stepDistance);
        setPath((prevPath) => [...prevPath, nextLoc]);

        return nextLoc;
      });
    }, 3000); // Step every 3 seconds

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [isTracking, isSimulated]);

  const beachCoverage = useMemo(() => {
    return calculateBeachCoverage(path, SOUTH_BEACH_CENTERLINE, MELROSE_CENTERLINE, SOUTH_BEACH_POLYGON, MELROSE_POLYGON);
  }, [path]);

  return {
    location,
    accuracy,
    error,
    path,
    distance,
    beachCoverage,
    isSimulated,
    startSimulator,
    stopSimulator,
    setPath,
    setDistance,
    setLocation
  };
}
