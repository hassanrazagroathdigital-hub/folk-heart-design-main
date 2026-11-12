/** Where a record came from. Only "database" records may be edited or deleted. */
export type RecordSource = "database" | "default";

export type StockStatus = "available" | "sample" | "coming_soon" | "sold_out" | "none";

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  available: "Available",
  sample: "Sample pattern",
  coming_soon: "Coming soon",
  sold_out: "Sold out",
  none: "No badge",
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  featured_image: string | null;
  gallery_images: string[];
  price: number | null;
  sale_price: number | null;
  sku: string | null;
  quantity: number | null;
  stock_status: StockStatus;
  featured: boolean;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type InquiryType = "contact" | "custom_order" | "general";
export type InquiryStatus = "new" | "in_progress" | "replied" | "closed" | "spam";

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  contact: "Contact",
  custom_order: "Custom order",
  general: "Homepage inquiry",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  replied: "Replied",
  closed: "Closed",
  spam: "Spam",
};

export interface Inquiry {
  id: string;
  type: InquiryType;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  details: Record<string, unknown>;
  status: InquiryStatus;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

/** Public-facing records carry their source so fallbacks are never mistaken for saved rows. */
export type Sourced<T> = T & { _source: RecordSource };

export interface PublicCategory extends Sourced<Category> {
  /** Built-in image used when image_url is empty (defaults only). */
  fallback_image?: string;
}

export interface PublicProduct extends Sourced<Product> {
  category_name: string | null;
  category_slug: string | null;
}

export type PublicFaq = Sourced<Faq>;

// ---------------------------------------------------------------------------
// Site settings (stored as JSONB in site_settings.data, deep-merged over defaults)
// Image fields: an empty string means "use the image that ships with the site".
// ---------------------------------------------------------------------------

export interface StoryMember {
  heading: string;
  body: string;
  image_url: string;
  image_alt: string;
}

export interface SiteSettings {
  brand: {
    name: string;
    tagline: string;
    logo_url: string;
    favicon_url: string;
  };
  contact: {
    email: string;
    phone: string;
    location: string;
    instagram_handle: string;
    instagram_url: string;
    linktree_url: string;
  };
  hero: {
    headline: string;
    body: string;
    note: string;
    image_url: string;
    image_alt: string;
    primary_cta: string;
    secondary_cta: string;
  };
  home: {
    marquee: string;
    collections_title: string;
    inquiry_eyebrow: string;
    inquiry_title: string;
    inquiry_body: string;
    inquiry_note: string;
  };
  shop: {
    title: string;
    subtitle: string;
  };
  story: {
    title: string;
    subtitle: string;
    intro: string;
    members: StoryMember[];
    closing_title: string;
  };
  contact_page: {
    title: string;
    intro: string;
    closing_note: string;
  };
  custom_order: {
    title: string;
    intro: string;
    faq_title: string;
  };
  footer: {
    tagline: string;
    about: string;
    copyright: string;
  };
  seo: {
    title: string;
    description: string;
  };
}

export type SettingsSection = keyof SiteSettings;
