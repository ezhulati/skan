import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { VenueContextType, Venue, MenuCategory } from '../types';
import { api } from '../services/api';

const VenueContext = createContext<VenueContextType | undefined>(undefined);

interface VenueProviderProps {
  children: ReactNode;
  venueSlug: string;
  tableNumber: string;
}

export function VenueProvider({ children, venueSlug, tableNumber }: VenueProviderProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVenueMenu = useCallback(async () => {
    if (!venueSlug) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getVenueMenu(venueSlug);
      setVenue(response.venue);
      setMenuCategories(response.categories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load venue menu';
      setError(errorMessage);
      console.error('Error loading venue menu:', err);
    } finally {
      setIsLoading(false);
    }
  }, [venueSlug]);

  useEffect(() => {
    loadVenueMenu();
  }, [loadVenueMenu]);

  const value: VenueContextType = {
    venueSlug,
    tableNumber,
    venue,
    menuCategories,
    isLoading,
    error,
    loadVenueMenu,
  };

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue(): VenueContextType {
  const context = useContext(VenueContext);
  if (context === undefined) {
    throw new Error('useVenue must be used within a VenueProvider');
  }
  return context;
}