/** Parsed court data shared by the court map and court-related task flows. */
export type CsvCourt = {
  /** Unique roster key: `courtKey(dropdown)`, or `courtKey(dropdown + name)` when dropdowns collide. */
  key: string;
  name: string;
  dropdown: string;
  lat: number;
  lng: number;
  address: string;
  courtType: string;
  numCourts: number;
  lights: boolean;
  winterPlay: boolean;
  website: string;
  clubInfo: string;
  zone: string;
  bookingUrl?: string | undefined;
};
