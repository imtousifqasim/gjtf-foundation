import { media } from "./media";

export interface School {
  id: string;
  slug: string;
  name: string;
  campusType: "Primary" | "Secondary";
  shift: "Morning" | "Afternoon";
  city: string;
  province: "Sindh" | "Punjab" | "Khyber Pakhtunkhwa" | "Balochistan" | "Islamabad";
  areaSqFt: number;
  classrooms: number;
  studentCapacity: number;
  currentStudents: number;
  establishedYear: number;
  description: string;
  facilities: string[] | readonly string[];
  cardImage: string;
  heroImage: string;
  galleryImages: string[] | readonly string[];
  featured: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const schools: School[] = [
  {
    id: "sch-001",
    slug: "meghani-family-campus-primary-morning",
    name: "Meghani Family Campus Primary Morning",
    campusType: "Primary",
    shift: "Morning",
    city: "Karachi",
    province: "Sindh",
    areaSqFt: 6500,
    classrooms: 6,
    studentCapacity: 180,
    currentStudents: 172,
    establishedYear: 2017,
    description:
      "A flagship GJTF landmark campus dedicated to educating nomadic and slum-dwelling children in Karachi. The school offers airy, sunlit classrooms, an administrative block, activity library, digital learning tablet lab, and a safe outdoor playground.",
    facilities: [
      "Airy & Well-Lit Classrooms",
      "Administrative Block",
      "Digital Tablet Learning Corner",
      "Child Activity Library",
      "Enclosed Playground",
      "Clean Drinking Water & Sanitation",
      "First Aid Station",
      "Nutritional Meal Support",
    ],
    cardImage: media.ourSchool.schools["meghani-family-campus-primary-morning"].cardImage,
    heroImage: media.ourSchool.schools["meghani-family-campus-primary-morning"].heroImage,
    galleryImages: [...media.ourSchool.schools["meghani-family-campus-primary-morning"].galleryImages],
    featured: true,
    coordinates: { lat: 24.8607, lng: 67.0011 },
  },
  {
    id: "sch-002",
    slug: "lahore-model-town-jhuggi-unit-1",
    name: "Lahore Model Town Jhuggi Campus",
    campusType: "Primary",
    shift: "Morning",
    city: "Lahore",
    province: "Punjab",
    areaSqFt: 5800,
    classrooms: 5,
    studentCapacity: 150,
    currentStudents: 144,
    establishedYear: 2015,
    description:
      "Established right at the heart of nomadic settlements in Lahore, this school unit has empowered dozens of families to break out of generational poverty through primary education and vocational craft programs.",
    facilities: [
      "Modular Weatherproof Classrooms",
      "Sewing & Vocational Center for Mothers",
      "Digital Tablet Lab",
      "Reading & Storytelling Corner",
      "Daily Nutritional Meal",
      "Solar Powered Lighting",
    ],
    cardImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1800&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=900&auto=format&fit=crop",
    ],
    featured: true,
    coordinates: { lat: 31.4795, lng: 74.3169 },
  },
  {
    id: "sch-003",
    slug: "faisalabad-settlement-campus",
    name: "Faisalabad Settlement Learning Campus",
    campusType: "Primary",
    shift: "Afternoon",
    city: "Faisalabad",
    province: "Punjab",
    areaSqFt: 6200,
    classrooms: 6,
    studentCapacity: 180,
    currentStudents: 165,
    establishedYear: 2018,
    description:
      "Equipped with modern learning tablets and interactive learning resources, this campus serves children who previously worked in brick kilns and scrap collection, restoring their right to childhood.",
    facilities: [
      "Well-Ventilated Classrooms",
      "Digital Literacy Lab",
      "Activity Playground",
      "Uniform & Stationery Corner",
      "Community Counseling Hall",
    ],
    cardImage: "https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg",
    heroImage: "https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg",
    galleryImages: [
      "https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=900&auto=format&fit=crop",
    ],
    featured: true,
    coordinates: { lat: 31.4504, lng: 73.135 },
  },
  {
    id: "sch-004",
    slug: "raiwind-school-campus",
    name: "GJTF Raiwind School Campus",
    campusType: "Primary",
    shift: "Morning",
    city: "Raiwind",
    province: "Punjab",
    areaSqFt: 5500,
    classrooms: 5,
    studentCapacity: 160,
    currentStudents: 152,
    establishedYear: 2019,
    description:
      "A dedicated community school unit in Raiwind providing high-quality primary education and free learning kits directly to nomadic settlement children.",
    facilities: [
      "5 Solar-Equipped Classrooms",
      "Digital Tablet Learning Station",
      "Play Area & Sports Field",
      "Clean Drinking Water Unit",
    ],
    cardImage: "https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg",
    heroImage: "https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg",
    galleryImages: [
      "https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=900&auto=format&fit=crop",
    ],
    featured: true,
    coordinates: { lat: 31.248, lng: 74.215 },
  },
  {
    id: "sch-005",
    slug: "sheikhupura-jhuggi-taleemi-center",
    name: "Sheikhupura Jhuggi Taleemi Center",
    campusType: "Primary",
    shift: "Morning",
    city: "Sheikhupura",
    province: "Punjab",
    areaSqFt: 6000,
    classrooms: 5,
    studentCapacity: 150,
    currentStudents: 138,
    establishedYear: 2019,
    description:
      "A vibrant rural and semi-urban learning hub where nomadic students receive high-standard early education alongside seasonal warmth clothing, health screenings, and moral guidance.",
    facilities: [
      "5 Airy Classrooms",
      "Science and Nature Corner",
      "Digital Tablets for Learning",
      "Clean Drinking Water Unit",
      "Playground with Sports Gear",
    ],
    cardImage: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=900&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1800&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=900&auto=format&fit=crop",
    ],
    featured: false,
    coordinates: { lat: 31.7167, lng: 73.985 },
  },
  {
    id: "sch-006",
    slug: "rawalpindi-islamabad-sub-campus",
    name: "Rawalpindi Gangal West Campus",
    campusType: "Secondary",
    shift: "Morning",
    city: "Rawalpindi",
    province: "Punjab",
    areaSqFt: 9000,
    classrooms: 5,
    studentCapacity: 180,
    currentStudents: 168,
    establishedYear: 2021,
    description:
      "Our premier secondary school facility preparing older nomadic youth for Matriculation examinations, technical skills, and transition into colleges and professional apprenticeships.",
    facilities: [
      "5 Large Secondary Classrooms (36 capacity each)",
      "Science & Physics/Chemistry Demo Corner",
      "Full Computer Lab",
      "Career Guidance Counseling",
      "Sports Ground",
    ],
    cardImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=900&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900&auto=format&fit=crop",
    ],
    featured: false,
    coordinates: { lat: 33.5973, lng: 73.0479 },
  },
  {
    id: "sch-007",
    slug: "jallo-pind-campus-lahore",
    name: "GJTF Jallo Pind Campus",
    campusType: "Primary",
    shift: "Morning",
    city: "Lahore",
    province: "Punjab",
    areaSqFt: 5200,
    classrooms: 5,
    studentCapacity: 150,
    currentStudents: 142,
    establishedYear: 2018,
    description:
      "Located in the outskirts of Lahore near Jallo, this campus provides free holistic education, uniform, and books to children living in temporary jhuggi settlements.",
    facilities: [
      "Classrooms with Solar Power",
      "Drinking Water Filtration Unit",
      "Digital Learning Lab",
      "Art and Storytelling Hall",
      "Sports Field",
    ],
    cardImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1800&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=900&auto=format&fit=crop",
    ],
    featured: true,
    coordinates: { lat: 31.5833, lng: 74.4833 },
  },
];

export function getSchoolBySlug(slug: string): School | undefined {
  return schools.find((s) => s.slug === slug);
}
