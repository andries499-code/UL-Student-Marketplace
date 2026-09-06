import type { Category, Condition, MeetupLocation } from './types';

export const CATEGORIES: Category[] = [
  'Textbooks',
  'Appliances',
  'Electronics & Gadgets',
  'Clothing & Shoes',
  'Room Decor & Furniture',
  'Other',
];

export const CONDITIONS: Condition[] = [
  'Brand New',
  'Good / Working',
  'Fair',
  'Worn / Needs Repair',
];

export const MEETUP_LOCATIONS: MeetupLocation[] = [
  'Turfloop Campus Main',
  'Mankweng Local Area',
  'Off-Campus Residences',
  'Digital PDF Only',
];

export const POWER_TYPES = [
  'Prepaid-friendly / Low Voltage',
  'Standard',
] as const;

export const FACULTIES = [
  'Humanities',
  'Science & Agriculture',
  'Management & Law',
  'Health Sciences',
  'Education',
  'Other',
] as const;

export const CATEGORY_ICONS: Record<Category, string> = {
  Textbooks: 'BookOpen',
  Appliances: 'Refrigerator',
  'Electronics & Gadgets': 'Smartphone',
  'Clothing & Shoes': 'Shirt',
  'Room Decor & Furniture': 'Lamp',
  Other: 'Package',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Textbooks: 'bg-blue-100 text-blue-700 border-blue-200',
  Appliances: 'bg-amber-100 text-amber-700 border-amber-200',
  'Electronics & Gadgets': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Clothing & Shoes': 'bg-pink-100 text-pink-700 border-pink-200',
  'Room Decor & Furniture': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const CONDITION_COLORS: Record<Condition, string> = {
  'Brand New': 'bg-emerald-100 text-emerald-700',
  'Good / Working': 'bg-blue-100 text-blue-700',
  Fair: 'bg-amber-100 text-amber-700',
  'Worn / Needs Repair': 'bg-rose-100 text-rose-700',
};

export function formatPrice(price: number): string {
  return 'R' + price.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return Math.floor(days / 365) + 'y ago';
}
