import { useState, useEffect } from 'react';
import { idb } from '../utils/idb';

export function useIndexedDB(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial value from IndexedDB, falling back to localStorage if present, then initialValue
  useEffect(() => {
    async function loadVal() {
      try {
        let val = await idb.get(key);
        
        // If not found in IndexedDB, check localStorage for backward compatibility migration
        if (val === undefined || val === null) {
          const legacyItem = window.localStorage.getItem(key);
          if (legacyItem !== null) {
            try {
              val = JSON.parse(legacyItem);
              // Migrate to IndexedDB
              await idb.set(key, val);
              // Clean up legacy localStorage to free up browser quota space
              window.localStorage.removeItem(key);
            } catch (e) {
              console.warn("Failed to migrate legacy localStorage key:", key, e);
            }
          }
        }

        if (val !== undefined && val !== null) {
          setStoredValue(val);
        }
      } catch (error) {
        console.error(`Error reading IndexedDB key "${key}":`, error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadVal();
  }, [key]);

  // Save changes to IndexedDB when state changes
  const setValue = async (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await idb.set(key, valueToStore);
    } catch (error) {
      console.error(`Error setting IndexedDB key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded];
}
export { useIndexedDB as useLocalStorage };
