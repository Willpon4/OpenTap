'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const FountainMap = dynamic(() => import('@/components/FountainMap'), { ssr: false });

export default function MapPage() {
  const [fountains, setFountains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          loadFountains(loc);
        },
        () => {
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