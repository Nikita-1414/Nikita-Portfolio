/**
 * Studio Content Data
 * 
 * Custom content for Nikita's monitor towers.
 */

export const PLATFORM_CONFIG = {
    youtube: {
        color: '#FF0000',
        accentColor: '#cc0000',
        icon: '▶',
        label: 'Tech Video',
        shape: 'tv', // Wide CRT style
    },
    blog: {
        color: '#eab308',
        accentColor: '#ca8a04',
        icon: '📝',
        label: 'Case Study',
        shape: 'monitor', // Thin desktop monitor
    },
    tiktok: {
        color: '#00F2EA',
        accentColor: '#FF0050',
        icon: '📱',
        label: 'Micro Log',
        shape: 'phone', // Vertical phone
    },
    linkedin: {
        color: '#0077B5',
        accentColor: '#005E93',
        icon: 'in',
        label: 'Milestone',
        shape: 'monitor',
    },
    codrops: {
        color: '#0099FF',
        accentColor: '#0077CC',
        icon: '💧',
        label: 'Featured',
        shape: 'monitor',
    },
};

const RAW_CONTENT_DATA = [
    // ============ Case Studies / Projects ============
    {
        id: 'studio-ai-recipe',
        platform: 'blog',
        title: 'AI Recipe Platform: AI-Powered Cooking Assistant',
        description: 'Built a full-stack AI recipe platform using Next.js, Strapi 5 CMS, and Google Gemini API for intelligent recipe generation and pantry-based ingredient detection, with a freemium subscription model, bookmarking, and PDF export.',
        frontTexture: '/textures/studio/monitorfront_postnafbdoublewinner.webp',
        paintedFrontTexture: '/textures/studio/monitorfront_postnafbdoublewinner_painted.webp',
        thumbnail: null,
        url: 'https://github.com/Nikita-1414',
        date: '2026-03-24',
        readTime: '6 min',
    },
    {
        id: 'studio-movie-rec',
        platform: 'blog',
        title: 'Movie Recommendation System: Content-Based Engine',
        description: 'Developed a content-based recommendation engine using Python, FastAPI, and Streamlit with TF-IDF vectorization and cosine similarity, integrated with the TMDB REST API for real-time movie metadata.',
        frontTexture: '/textures/studio/tvfront_filmikprojektdlamultiego.webp',
        paintedFrontTexture: '/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp',
        thumbnail: null,
        url: 'https://github.com/Nikita-1414',
        date: '2026-02-15',
        readTime: '8 min',
    },
    {
        id: 'studio-eventsphere',
        platform: 'blog',
        title: 'EventSphere: Full Stack Event Booking Platform',
        description: 'Built a MERN-based event booking system with JWT authentication, bcrypt password security, and email OTP verification. Implemented role-based admin controls, booking approval workflows, and an analytics dashboard.',
        frontTexture: '/textures/studio/tvfront_filmikedytowaniezdjec.webp',
        paintedFrontTexture: '/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp',
        thumbnail: null,
        url: 'https://github.com/Nikita-1414',
        date: '2026-01-10',
        readTime: '10 min',
    },
    {
        id: 'studio-hackathons',
        platform: 'linkedin',
        title: 'Winner in 3+ Hackathons',
        description: 'Built innovative software solutions under time-constrained competitive environments, demonstrating problem-solving, teamwork, and rapid development skills.',
        thumbnail: null,
        url: 'https://linkedin.com/in/nikita-chaurasia14',
        date: '2025-12-18',
        readTime: '5 min',
    },
    {
        id: 'studio-mern-cert',
        platform: 'linkedin',
        title: 'Certification: MERN Stack with DSA — Apna College',
        description: 'Completed an in-depth certification covering the MERN stack alongside Data Structures and Algorithms fundamentals.',
        thumbnail: null,
        url: 'https://linkedin.com/in/nikita-chaurasia14',
        date: '2025-11-28',
        readTime: '7 min',
    },
    {
        id: 'studio-ml-cert',
        platform: 'linkedin',
        title: 'Certification: Machine Learning — Samsung Innovation Campus',
        description: 'Completed the Samsung Innovation Campus 2025 Machine Learning certification program, covering core ML concepts and applied model building.',
        thumbnail: null,
        url: 'https://linkedin.com/in/nikita-chaurasia14',
        date: '2025-10-15',
        readTime: '11 min',
    },
];

const ytTextures = ['/textures/studio/tvfront_filmikprojektdlamultiego.webp', '/textures/studio/tvfront_filmikedytowaniezdjec.webp'];
const ytPaintedTextures = ['/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp', '/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp'];
const blogTextures = ['/textures/studio/monitorfront_postnafbdoublewinner.webp'];
const blogPaintedTextures = ['/textures/studio/monitorfront_postnafbdoublewinner_painted.webp'];
const ttTextures = ['/textures/studio/phonefront_followmeontiktok.webp'];
const ttPaintedTextures = ['/textures/studio/phonefront_followmeontiktok_painted.webp'];

let ytIdx = 0, blogIdx = 0, ttIdx = 0;
let ytPIdx = 0, blogPIdx = 0, ttPIdx = 0;

export const CONTENT_DATA = RAW_CONTENT_DATA.map((item) => {
    return {
        ...item,
        frontTexture: item.frontTexture || (
            item.platform === 'youtube' ? ytTextures[ytIdx++ % ytTextures.length] :
                item.platform === 'blog' ? blogTextures[blogIdx++ % blogTextures.length] :
                    ttTextures[ttIdx++ % ttTextures.length]
        ),
        paintedFrontTexture: item.paintedFrontTexture || (
            item.platform === 'youtube' ? ytPaintedTextures[ytPIdx++ % ytPaintedTextures.length] :
                item.platform === 'blog' ? blogPaintedTextures[blogPIdx++ % blogPaintedTextures.length] :
                    ttPaintedTextures[ttPIdx++ % ttPaintedTextures.length]
        )
    };
});

export const getContentByPlatform = (platform) => {
    if (platform === 'all') return CONTENT_DATA;
    return CONTENT_DATA.filter(item => item.platform === platform);
};

export const getLatestContent = () => {
    return [...CONTENT_DATA].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
};
