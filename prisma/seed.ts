import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.supabase_session_pooler;

if (!connectionString) {
  throw new Error("supabase_session_pooler must be set before seeding the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const agentUser = {
  email: "demo.agent@nyumbanearby.test",
  firstName: "Mwanaisha",
  lastName: "Homes",
};

const seedListings = [
  {
    title: "Garden studio near Tengeru Road",
    type: "Self-contained",
    area: "Njiro",
    address: "Tengeru Road, Njiro",
    rentAmount: 180000,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82",
    verified: true,
  },
  {
    title: "Bright room in a shared flat",
    type: "Private room",
    area: "Njiro",
    address: "Njiro Market Road",
    rentAmount: 150000,
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82",
    verified: true,
  },
  {
    title: "Quiet courtyard apartment",
    type: "One bedroom",
    area: "Olorien",
    address: "Olorien Road",
    rentAmount: 240000,
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82",
    verified: true,
  },
  {
    title: "Compact student room with Wi-Fi",
    type: "Single room",
    area: "Sakina",
    address: "Sakina Student Area",
    rentAmount: 130000,
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=82",
    verified: false,
  },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: agentUser.email },
    update: agentUser,
    create: { ...agentUser, role: "AGENT" },
  });

  const agent = await prisma.agentProfile.upsert({
    where: { userId: user.id },
    update: { businessName: "Mwanaisha Homes", verification: "VERIFIED" },
    create: {
      userId: user.id,
      businessName: "Mwanaisha Homes",
      bio: "A local housing agent helping students find homes around Arusha.",
      verification: "VERIFIED",
    },
  });

  await prisma.university.upsert({
    where: { slug: "nelson-mandela-african-institution-of-science-and-technology" },
    update: { name: "Nelson Mandela African Institution of Science and Technology" },
    create: {
      name: "Nelson Mandela African Institution of Science and Technology",
      slug: "nelson-mandela-african-institution-of-science-and-technology",
      city: "Arusha",
    },
  });

  for (const seedListing of seedListings) {
    const property = await prisma.property.findFirst({
      where: { title: seedListing.title, area: seedListing.area },
    }) ?? await prisma.property.create({
      data: {
        title: seedListing.title,
        propertyType: seedListing.type,
        address: seedListing.address,
        area: seedListing.area,
      },
    });

    const listing = await prisma.listing.findFirst({
      where: { title: seedListing.title, agentId: agent.id },
    }) ?? await prisma.listing.create({
      data: {
        propertyId: property.id,
        agentId: agent.id,
        title: seedListing.title,
        rentAmount: seedListing.rentAmount,
        propertyType: seedListing.type,
        status: "ACTIVE",
        verificationStatus: seedListing.verified ? "VERIFIED" : "UNVERIFIED",
        publishedAt: new Date(),
      },
    });

    await prisma.listingImage.upsert({
      where: { id: `${listing.id}-primary` },
      update: { url: seedListing.image },
      create: {
        id: `${listing.id}-primary`,
        listingId: listing.id,
        url: seedListing.image,
        storageKey: `seed/${listing.id}/primary`,
        isPrimary: true,
      },
    });
  }

  console.log(`Seeded ${seedListings.length} listings for ${agent.businessName}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
