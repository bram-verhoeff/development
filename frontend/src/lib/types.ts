// Types die overeenkomen met de schema's van de backend (backend/app/schemas.py)

export const PLATFORMS = ["instagram", "linkedin", "tiktok", "x", "facebook"] as const;
export type Platform = (typeof PLATFORMS)[number];
// Soorten koppelingen: per platform, plus de LinkedIn-bedrijfspagina's (aparte LinkedIn-app)
export type ConnectionKind = Platform | "linkedin_pages";

export const STATUSES = ["concept", "approved", "rejected"] as const;
export type PostStatus = (typeof STATUSES)[number];

export type Brand = {
  id: number;
  name: string;
  website_url: string | null;
  target_audience: string;
  tone_of_voice: string;
  usps: string[];
  colors: string[];
  avoid_terms: string[];
  content_language: "nl" | "en";
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PostWarning = {
  code: "too_long" | "too_many_hashtags" | "avoid_terms";
  length?: number;
  max?: number;
  count?: number;
  terms?: string[];
};

export type Post = {
  id: number;
  brand_id: number;
  brand_name: string;
  platform: Platform;
  hook: string;
  body: string;
  hashtags: string[];
  status: PostStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  char_count: number;
  max_chars: number;
  warnings: PostWarning[];
  published_at: string | null;
  external_url: string | null;
  publish_error: string | null;
  next_attempt_at: string | null;
  thumbnail_url: string | null;
  thumbnail_kind: "image" | "video" | null;
  // LinkedIn: id van de bedrijfspagina; null = eigen profiel
  publish_as: string | null;
};

export type PostVersion = {
  id: number;
  hook: string;
  body: string;
  hashtags: string[];
  origin: "generated" | "edited" | "regenerated";
  instructions: string | null;
  created_at: string;
};

export type LinkedInPage = { id: string; name: string; avatar_url: string | null; is_default: boolean };

export type Connection = {
  platform: ConnectionKind;
  display_name: string;
  avatar_url: string | null;
  expires_at: string | null;
  expired: boolean;
  connected_at: string;
  pages: LinkedInPage[];
};

export type ConnectionsData = {
  platforms: { platform: ConnectionKind; supported: boolean; configured: boolean }[];
  connections: Connection[];
};

export type PostMedia = {
  id: number;
  kind: "image" | "video";
  status: "pending" | "ready" | "failed";
  url: string | null;
  mime_type: string | null;
  aspect_ratio: string;
  instructions: string | null;
  error: string | null;
  created_at: string;
};

// Waar een LinkedIn-post op kan komen: je eigen profiel (value null) of een bedrijfspagina
export type PublishOption = { value: string | null; label: string; kind: "profile" | "page"; avatar_url: string | null };

export type PostDetail = Post & {
  versions: PostVersion[];
  connection: Connection | null;
  media: PostMedia[];
  publish_as_label: string | null;
  publish_options: PublishOption[];
};

export type Dashboard = {
  brands: number;
  concept: number;
  approved_unscheduled: number;
  scheduled_upcoming: number;
  rejected: number;
  generations_today: number;
  generation_daily_limit: number;
  upcoming: Post[];
  recent_concepts: Post[];
};
