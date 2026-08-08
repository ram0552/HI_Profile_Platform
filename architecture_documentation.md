# Complete Hi-Profile Architecture Documentation

This document serves as the technical reference for the **Hi-Profile** platform. It provides an exhaustive analysis of the codebase, data models, component hierarchy, backend services, layout engines, API surfaces, and system lifecycle.

---

## 1. Project Overview

### Project Purpose
Hi-Profile is a professional bio-link platform and customizable portfolio system. It allows creators, developers, and professionals to aggregate their social identity (Instagram, GitHub, LinkedIn, Twitter/X, YouTube), custom links, media, and rich personal content into an interactive 4-column Bento layout or Timeline showcase.

### Technology Stack
- **Frontend Core**: React 19, React Router DOM v7, Vite v8.
- **Styling System**: Custom Vanilla CSS Tokens, CSS Grid, Flexbox, Hardware-Accelerated CSS Motion & Keyframe System.
- **Iconography**: Lucide React.
- **Backend Runtime**: Node.js with Express 4.
- **Database Layer**: MongoDB Atlas with Mongoose ODM (Schemas, Indexes, Hooks, Population).
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only Cookies & Authorization Headers, bcryptjs password hashing.
- **External Data Pipelines**: Apify Client SDK (scraping GitHub, Instagram, LinkedIn, Twitter/X, YouTube profile data & media).
- **Email System**: Nodemailer with Gmail SMTP / Mailtrap support.

### Overall Architecture
Hi-Profile uses a decoupled Client-Server architecture:
- `client`: Single Page Application (SPA) bundled via Vite.
- `server`: RESTful API micro-kernel serving JSON endpoints and handling Apify background refreshes, JWT validation, and MongoDB CRUD operations.

---

## 2. Folder Structure

```text
Hi-Profile-main/
├── client/                     # React Frontend Application
│   ├── public/                 # Static assets (favicons, SVG assets)
│   ├── src/                    # Source Code
│   │   ├── assets/             # Images & static media assets
│   │   ├── components/         # Reusable React components
│   │   │   ├── social/         # Social Platform Widgets & Sub-components
│   │   │   │   ├── GitHubWidget.jsx
│   │   │   │   ├── InstagramWidget.jsx
│   │   │   │   ├── LinkedInWidget.jsx
│   │   │   │   ├── TwitterWidget.jsx
│   │   │   │   ├── YouTubeWidget.jsx
│   │   │   │   ├── SocialAvatar.jsx
│   │   │   │   ├── SocialEmptyState.jsx
│   │   │   │   ├── SocialErrorState.jsx
│   │   │   │   ├── SocialFooterBar.jsx
│   │   │   │   ├── SocialImage.jsx
│   │   │   │   ├── SocialMetaRow.jsx
│   │   │   │   ├── SocialSkeleton.jsx
│   │   │   │   └── SocialStatBar.jsx
│   │   │   ├── EditPhotoModal.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── SocialIcons.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/            # React Context State Providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── OnboardingContext.jsx
│   │   ├── pages/              # View / Page Routes
│   │   │   ├── BentoView.jsx   # Interactive 4-Column Bento Engine & Header
│   │   │   ├── Claim.jsx       # Username reservation & availability check
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx     # Profile info setup step
│   │   │   ├── Register.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── Select.jsx      # Social platform picker step
│   │   │   ├── Setup.jsx       # Bio & Links setup step
│   │   │   ├── TimelineLive.jsx
│   │   │   ├── TimelineView.jsx
│   │   │   ├── Upload.jsx      # Avatar upload step
│   │   │   └── VerifyEmail.jsx
│   │   ├── services/           # Axios / Fetch API client abstraction
│   │   │   ├── api.js
│   │   │   ├── authApi.js
│   │   │   ├── bentoApi.js
│   │   │   └── socialApi.js
│   │   ├── styles/             # Global CSS Design System
│   │   │   └── global.css
│   │   ├── utils/              # Client Utilities & Layout Algorithms
│   │   │   ├── bentoGrid.js    # Grid collision detection & auto-compaction
│   │   │   └── socialHelpers.js # Social image proxying & data resolution
│   │   ├── App.jsx             # React Router routing table
│   │   └── main.jsx            # Entry DOM mounting script
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── server/                     # Express API Server
    ├── config/                 # System Configurations
    │   └── db.js               # MongoDB Mongoose connection handler
    ├── controllers/            # Request Orchestration Controllers
    │   ├── authController.js   # Login, Register, JWT, Tokens, Onboarding
    │   ├── blockController.js  # Bento Block CRUD & Reordering
    │   └── profileController.js# User Profile CRUD
    ├── middleware/             # Express Middleware Modules
    │   ├── authMiddleware.js   # JWT verification & route guard
    │   ├── authValidation.js   # Express/Joi style input validators
    │   └── rateLimiter.js      # In-memory IP rate limiter
    ├── models/                 # Mongoose Schema Definitions
    │   ├── PasswordResetToken.js
    │   ├── Profile.js
    │   ├── ProfileBlock.js
    │   ├── RefreshToken.js
    │   ├── SocialProfile.js
    │   ├── User.js
    │   ├── UsernameReservation.js
    │   └── VerificationToken.js
    ├── routes/                 # API Endpoint Definitions
    │   ├── authRoutes.js
    │   ├── blockRoutes.js
    │   ├── instagramRoutes.js
    │   ├── profileRoutes.js
    │   ├── socialRoutes.js
    │   └── userRoutes.js
    ├── services/               # External Integration & Business Logic
    │   ├── dribbbleService.js
    │   ├── emailService.js
    │   ├── githubService.js
    │   ├── instagramService.js
    │   ├── linkedinService.js
    │   ├── socialProfileService.js # Apify Orchestration & 24h MongoDB Cache
    │   ├── twitterService.js
    │   └── youtubeService.js
    ├── package.json
    └── server.js               # Express application entry script
```

