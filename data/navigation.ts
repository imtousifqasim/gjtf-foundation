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
        description: "Explore our nationwide network of 2,033 school units",
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
  { name: "Facebook", href: "https://facebook.com/gjtfoundation", icon: "facebook" },
  { name: "Instagram", href: "https://instagram.com/gjtfoundation", icon: "instagram" },
  { name: "YouTube", href: "https://youtube.com/@gjtfoundation", icon: "youtube" },
  { name: "TikTok", href: "https://tiktok.com/@gjtfoundation", icon: "tiktok" },
  { name: "Twitter", href: "https://x.com/gjtfoundation", icon: "twitter" },
];

export const CONTACT_INFO = {
  headOffice: {
    title: "GJTF Head Office - Lahore",
    contactPerson: "Asra Ahmed",
    address: "Office # 46-47 First Floor, New Liberty Tower, Model Town Link Road, Lahore",
    email: "jhuggitaleemiproject@gmail.com",
    secondaryEmail: "gjtfoundation1@gmail.com",
    telephone: "04235236622",
    mobile: "+923033934771",
    tollFree: "0800-00823",
  },
  regionalOffices: [
    {
      city: "Lahore Regional Contact",
      contactPerson: "Umer Shahid",
      address: "Plot # 91, Block – C, Broadway Road, Phase VIII, DHA Lahore, Pakistan",
      email: "jhuggitaleemiproject@gmail.com",
      phone: "+92-42-37135871",
    },
    {
      city: "Islamabad / Rawalpindi Regional Contact",
      contactPerson: "Mizhgan Kirmani & Anas Hussain",
      address: "Regional Office near Fazia Colony, Service Road, Gangal West Rawalpindi",
      email: "gjtfoundation1@gmail.com",
      phone: "+92-51-4578229",
      tollFree: "0800-00823",
    },
  ],
  bankDetails: {
    bankName: "Meezan Bank Limited",
    accountTitle: "Ghais Jhuggi Taleem Foundation",
    accountNumber: "02010103847291",
    iban: "PK72MEZN0002010103847291",
    branch: "Model Town Link Road Branch, Lahore",
    swiftCode: "MEZNPKKA",
  },
};
