'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

// Leaflet must be loaded client-side only
const FountainMap = dynamic(() => import('@/components/FountainMap'), { ssr: false });

export default function HomePage() {
  const [fountains, setFountains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Try to get user location for initial map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          loadFountains(loc);
        },
        () => {
          // Default to continental US center
          loadFountains({ lat: 39.8, lng: -98.5 });
        },
        { timeout: 5000 }
      );
    } else {
      loadFountains({ lat: 39.8, lng: -98.5 });
    }
  }, []);

  const loadFountains = async (center) => {
    try {
      // Load fountains in a reasonable radius around the user
      const data = await api.getFountains({
        lat: center.lat,
        lng: center.lng,
        radius_m: 50000,
        limit: 2000,
      });
      setFountains(data);
    } catch (e) {
      console.error('Failed to load fountains:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FountainMap
      fountains={fountains}
      center={userLocation ? [userLocation.lat, userLocation.lng] : [39.8, -98.5]}
      zoom={userLocation ? 14 : 4}
    />
  );
}
