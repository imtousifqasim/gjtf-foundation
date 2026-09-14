import { media } from "./media";

export type StoryCategory = "Blogs" | "Events" | "Success Stories" | "GJTF in Media" | "Videos";

export interface Story {
  id: string;
  slug: string;
  title: string;
  category: StoryCategory;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  coverImage: string;
  videoUrl?: string;
  author: {
    name: string;
    role: string;
  };
  content: string[];
}

export const stories: Story[] = [
  {
    id: "story-001",
    slug: "khan-academy-partnership",
    title: "GJTF Partners with Khan Academy for AI-Powered Learning",
    category: "Blogs",
    excerpt: "An AI-powered innovative collaboration to support teachers and enhance learning outcomes for slum students.",
    publishedAt: "January 15, 2025",
    readTime: "4 min read",
    coverImage: media.newsStories.khanAcademyPartnership,
    author: {
      name: "GJTF Academic Team",
      role: "Curriculum & Innovation",
    },
    content: [
      "In a monumental milestone for nomadic education in Pakistan, Ghais Jhuggi Taleem Foundation (GJTF) has announced a dynamic partnership with Khan Academy. This initiative introduces localized, AI-powered interactive learning tools tailored specifically for children residing in nomadic settlements ('Jhuggi Nasheen').",
      "Through this collaboration, teachers across GJTF's school units in Lahore, Karachi, and Faisalabad are equipped with real-time diagnostics and bilingual instructional tools. Even children with zero prior literacy exposure can advance at their own pace, building confidence in foundational mathematics and Urdu comprehension.",
      "'Every child, regardless of whether their home is a tent or a concrete building, deserves access to world-class learning tools,' stated the foundation's academic lead. Early trials indicate a 40% improvement in concept retention among primary students.",
    ],
  },
  {
    id: "story-002",
    slug: "sadia-police-officer",
    title: "Sadia's Path from GJTF Graduate to Police Officer",
    category: "Success Stories",
    excerpt: "Amidst the rhythmic chaos of the police station, Sadia calmly takes control of the unpredictable days.",
    publishedAt: "November 28, 2024",
    readTime: "5 min read",
    coverImage: media.newsStories.sadiaPoliceOfficer,
    author: {
      name: "Communications Desk",
      role: "GJTF Stories",
    },
    content: [
      "Ten years ago, Sadia's morning routine involved helping her mother gather scrap materials along the highway perimeter. Today, dressed in a crisp uniform, Sub-Inspector Sadia commands respect and brings justice to her district.",
      "Sadia was among the early batches of young girls enrolled when GJTF set up its makeshift learning tent in her settlement. Overcoming severe societal skepticism and financial hurdles, she completed her matriculation and intermediate studies with top honors under GJTF's mentorship.",
      "'GJTF did not just teach me the alphabet; they taught me that my background does not define my destiny. When you educate a girl from the slums, you emancipate an entire family from silence,' Sadia reflects with a confident smile.",
    ],
  },
  {
    id: "story-003",
    slug: "my-fate-changed-asad",
    title: "'My fate changed when I came to GJTF' — Asad's Journey",
    category: "Success Stories",
    excerpt: "Meet Asad, an alumnus from Old Muzaffarabad Colony, a low-income town in Landhi, Karachi.",
    publishedAt: "October 14, 2024",
    readTime: "4 min read",
    coverImage: media.newsStories.myFateChanged,
    author: {
      name: "Alumni Network",
      role: "GJTF Karachi",
    },
    content: [
      "Asad still vividly remembers the day a GJTF volunteer sat down in his tent community in Landhi, holding out a colorful picture book and a clean slate. Before that day, education felt like an unimaginable luxury reserved for wealthy city dwellers.",
      "Through persistent guidance from passionate volunteer teachers, Asad discovered a deep affinity for mathematics and problem-solving. Supported by GJTF's scholarship and digital tablet program, he progressed through secondary school and is now pursuing a bachelor's degree in Software Engineering.",
      "'My father drove a donkey cart for forty years. Today, I am building mobile applications. GJTF did not just change my fate; they rewrote our family's entire legacy for generations to come,' Asad shares.",
    ],
  },
  {
    id: "story-004",
    slug: "cm-murad-ali-shah-lauds-gjtf",
    title: "CM Murad Ali Shah lauds GJTF efforts for educating less-privileged children",
    category: "GJTF in Media",
    excerpt: "A collaboration with the Ramon Magsaysay Award Foundation hosted an event in Karachi.",
    publishedAt: "September 02, 2024",
    readTime: "3 min read",
    coverImage: media.newsStories.cmMuradAliShah,
    author: {
      name: "Media Relations",
      role: "Press Release",
    },
    content: [
      "Sindh Chief Minister Murad Ali Shah commended the relentless efforts of Ghais Jhuggi Taleem Foundation (GJTF) in mainstreaming out-of-school nomadic youth during an educational symposium in Karachi.",
      "The Chief Minister highlighted GJTF's innovative approach of embedding weatherproof classrooms and mobile educational units directly inside slum colonies, removing logistical barriers that traditionally prevented children from attending conventional schools.",
      "Provincial officials pledged enhanced coordination with civil society initiatives like GJTF to accelerate out-of-school children reintegration across Sindh.",
    ],
  },
  {
    id: "story-005",
    slug: "mahira-khan-appeal",
    title: "Mahira Khan's heartfelt appeal to support GJTF this Ramzan",
    category: "Events",
    excerpt: "Renowned Pakistani actor urges support this Ramzan to light up a child's world with education.",
    publishedAt: "March 10, 2024",
    readTime: "3 min read",
    coverImage: media.newsStories.mahiraKhanAppeal,
    author: {
      name: "Campaign Desk",
      role: "Community Outreach",
    },
    content: [
      "Celebrated cultural icon and philanthropist Mahira Khan has issued a poignant video appeal encouraging overseas Pakistanis and nationwide donors to direct their Zakat and Sadqah towards GJTF's Jhuggi Taleemi Project.",
      "'When you witness these little children holding their school bags in the middle of nomadic settlements with sparkles in their eyes, you realize how powerful hope is. GJTF is giving them not just pencils and books, but a dignified future,' she highlighted.",
      "Her appeal helped drive vital contributions towards opening 50 new classroom units and distributing winter uniforms across nomadic settlements.",
    ],
  },
  {
    id: "story-006",
    slug: "witness-change-in-action",
    title: "Witness Change in Action: A Decade of Uplifting 20 Million Nomads",
    category: "Videos",
    excerpt: "What education makes possible is truly remarkable — hope given today grows into tomorrow's miracles.",
    publishedAt: "January 05, 2024",
    readTime: "Video Doc (6 min)",
    coverImage: media.newsStories.witnessChangeVideo,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: {
      name: "GJTF Media Cell",
      role: "Documentary Production",
    },
    content: [
      "Step behind the scenes with our documentary team as we travel across 24 cities in Pakistan — from the shifting sands of Sindh to the outskirts of Lahore and Faisalabad.",
      "This mini-documentary captures the daily life of Jhuggi Nasheen children, the dedication of our volunteer educators, and the transformative ripple effect that literacy has on entire slum communities.",
      "Every smile, every recited poem, and every graduation cap tells a story of perseverance against all odds. Watch the full feature and share with your community.",
    ],
  },
];

export function getStoryBySlug(slug: string): Story | undefined {
  return stories.find((s) => s.slug === slug);
}
