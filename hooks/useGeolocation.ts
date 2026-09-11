"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface GeolocationState {
  location: { lat: number; lng: number } | null;
  status: "idle" | "loading" | "granted" | "denied" | "unavailable" | "error";
  accuracy: number | null;
}

export default function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    status: "idle",
    accuracy: null,
  });

  const resolveRef = useRef<((loc: { lat: number; lng: number } | null) => void) | null>(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, status: "unavailable" }));
      return;
    }

    setState((s) => ({ ...s, status: "loading" }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setState({ location: loc, status: "granted", accuracy: position.coords.accuracy });
        resolveRef.current?.(loc);
        resolveRef.current = null;
      },
      (error) => {
        let status: GeolocationState["status"] = "error";
        if (error.code === error.PERMISSION_DENIED) status = "denied";
        else if (error.code === error.POSITION_UNAVAILABLE) status = "unavailable";
        setState((s) => ({ ...s, status }));
        resolveRef.current?.(null);
        resolveRef.current = null;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const waitForLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (state.location) {
        resolve(state.location);
        return;
      }
      resolveRef.current = resolve;
      request();
      setTimeout(() => {
        if (resolveRef.current === resolve) {
          resolveRef.current = null;
          resolve(state.location);
        }
      }, 10000);
    });
  }, [state.location, request]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            status: "granted",
            accuracy: position.coords.accuracy,
          });
        },
        () => {
          setState((s) => ({ ...s, status: "idle" }));
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

  return { ...state, request, waitForLocation };
}
