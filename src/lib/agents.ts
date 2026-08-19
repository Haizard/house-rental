export type Agent = { id: string; businessName: string; bio: string; photo: string; rating: number; reviews: number; verified: boolean; activeListings: number };

export const agents: Agent[] = [
  { id: "mwanaisha-homes", businessName: "Mwanaisha Homes", bio: "Student-focused homes around Njiro and Tengeru Road. Clear details, honest availability, and viewings arranged around your schedule.", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80", rating: 4.8, reviews: 23, verified: true, activeListings: 2 },
  { id: "arusha-keys", businessName: "Arusha Keys", bio: "Helping students find practical rooms and apartments in Njiro, Olorien, and Sakina.", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80", rating: 4.6, reviews: 17, verified: true, activeListings: 2 },
];
