export type Listing = {
  id: string;
  title: string;
  type: string;
  area: string;
  price: number;
  image: string;
  verified: boolean;
  agentId: string;
  images?: { id: string; url: string; isPrimary: boolean; sortOrder: number }[];
  // Room details
  roomSize?: number | null;
  numberOfRooms?: number | null;
  furnished?: boolean;
  floorLevel?: number | null;
  // Rules & preferences
  genderPreference?: string;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  maxTenants?: number | null;
  // Pricing details
  depositAmount?: number | null;
  utilitiesIncluded?: boolean;
  leaseDuration?: string | null;
  // Amenities
  amenities?: { name: string; slug: string }[];
};

export const listings: Listing[] = [
  { id: "njiro-garden-room", title: "Garden studio near Tengeru Road", type: "Self-contained", area: "Njiro", price: 180000, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82", verified: true, agentId: "mwanaisha-homes" },
  { id: "njiro-shared-flat", title: "Bright room in a shared flat", type: "Private room", area: "Njiro", price: 150000, image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82", verified: true, agentId: "mwanaisha-homes" },
  { id: "olorien-courtyard", title: "Quiet courtyard apartment", type: "One bedroom", area: "Olorien", price: 240000, image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82", verified: true, agentId: "arusha-keys" },
  { id: "sakina-student-room", title: "Compact student room with Wi-Fi", type: "Single room", area: "Sakina", price: 130000, image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=82", verified: false, agentId: "arusha-keys" },
];
