import { useState, useEffect, useRef } from 'react';

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

  return {
    location,
    accuracy,
    error,
    path,
    distance,
    isSimulated,
    startSimulator,
    stopSimulator,
    setPath,
    setDistance,
    setLocation
  };
}
