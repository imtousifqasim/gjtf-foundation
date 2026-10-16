import siteConfig from "@/lib/siteConfig";

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

export const MAIN_NAV: NavItem[] = [
  {
    label: "About Us",
    href: "/#about-us",
  },
  {
    label: "GJTF Volunteers",
    href: "/about-gjtf-volunteers",
    children: [
      {
        label: "About GJTF Volunteers",
        href: "/about-gjtf-volunteers",
        description: "Our volunteer department, vision, mission and impact areas",
      },
      {
        label: "City Chapter Leads",
        href: "/city-chapter-leads",
        description: "Lead educational movements across university chapters in your city",
      },
      {
        label: "University Chapter",
        href: "/university-chapter",
        description: "Lead campus societies, drives, and volunteer chapters",
      },
      {
        label: "General Volunteer",
        href: "/general-volunteer",
        description: "Flexible, skills-based and one-off volunteering opportunities",
      },
    ],
  },
  {
    label: "Aims and Objectives",
    href: "/aims-and-objectives",
  },
  {
    label: "Our Work",
    href: "/our-school",
    children: [
      {
        label: "Our Schools",
        href: "/our-school",
        description: "Explore our nationwide network of school units across Pakistan",
      },
    ],
  },
  {
    label: "Blogs",
    href: "/blogs",
  },
  {
    label: "Contact Us",
    href: "/contact-us",
  },
];

export const SOCIAL_LINKS = [
  { name: "Instagram", href: siteConfig.socials.instagram, icon: "instagram" },
  { name: "TikTok", href: siteConfig.socials.tiktok, icon: "tiktok" },
  { name: "YouTube", href: siteConfig.socials.youtube, icon: "youtube" },
  { name: "Facebook", href: siteConfig.socials.facebook, icon: "facebook" },
];

export const CONTACT_INFO = {
  headOffice: {
    title: "GJTF Head Office - Lahore",
    contactPerson: "GJTF Support Team",
    address: siteConfig.address,
    email: siteConfig.email.address,
    secondaryEmail: "gjtfoundation1@gmail.com",
    telephone: siteConfig.phone1.number,
    mobile: siteConfig.phone2.number,
    supportHours: siteConfig.supportHours,
  },
  regionalOffices: [
    {
      city: "Lahore Regional Contact",
      contactPerson: "Umer Shahid",
      address: "Plot # 91, Block – C, Broadway Road, Phase VIII, DHA Lahore, Pakistan",
      email: siteConfig.email.address,
      phone: "+92-42-37135871",
    },
    {
      city: "Islamabad / Rawalpindi Regional Contact",
      contactPerson: "Mizhgan Kirmani & Anas Hussain",
      address: "Regional Office near Fazia Colony, Service Road, Gangal West Rawalpindi",
      email: "gjtfoundation1@gmail.com",
      phone: "+92-51-4578229",
    },
  ],
  bankDetails: {
    bankName: siteConfig.bankAccount.bankName,
    accountTitle: siteConfig.bankAccount.accountTitle,
    accountNumber: siteConfig.bankAccount.accountNumber,
    iban: siteConfig.bankAccount.iban,
    branch: siteConfig.bankAccount.branch,
    swiftCode: siteConfig.bankAccount.swift,
  },
};