---

## 3. Frontend Architecture

### Routing
Routing is managed by `react-router-dom` v7 in `App.jsx`.
- **Public Routes**: `/`, `/claim`, `/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password`, `/:username` (Public Bento View).
- **Onboarding Routes**: `/upload`, `/profile`, `/setup`, `/select`.
- **Dashboard Routes**: `/bento` (Owner Interactive Bento View), `/timeline`, `/timeline-live`.

### Layout & Component Hierarchy
- `App` wrapping `AuthProvider` and `OnboardingProvider`.
- Pages manage view rendering, modal state, and API requests.
- Components split into global UI (`Header`, `Toast`, `EditPhotoModal`) and platform-specific widgets inside `components/social/`.

### State Management
1. **`AuthContext`**: Manages authentication token (`accessToken`), current authenticated user object (`user`), login/logout lifecycle, and token restoration on page reload.
2. **`OnboardingContext`**: Manages step progress (`currentStep`, `stepTracking`, `completionPercentage`) during user signup onboarding.
3. **Local Component State**:
   - `BentoView.jsx`: Manages `gridBlocks` layout positions `(x, y, w, h)`, `activeDrag`, `activeResize`, `selectedBlockId`, `activeDialog` (Block Picker modal).
   - Social Widgets: Manage expanded bio toggles, hovered items, and loading/error states.

---

## 4. Backend Architecture

### Express Core & Route Structure
- Server entry script `server.js` initializes CORS, Helmet security headers, cookie parsing, and 5MB JSON payload limits.
- Supports dual path versioning: `/api/v1/*` and `/api/*`.

### Middleware Layers
1. **`authMiddleware.js`**: `protect` middleware extracts JWT bearer tokens from `Authorization` header or HTTP-only `token`/`accessToken` cookies. Attaches `req.user` decoded payload.
2. **`authValidation.js`**: Validates request body schemas for registration, login, and profile updates before hitting controllers.
3. **`rateLimiter.js`**: Prevents brute-force credential attempts and spamming of external Apify scrapers.

---

## 5. Database Architecture

### MongoDB Collections (Mongoose Schemas)

#### 1. `users` Collection (`User.js`)
- **Purpose**: Identity management, auth credentials, status, and onboarding progress tracking.
- **Key Fields**: `fullName`, `username` (unique indexed), `email` (unique indexed), `password`, `emailVerified`, `accountStatus`, `googleId`, `githubId`, `onboarding` object (`currentStep`, `completionPercentage`, `isCompleted`, `stepTracking`).

#### 2. `profiles` Collection (`Profile.js`)
- **Purpose**: Core bio portfolio details.
- **Key Fields**: `userId` (unique ref to `User`), `username` (unique indexed), `profileImage`, `avatar` object (`type`, `data`, `transform`, `bg`), `bio`, `socialLinks`, `selectedTemplate`, `theme`, `accentColor`, `skills`, `education`, `workHistory`, `projects`, `certifications`, `achievements`, `galleries`, `resumes`.

#### 3. `profileblocks` Collection (`ProfileBlock.js`)
- **Purpose**: Positioned layout blocks on the Bento grid.
- **Key Fields**: `userId` (ref `User`), `blockType` (`enum: ['emoji', 'link', 'text', 'checklist', 'image', 'instagram', 'github', 'youtube', 'twitter', 'linkedin']`), `configuration` (Mixed Object), `layout` (`x`, `y`, `w`, `h`), `order`, `visibility`, `locked`.

#### 4. `socialprofiles` Collection (`SocialProfile.js`)
- **Purpose**: Cached Apify scraper data for external social accounts.
- **Key Fields**: `userId` (ref `User`), `profileBlockId` (unique ref `ProfileBlock`), `platform`, `username`, `displayName`, `profileImage`, `headline`, `location`, `verified`, `followers`, `following`, `posts`, `description`, `profileUrl`, `recentContent` (Array of normalized items), `rawData` (Mixed original response), `lastFetched`.

---

## 6. Complete Data Flow

