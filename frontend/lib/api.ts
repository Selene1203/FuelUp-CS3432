const API_BASE_URL = "https://fuelup-backend-production.up.railway.app";

export const TOKEN_KEY = "fuelup_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

interface ApiOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { requiresAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// API Types
export interface FuelType {
  fuel_id: number;
  fuel_name: string;
  color_hex: string;
}

export interface Station {
  station_id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  opening_hours?: string;
  is_verified: boolean;
  avg_rating?: number;
  fuels?: StationFuel[];
  reviews?: Review[];
}

export interface StationFuel {
  fuel_id: number;
  fuel_type_id: number;
  fuel_name: string;
  color_hex: string;
  price_per_liter: number;
  is_available: boolean;
  last_updated?: string;
}

export interface Review {
  review_id: number;
  user_id: number;
  user_name: string;
  station_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  preferred_fuel?: number;
  preferred_theme?: string;
  distance_unit?: string;
  gps_enabled?: boolean;
}

export interface Favourite {
  favourite_id: number;
  station_id: number;
  station_name: string;
  city: string;
  country: string;
  avg_rating?: number;
  fuels?: StationFuel[];
}

export interface SearchHistory {
  search_id: number;
  query_text: string;
  fuel_type_id?: number;
  results_count: number;
  created_at: string;
}

export interface AdminStation {
  station_id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  opening_hours?: string;
}

export interface Analytics {
  view_count: number;
  search_appearances: number;
  last_viewed?: string;
}

export interface ReportStation {
  station_id: number;
  name: string;
}

export interface ReportUser {
  user_id: number;
  name: string;
  email: string;
}

export interface FuelPriceReport {
  fuel_name: string;
  price_per_liter: number;
  is_available: boolean;
  last_updated: string;
  updated_by: string;
}

export interface PriceHistoryReport {
  fuel_name: string;
  old_price: number;
  new_price: number;
  change: number;
  changed_by: string;
  changed_at: string;
}

export interface SearchActivityReport {
  query_text: string;
  fuel_filter: string;
  results_count: number;
  searched_at: string;
  stations_returned: string[];
}

export interface ReviewsReport {
  average_rating: number;
  reviews: {
    reviewer_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }[];
}
