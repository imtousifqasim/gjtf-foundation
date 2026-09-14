/**
 * Central Media Asset Directory
 * 
 * Every image and video across the entire GJTF site is mapped here.
 * To update any image or video, simply replace the URL in this single file.
 * Each entry is commented with the exact page and section it belongs to.
 */

export const media = {
  // -------------------------------------------------------------
  // HOME PAGE (/)
  // -------------------------------------------------------------
  home: {
    // Hero Section background - Pakistani children in a bright classroom setting
    heroImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1920&auto=format&fit=crop",
    // Hero background video fallback/poster
    heroVideoPoster: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1920&auto=format&fit=crop",
    // Hero background YouTube video (Jhuggi Taleemi Project official video)
    heroYouTubeId: "nyZjxfqfu-c",
    heroYouTubeUrl: "https://www.youtube.com/watch?v=nyZjxfqfu-c",
    heroVideoStartTime: 100, // Starts at 1 minute 40 seconds (100s)
    // About Section - Official photo of educator with children in slum classroom
    aboutSectionImage: "https://gjtfoundation.com/wp-content/uploads/2025/06/WhatsApp-Image-2022-08-21-at-10.32.19-PM-1.jpeg",
    // Our Model Section - Official photo of Jhuggi Taleemi Project students
    ourModelImage: "https://gjtfoundation.com/wp-content/uploads/2025/06/2-scaled.jpeg",
    // Real School Campus Units
    faisalabadSchoolImage: "https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg",
    raiwindSchoolImage: "https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg",
    
    // Education Programmes Section (3 cards)
    educationProgrammes: {
      // 1. "Connecting with Jhuggi Nasheen children to make them comfortable"
      connecting: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=900&auto=format&fit=crop",
      // 2. "Making learning enjoyable to encourage school attendance"
      learningEnjoyable: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=900&auto=format&fit=crop",
      // 3. "Passionate educators working hard to teach and mentor students"
      passionateEducators: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=900&auto=format&fit=crop",
    },

    // Volunteer Program Section (5 cards bento grid)
    volunteerProgram: {
      // 1. "Students from partnered universities join our initiatives"
      universityStudents: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=900&auto=format&fit=crop",
      // 2. "Assisting in teaching and mentoring Jhuggi Nasheen children"
      teachingMentoring: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=900&auto=format&fit=crop",
      // 3. "Conducting workshops on vocational training and soft skills"
      workshops: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=900&auto=format&fit=crop",
      // 4. "Organizing awareness sessions and interactive events"
      awarenessEvents: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=900&auto=format&fit=crop",
      // 5. "Encouraging youth to contribute to social change"
      youthChange: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=900&auto=format&fit=crop",
    },

    // Community Services Section (4 cards bento grid)
    communityServices: {
      // 1. Vocational Centers - stitching and handicrafts
      vocationalCenters: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=900&auto=format&fit=crop",
      // 2. Small Business Support - helping youth start businesses
      smallBusiness: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=900&auto=format&fit=crop",
      // 3. Computer Skills Training - digital literacy on tablets/PCs
      computerSkills: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop",
      // 4. Youth Empowerment - self-sufficiency and financial stability
      youthEmpowerment: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=900&auto=format&fit=crop",
    },

    // Photo Gallery Section (4 original full-res website images)
    galleryImages: [
      "https://gjtfoundation.com/wp-content/uploads/2025/06/WhatsApp-Image-2022-08-21-at-10.32.19-PM-1.jpeg",
      "https://gjtfoundation.com/wp-content/uploads/2025/06/2-scaled.jpeg",
      "https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg",
      "https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg",
    ],

    // Success Stories Video Showcase (Local MP4s)
    successStoryVideos: [
      {
        id: "vid-001",
        title: "GJTF Success Stories: Transforming Lives",
        category: "Success Stories",
        description: "Real journeys of slum children gaining knowledge, dignity, and building a brighter future through Jhuggi Taleemi Project.",
        videoUrl: "https://github.com/imtousifqasim/gjtf-foundation/releases/download/v1.0.0-media/Succesful-stories.mp4",
        posterUrl: "https://gjtfoundation.com/wp-content/uploads/2025/06/WhatsApp-Image-2022-08-21-at-10.32.19-PM-1.jpeg",
      },
      {
        id: "vid-002",
        title: "Community Elder & Parent Testimonial",
        category: "Community Review",
        description: "Heartfelt feedback from a slum settlement elder and parent on the profound community change brought by GJTF schools.",
        videoUrl: "https://github.com/imtousifqasim/gjtf-foundation/releases/download/v1.0.0-media/Uncle-review.mp4",
        posterUrl: "https://gjtfoundation.com/wp-content/uploads/2025/06/Faisalbad-School-scaled.jpg",
      },
      {
        id: "vid-003",
        title: "Sajid's Inspirational Journey",
        category: "Student Story",
        description: "From informal street labor to academic excellence — Sajid shares his personal transformation story.",
        videoUrl: "https://github.com/imtousifqasim/gjtf-foundation/releases/download/v1.0.0-media/Sajid-Story.mp4",
        posterUrl: "https://gjtfoundation.com/wp-content/uploads/2025/06/2-scaled.jpeg",
      },
      {
        id: "vid-004",
        title: "Women's Vocational Stitching Center",
        category: "Vocational Training",
        description: "Empowering mothers and adolescent girls in nomadic settlements with sewing skills and financial self-sufficiency.",
        videoUrl: "https://github.com/imtousifqasim/gjtf-foundation/releases/download/v1.0.0-media/Stiching.mp4",
        posterUrl: "https://gjtfoundation.com/wp-content/uploads/2025/06/Raiwind-school-3.jpeg",
      },
    ],
  },

  // -------------------------------------------------------------
  // CITY CHAPTER LEADS (/city-chapter-leads)
  // -------------------------------------------------------------
  cityChapterLeads: {
    // Featured Hero Header image
    heroImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop",
    // Leadership section highlight
    leadershipTeam: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=1200&auto=format&fit=crop",
  },

  // -------------------------------------------------------------
  // UNIVERSITY CHAPTER (/university-chapter)
  // -------------------------------------------------------------
  universityChapter: {
    // Campus society leadership hero
    heroImage: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1600&auto=format&fit=crop",
    // Student volunteers collaboration
    campusDrive: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop",
  },

  // -------------------------------------------------------------
  // GENERAL VOLUNTEER (/general-volunteer)
  // -------------------------------------------------------------
  generalVolunteer: {
    // Community volunteering hero
    heroImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1600&auto=format&fit=crop",
    // Mentorship & teaching in slums
    mentoringField: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop",
  },

  // -------------------------------------------------------------
  // AIMS AND OBJECTIVES (/aims-and-objectives)
  // -------------------------------------------------------------
  aimsAndObjectives: {
    heroBanner: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1600&auto=format&fit=crop",
    digitalTabletsSection: "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=1200&auto=format&fit=crop",
    sewingCenterSection: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
  },

  // -------------------------------------------------------------
  // OUR SCHOOL (/our-school & /school/[slug])
  // -------------------------------------------------------------
  ourSchool: {
    heroBanner: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600&auto=format&fit=crop",
    // Pakistan map illustration reference (used if SVG overlay isn't rendered directly)
    pakistanMapImage: "https://images.unsplash.com/photo-1524654458049-e36be0721fa2?q=80&w=1200&auto=format&fit=crop",
    schools: {
      "meghani-family-campus-primary-morning": {
        // School directory card thumbnail
        cardImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1000&auto=format&fit=crop",
        // School detail page hero banner
        heroImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800&auto=format&fit=crop",
        // School detail page gallery images
        galleryImages: [
          "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=900&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=900&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=900&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=900&auto=format&fit=crop",
        ],
      },
    },
  },

  // -------------------------------------------------------------
  // SUCCESS STORIES (/news-stories & /news-stories/[slug])
  // -------------------------------------------------------------
  newsStories: {
    // 1. Khan Academy Partnership / AI-powered education
    khanAcademyPartnership: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop",
    // 2. Sadia's Path from GJTF Graduate to Police Officer
    sadiaPoliceOfficer: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=900&auto=format&fit=crop",
    // 3. 'My fate changed when I came to GJTF' - Asad's journey
    myFateChanged: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=900&auto=format&fit=crop",
    // 4. CM Murad Ali Shah lauds GJTF efforts
    cmMuradAliShah: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=900&auto=format&fit=crop",
    // 5. Mahira Khan's heartfelt appeal to support GJTF
    mahiraKhanAppeal: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=900&auto=format&fit=crop",
    // 6. Witness Change in Action! (Video thumbnail)
    witnessChangeVideo: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=900&auto=format&fit=crop",
  },

  // -------------------------------------------------------------
  // DONATE NOW (/donate-now)
  // -------------------------------------------------------------
  donateNow: {
    // Hero banner at top of donation page
    heroBanner: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1920&auto=format&fit=crop",
  },

  // -------------------------------------------------------------
  // CONTACT US (/contact-us)
  // -------------------------------------------------------------
  contactUs: {
    // Google Maps embed URL
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3403.486847775988!2d74.31688197626938!3d31.47953254964654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3919041ecfa73507%3A0x6b3017bbcb866ec5!2sNew%20Liberty%20Tower%2C%20Model%20Town%20Link%20Rd%2C%20Lahore!5e0!3m2!1sen!2s!4v1710000000000!5m2!1sen!2s",
  },

  // -------------------------------------------------------------
  // SHARED & BRAND ASSETS
  // -------------------------------------------------------------
  shared: {
    // Main Brand Logo (color)
    logo: "/images/gjtf-logo.png",
    // Logo for dark/footer backgrounds
    logoWhite: "/images/gjtf-logo-white.png",
    // Default avatar placeholder
    defaultAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
  },
} as const;

export type MediaCollection = typeof media;
