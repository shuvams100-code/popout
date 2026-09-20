export type Pin = {
  kind: "popout" | "event";
  id: string;
  title: string;
  venue: string;
  lat: number;
  lng: number;
  startsAt: string;
  // popout
  filled?: number;
  max?: number;
  host?: { id: string; name: string; verified: boolean; gender: string | null; hosted: number; noShows: number };
  verifiedOnly?: boolean;
  genderPref?: "anyone" | "women_only" | "men_only";
  women?: number; // members (incl. host) who are women
  men?: number;
  eventId?: string | null;
  // event
  price?: string | null;
};

export const INDIRANAGAR = { lat: 12.9716, lng: 77.6412 };

// ponytail: constant, not a column. Safety floor said 3; user chose 2.
export const MIN_PEOPLE = 2;