```text
User Registration
      ↓
JWT Token & Cookie Issued
      ↓
Onboarding Wizard (/upload → /profile → /setup → /select)
      ↓
User Adds Bento Block (e.g. GitHub handle)
      ↓
POST /api/profile-blocks (Creates ProfileBlock)
      ↓
Client Calls GET /api/social/stats?platform=github&handle=octocat
      ↓
Backend checks MongoDB `socialprofiles` (24h Cache Hit/Miss)
      ↓
Apify Scraper Service runs (if Cache Miss) → Normalizes & Saves to MongoDB
      ↓
Client renders GitHubWidget with animated repos and metrics
```

---

## 7. Bento Grid Architecture

### Layout Algorithm (`bentoGrid.js`)
- **Fixed Grid Width**: 4 Columns (`GRID_COLUMNS = 4`).
- **Base Row Height**: 160px (`BASE_ROW_HEIGHT = 160`) with 24px gap (`GRID_GAP = 24`).
- **Collision Detection (`collides`)**: Two-dimensional bounding box overlap check:
  $$b_1.x < b_2.x + b_2.w \;\land\; b_1.x + b_1.w > b_2.x \;\land\; b_1.y < b_2.y + b_2.h \;\land\; b_1.y + b_1.h > b_2.y$$
- **Automatic Compaction (`compactLayout`)**: Sorts blocks vertically then horizontally, moving each block upward row-by-row until collision occurs or $y=0$ is reached.
- **Collision Resolution (`resolveLayout`)**: When a block is moved or resized, conflicting blocks are pushed down row-by-row before calling `compactLayout`.

### Drag, Resize & Motion System
- **Drag & Drop**: Pointer events track cursor delta in real time. Dragged card receives `.is-dragging` class (`z-index: 100`, scale `1.04`, tilt `0.8deg`). Translucent ghost box (`.bento-grid-ghost-preview`) indicates target cell grid position.
- **Neighbour Movement**: Positions update fluidly via hardware-accelerated CSS transitions (`transition: left 0.32s, top 0.32s`).

---

## 8. Block System Specification

1. **Emoji Block**: 1x1 size. Displays customizable large emoji and optional title.
2. **Link Block**: 2x1 size. Displays external link title, target URL, and interactive diagonal arrow (`.bento-link-arrow`).
3. **Text Block**: 2x2 size. Displays custom title and paragraph description.
4. **Checklist Block**: 2x2 size. Displays item list with interactive checkbox toggles (`handleToggleCheckitem`).
5. **Image Block**: 2x2 size. Displays Cloudinary/S3 image URL with `object-fit: cover`, smooth zoom on hover, and optional bottom gradient caption bar.
6. **Instagram Block**: 2x2 size. Shows profile header, follower stats, bio, and 6 recent posts in a 3x2 grid with caption hover overlays.
7. **GitHub Block**: 2x2 size. Shows avatar, followers/repos, bio, and 3 recent repositories with language color badges and star counts.
8. **LinkedIn Block**: 2x2 size. Shows connections, headline, and 3 recent posts with reactions (likes, comments, shares).
9. **Twitter / X Block**: 2x2 size. Shows tweets, retweets, replies, and likes metrics.
10. **YouTube Block**: 2x2 size. Shows subscribers, video count, and 3 recent video thumbnails with play button overlays and view counts.

---

## 9. API Documentation Summary

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register new user account |
| **POST** | `/api/auth/login` | Public | Authenticate user & issue JWT |
| **POST** | `/api/auth/logout` | Public | Clear JWT auth cookies |
| **GET** | `/api/auth/me` | Protected | Fetch current user & onboarding state |
| **POST** | `/api/auth/onboarding/step` | Protected | Update onboarding step progress |
| **GET** | `/api/profile/me` | Protected | Fetch owner profile document |
| **PUT** | `/api/profile/me` | Protected | Update owner profile document |
| **GET** | `/api/profile/public/:username`| Public | Fetch public profile & block layout |
| **GET** | `/api/profile-blocks` | Protected | Fetch owner bento blocks |
| **POST** | `/api/profile-blocks` | Protected | Create new bento block |
| **PUT** | `/api/profile-blocks/:id` | Protected | Update block configuration/layout |
| **DELETE**| `/api/profile-blocks/:id` | Protected | Delete bento block |
| **PUT** | `/api/profile-blocks/reorder` | Protected | Sync batch layout positions |
| **GET** | `/api/social/stats` | Public | Fetch/refresh Apify social stats |

---

## 10. Production Readiness Review

| Category | Rating | Summary |
| :--- | :---: | :--- |
| **Architecture** | **8.5 / 10** | Clean client-server separation, modular Mongoose schemas, and well-designed 4-column layout engine. |
| **Maintainability**| **8.5 / 10** | Clear file organization, standard API response wrappers (`{ success, data, message }`), and standardized canonical data model. |
| **Security** | **8.0 / 10** | Password hashing via bcrypt, JWT tokens, Helmet headers, CORS policies, and CORS proxy sanitization for external images. |
| **Performance** | **8.5 / 10** | 24-hour MongoDB social cache eliminates redundant Apify actor calls. Hardware-accelerated CSS animations maintain 60fps interaction. |
| **Scalability** | **8.0 / 10** | Stateless Express routes and MongoDB Atlas indexes on `username`, `userId`, and `profileBlockId`. |
