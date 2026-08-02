export const projects = [
  {
    id: "ai-recipe-platform",
    title: "AI Recipe Platform",
    category: "Full Stack / AI-Powered Web App",
    shortDescription: "An AI-powered cooking assistant that generates recipes and detects ingredients from your pantry, built with Next.js and Google Gemini API.",
    tags: ["Next.js", "Strapi CMS", "Gemini API", "Arcjet"],
    image: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=800&q=80",
    liveNote: "In development — deployed on GitHub",
    githubUrl: "https://github.com/Nikita-1414",
    caseStudy: {
      overview: "AI Recipe Platform is a full-stack cooking assistant that generates personalized recipes and detects ingredients from a user's pantry using AI, making everyday cooking faster and less wasteful.",
      challenge: "Recipe apps typically rely on static databases, offering the same suggestions to everyone regardless of what ingredients a user actually has on hand or their dietary preferences.",
      approach: "Combined Next.js on the frontend with Strapi 5 as a headless CMS, and integrated the Google Gemini API to generate recipes intelligently based on detected pantry items.",
      solution: "Built pantry-based ingredient detection, a freemium subscription model, recipe bookmarking, and PDF export for saved recipes. Added Arcjet-based rate limiting to prevent API abuse and keep the AI features secure.",
      technologies: ["Next.js", "Strapi 5 CMS", "Google Gemini API", "Arcjet", "REST API"],
      outcome: "Delivered a working AI-driven recipe platform with subscription tiers, export tools, and abuse-prevention built in from day one."
    }
  },
  {
    id: "movie-recommendation-system",
    title: "Movie Recommendation System",
    category: "Content-Based Recommendation Engine",
    shortDescription: "A content-based movie recommendation engine using TF-IDF and cosine similarity, with live data from the TMDB API.",
    tags: ["Python", "FastAPI", "Streamlit", "TMDB API"],
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    githubUrl: "https://github.com/Nikita-1414",
    caseStudy: {
      overview: "A content-based recommendation engine that suggests movies similar to a chosen title, using classic NLP techniques rather than relying purely on collaborative filtering.",
      challenge: "Recommending relevant movies without user rating history requires understanding content similarity directly from metadata like genre, cast, and plot.",
      approach: "Used TF-IDF vectorization on movie metadata and computed cosine similarity scores between titles to rank the closest matches, served through a lightweight FastAPI backend.",
      solution: "Built an interactive Streamlit interface and integrated the TMDB REST API for real-time posters, ratings, and descriptions, so recommendations always show fresh metadata.",
      technologies: ["Python", "FastAPI", "Streamlit", "TF-IDF", "Cosine Similarity", "TMDB REST API"],
      outcome: "Shipped a working recommendation engine demonstrating practical NLP and third-party API integration skills."
    }
  },
  {
    id: "eventsphere",
    title: "EventSphere",
    category: "Full Stack / Event Booking Platform",
    shortDescription: "A MERN-based event booking platform with JWT auth, OTP email verification, and an admin dashboard for managing bookings.",
    tags: ["MongoDB", "Express.js", "React", "Node.js", "JWT"],
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    githubUrl: "https://github.com/Nikita-1414",
    caseStudy: {
      overview: "EventSphere is a full-stack event booking system that lets users discover and book events, while giving admins full control over approvals and seat management.",
      challenge: "Event booking platforms need strong security (to prevent fraudulent sign-ups and bookings) alongside a smooth admin workflow for approving events and tracking seat availability.",
      approach: "Built the system on the MERN stack with JWT-based authentication, bcrypt password hashing, and email OTP verification via Nodemailer to keep accounts secure.",
      solution: "Implemented role-based admin controls, booking approval workflows, real-time seat validation, and an analytics dashboard for administrators to track platform activity.",
      technologies: ["MongoDB", "Express.js", "React", "Node.js", "JWT", "bcrypt", "Nodemailer"],
      outcome: "Delivered a secure, full-featured event booking platform with distinct user and admin experiences."
    }
  }
];
