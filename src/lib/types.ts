export type Category =
  | 'Textbooks'
  | 'Appliances'
  | 'Electronics & Gadgets'
  | 'Clothing & Shoes'
  | 'Room Decor & Furniture'
  | 'Other';

export type Condition =
  | 'Brand New'
  | 'Good / Working'
  | 'Fair'
  | 'Worn / Needs Repair';

export type MeetupLocation =
  | 'Turfloop Campus Main'
  | 'Mankweng Local Area'
  | 'Off-Campus Residences'
  | 'Digital PDF Only';

export type ListingStatus = 'active' | 'sold' | 'reserved';

export type PowerType = 'Prepaid-friendly / Low Voltage' | 'Standard';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  category: Category;
  price: number;
  description: string;
  condition: Condition;
  image_urls: string[];
  author: string | null;
  edition: string | null;
  module_code: string | null;
  faculty: string | null;
  power_type: string | null;
  meetup_location: MeetupLocation;
  precise_spot?: string;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  listing?: Listing | null;
  buyer?: Profile | null;
  seller?: Profile | null;
  last_message?: Message | null;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type ReportTargetType = 'listing' | 'user';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}
