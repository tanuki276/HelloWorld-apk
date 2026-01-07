export type GeoCoordinates = {
  "@type": "GeoCoordinates";
  latitude: number;
  longitude: number;
};

export type AggregateRating = {
  "@type": "AggregateRating";
  ratingValue?: number;
  reviewCount?: number;
  url?: string;
};

export type AdditionalProperty = {
  "@type": "PropertyValue";
  name: string;
  value: string | number;
  url?: string;
};

export type MapEntity = {
  id?: number;
  name: { [lang: string]: string }; // { ja: "...", en: "..." }
  type: "Place" | "Country" | "City" | "Spot" | "Mountain";
  description?: string;
  url?: string; // "自動登録/手動登録"
  address?: string;
  geo?: GeoCoordinates;
  aggregateRating?: AggregateRating;
  additionalProperty?: AdditionalProperty[];
  metadata?: {
    worksOffline: boolean;
    score: number;
  };
  containedInPlace?: number; // 親ID
};
