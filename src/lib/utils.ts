import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface DetailedAddress {
  house: string;
  street?: string;
  postOffice: string;
  city: string;
  district: string;
  state: string;
  pin: string;
  country?: string;
  mobile: string;
}

export function parseAddress(addressString: string): DetailedAddress | string {
  try {
    const parsed = JSON.parse(addressString);
    if (parsed && typeof parsed === 'object' && 'city' in parsed) {
      return parsed as DetailedAddress;
    }
    return addressString;
  } catch {
    return addressString;
  }
}
