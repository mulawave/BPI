"use client";

import { useState, useEffect } from "react";
import { Check, X, Edit, MapPin, Globe, Flag } from "lucide-react";
import { api } from "@/client/trpc";

interface LocationCascadeFieldProps {
  countryValue: string | null;
  stateValue: string | null;
  cityValue: string | null;
  countryName?: string | null;
  stateName?: string | null;
  cityName?: string | null;
  onUpdateStatus?: (status: 'loading' | 'success' | 'error', message: string) => void;
}

export function LocationCascadeField({ 
  countryValue, 
  stateValue, 
  cityValue,
  countryName: countryNameProp,
  stateName: stateNameProp,
  cityName: cityNameProp,
  onUpdateStatus 
}: LocationCascadeFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  
  const utils = api.useUtils();
  
  // Fetch location names for display
  const { data: countries } = api.location.getCountries.useQuery();
  const { data: states } = api.location.getStates.useQuery(
    { countryId: selectedCountryId! },
    { enabled: !!selectedCountryId }
  );
  const { data: cities } = api.location.getCities.useQuery(
    { stateId: selectedStateId! },
    { enabled: !!selectedStateId }
  );
  
  // Get display names - use props if available, otherwise lookup from API data
  const countryName = countryNameProp || countries?.find(c => c.id === parseInt(countryValue || '0'))?.name || null;
  const stateName = stateNameProp || states?.find(s => s.id === parseInt(stateValue || '0'))?.name || null;
  const cityName = cityNameProp || cities?.find(c => c.id === parseInt(cityValue || '0'))?.name || null;
  
  const updateProfile = api.user.updateDetails.useMutation({
    onMutate: () => {
      onUpdateStatus?.('loading', 'Updating location...');
    },
    onSuccess: async () => {
      setIsEditing(false);
      onUpdateStatus?.('success', 'Location updated successfully!');
      await utils.user.getDetails.invalidate();
    },
    onError: (error) => {
      console.error('Failed to update location:', error.message);
      onUpdateStatus?.('error', 'Failed to update location. Please try again.');
    }
  });

  const handleEdit = () => {
    setIsEditing(true);
    setSelectedCountryId(countryValue ? parseInt(countryValue) : null);
    setSelectedStateId(stateValue ? parseInt(stateValue) : null);
    setSelectedCityId(cityValue ? parseInt(cityValue) : null);
  };

  const handleSave = () => {
    updateProfile.mutate({
      countryId: selectedCountryId,
      stateId: selectedStateId,
      cityId: selectedCityId,
    } as any);
  };

  const handleCancel = () => {
    setSelectedCountryId(countryValue ? parseInt(countryValue) : null);
    setSelectedStateId(stateValue ? parseInt(stateValue) : null);
    setSelectedCityId(cityValue ? parseInt(cityValue) : null);
    setIsEditing(false);
  };

  const handleCountryChange = (value: string) => {
    const countryId = value ? parseInt(value) : null;
    setSelectedCountryId(countryId);
    setSelectedStateId(null);
    setSelectedCityId(null);
  };

  const handleStateChange = (value: string) => {
    const stateId = value ? parseInt(value) : null;
    setSelectedStateId(stateId);
    setSelectedCityId(null);
  };

  const handleCityChange = (value: string) => {
    const cityId = value ? parseInt(value) : null;
    setSelectedCityId(cityId);
  };

  if (isEditing) {
    return (
      <div className="py-2 space-y-2 border-b border-gray-100 dark:border-bpi-dark-accent">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-bpi-primary" />
            Location
          </label>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="p-0.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancel}
              disabled={updateProfile.isPending}
              className="p-0.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded transition-colors disabled:opacity-50"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {updateProfile.isPending && (
          <div className="w-full h-1 bg-gray-200 dark:bg-bpi-dark-accent rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-bpi-primary to-bpi-secondary animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
        
        {/* Country Dropdown */}
        <div>
          <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
            <Globe className="w-2.5 h-2.5" />
            Country
          </label>
          <select
            value={selectedCountryId || ''}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={updateProfile.isPending}
            className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none disabled:opacity-50"
          >
            <option value="">Select Country</option>
            {countries?.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* State Dropdown */}
        {selectedCountryId && (
          <div>
            <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
              <Flag className="w-2.5 h-2.5" />
              State/Province
            </label>
            <select
              value={selectedStateId || ''}
              onChange={(e) => handleStateChange(e.target.value)}
              disabled={updateProfile.isPending || !states}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none disabled:opacity-50"
            >
              <option value="">Select State</option>
              {states?.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* City Dropdown */}
        {selectedStateId && (
          <div>
            <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
              <MapPin className="w-2.5 h-2.5" />
              City
            </label>
            <select
              value={selectedCityId || ''}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={updateProfile.isPending || !cities}
              className="w-full text-xs text-foreground bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded px-2 py-1 focus:border-bpi-primary focus:outline-none disabled:opacity-50"
            >
              <option value="">Select City</option>
              {cities?.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-bpi-dark-accent">
      <div className="flex-1">
        <label className="text-xs font-medium text-muted-foreground mb-0 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-bpi-primary" />
          Location
        </label>
        <div className="text-sm text-foreground">
          {cityName && stateName && countryName ? (
            <span>{cityName}, {stateName}, {countryName}</span>
          ) : countryName ? (
            <span>{countryName}</span>
          ) : (
            <span className="text-muted-foreground">Not set</span>
          )}
        </div>
      </div>
      
      <button
        onClick={handleEdit}
        className="p-0.5 text-bpi-primary hover:bg-bpi-primary/10 rounded transition-colors ml-1"
      >
        <Edit className="w-3 h-3" />
      </button>
    </div>
  );
}
