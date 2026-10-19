// Types die overeenkomen met de schema's van de backend (backend/app/schemas.py)

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
