"""Phase 2: Chapter 1 (Introduction) + Chapter 2 (Problem Analysis) — expanded."""

from thesis_utils import *


def write_ch1_ch2(doc):
    # ==================================================================
    # CHAPTER 1: INTRODUCTION
    # ==================================================================
    add_heading(doc, "1. Introduction", 1)

    # 1.1 Preface
    add_heading(doc, "1.1. Preface", 2)
    add_p(doc,
        "This document constitutes the written component of a Bachelor of Science thesis, "
        "submitted in fulfilment of the requirements for the Bachelor's Degree at the Faculty "
        "of Electronics and Information Technology, Warsaw University of Technology. The work "
        "was carried out during the academic year 2025/2026 under the supervision of "
        "[Supervisor Name, Ph.D.] from the Institute of Computer Science."
    )
    add_p(doc,
        "The thesis presents the design and implementation of StrayPet, a comprehensive web "
        "platform for stray pet adoption and management. The document covers every stage of "
        "the development process, from the initial problem analysis and technology evaluation "
        "through the detailed system design, implementation of both the backend and frontend "
        "components, and the testing and deployment strategy."
    )
    add_p(doc,
        "Stray and abandoned animals represent a significant social and ecological challenge "
        "across Europe. According to data from the European Pet Food Industry Federation "
        "(FEDIAF), an estimated 100 million stray cats and dogs live across Europe, with "
        "Poland alone operating over 200 registered animal shelters [21]. The Polish Animal "
        "Protection Act (Ustawa o ochronie zwierząt, Dz.U. 1997 Nr 111 poz. 724) mandates "
        "that municipalities assume responsibility for stray animals within their jurisdiction, "
        "typically delegating this task to local shelters. Despite these legal provisions, "
        "many shelters remain under-resourced and rely heavily on volunteers, social media, "
        "and word-of-mouth to facilitate adoptions."
    )
    add_p(doc,
        "The digitalisation of pet adoption services has the potential to dramatically improve "
        "adoption rates by increasing the visibility of animals in need, simplifying the "
        "adoption process for prospective pet owners, and reducing the administrative burden "
        "on shelter staff. Existing online platforms, particularly those dominant in the North "
        "American market (Petfinder, Adopt-a-Pet), have demonstrated the viability of this "
        "approach, yet the European and specifically Polish market remains underserved by "
        "comprehensive, feature-rich adoption platforms."
    )
    add_p(doc,
        "StrayPet addresses this gap by combining core adoption functionality with community "
        "engagement features (blog, social networking), geographic intelligence (interactive "
        "maps, geocoded addresses), and specialised workflows (lost pet tracking, holiday "
        "family certification, pet donation with admin review) in a single, modern web "
        "application."
    )

    # 1.2 Objectives
    add_heading(doc, "1.2. Objectives of the project", 2)
    add_p(doc,
        "The primary objective of the StrayPet project is to develop a fully functional, "
        "production-ready web platform that streamlines the stray pet adoption workflow and "
        "builds a community of pet enthusiasts. The following specific objectives were "
        "established at the outset of the project:"
    )
    add_bullet(doc,
        "O1 – Pet listing system: Design and implement a centralised pet listing system "
        "where shelters and individuals can register animals available for adoption, complete "
        "with detailed profiles including health status, 12 behavioural traits, up to eight "
        "photographs, and a geocoded geographic location."
    )
    add_bullet(doc,
        "O2 – Adoption workflow: Develop an adoption application workflow with full status "
        "tracking (submitted → processing → approved → rejected → closed), enabling "
        "transparent communication between applicants and pet owners or shelter administrators."
    )
    add_bullet(doc,
        "O3 – Lost pet tracking: Create a lost-pet tracking module with map-based "
        "geolocation, allowing users to report missing animals with their last known location "
        "and enabling the public to assist through an interactive Mapbox GL JS map interface."
    )
    add_bullet(doc,
        "O4 – Preference matching: Implement an intelligent pet recommendation engine "
        "that matches users with suitable pets based on their stated preferences regarding "
        "species, size, age range, gender, living situation, and 11 personality trait "
        "preferences."
    )
    add_bullet(doc,
        "O5 – Community blog: Build a community engagement platform including a blog system "
        "with WYSIWYG rich-text editing (FluentEditor), threaded comments, article "
        "favouriting, tag-based organisation, and monthly archives."
    )
    add_bullet(doc,
        "O6 – Holiday family programme: Develop a holiday-family certification workflow "
        "enabling users to apply as temporary foster families, with document verification "
        "and photo submission reviewed by administrators."
    )
    add_bullet(doc,
        "O7 – Social features: Implement friendships (request, accept, reject, block), "
        "rate-limited private messaging, and a unified notification centre covering "
        "adoption updates, comment replies, friend requests, and administrative decisions."
    )
    add_bullet(doc,
        "O8 – Responsive UI: Ensure the platform provides a responsive user experience "
        "across desktop and mobile devices, with accessibility considerations and intuitive "
        "navigation."
    )
    add_bullet(doc,
        "O9 – Containerised deployment: Deploy the system using Docker and Docker Compose "
        "for reproducibility, scalability, and ease of maintenance."
    )

    # 1.3 Scope
    add_heading(doc, "1.3. Scope of the thesis", 2)
    add_p(doc,
        "The scope of this thesis encompasses the design, implementation, and evaluation of "
        "the StrayPet web platform. The project is divided into two main technical components:"
    )
    add_p_multi(doc, [
        ("Backend: ", True),
        ("A Django REST Framework API providing authentication (JWT with CAPTCHA), CRUD "
         "operations for all entities, geographic data processing (PostGIS, Mapbox geocoding "
         "with Nominatim fallback), file upload management, signal-driven business logic, "
         "and a file-based caching layer.", False)
    ])
    add_p_multi(doc, [
        ("Frontend: ", True),
        ("A React 19 Single Page Application (SPA) with TypeScript, featuring 30+ lazy-loaded "
         "routes, Mapbox GL JS interactive maps, @opentiny/fluent-editor for rich text, "
         "Zustand for global state, ahooks for data fetching, and React Bootstrap for "
         "responsive UI components.", False)
    ])
    add_p(doc,
        "The following aspects are explicitly excluded from the current scope: native mobile "
        "applications (iOS/Android), payment gateway integration for monetary donations, "
        "real-time WebSocket-based chat (the current messaging system uses HTTP polling), "
        "integration with external veterinary record systems, machine-learning-based pet "
        "image recognition, and automated email marketing campaigns. These areas are "
        "identified as potential future extensions in Chapter 6."
    )

    # 1.4 Structure
    add_heading(doc, "1.4. Structure of the document", 2)
    add_p(doc,
        "This thesis is organised into six chapters and five appendices:", first_line_indent=0)
    add_bullet(doc,
        "Chapter 1 – Introduction: Presents the context, objectives, scope, and structure "
        "of the thesis.")
    add_bullet(doc,
        "Chapter 2 – Problem Analysis: Analyses the methodology of work, system requirements "
        "(functional and non-functional), use cases, existing platforms, and provides a "
        "thorough justification of the selected technologies.")
    add_bullet(doc,
        "Chapter 3 – System Design: Describes the overall architecture, database model with "
        "detailed entity descriptions, REST API design with serialisation patterns, and "
        "user interface design decisions.")
    add_bullet(doc,
        "Chapter 4 – Implementation: Provides a detailed account of backend and frontend "
        "implementation, including project structure, key algorithms, code listings, and "
        "integration patterns.")
    add_bullet(doc,
        "Chapter 5 – Testing and Deployment: Covers the testing strategy, systematic "
        "test scenarios, Docker-based deployment configuration, and performance "
        "optimisations.")
    add_bullet(doc,
        "Chapter 6 – Conclusions: Summarises the project achievements, evaluates the "
        "technology decisions, discusses encountered challenges, and proposes future "
        "development directions.")
    add_bullet(doc, "Appendix A – Installation Manual.")
    add_bullet(doc, "Appendix B – User Manual with screenshots.")
    add_bullet(doc, "Appendix C – API Endpoint Reference.")
    add_bullet(doc, "Appendix D – List of Figures.")
    add_bullet(doc, "Appendix E – List of Tables.")

    page_break(doc)

    # ==================================================================
    # CHAPTER 2: PROBLEM ANALYSIS
    # ==================================================================
    add_heading(doc, "2. Problem analysis", 1)

    # 2.1 Methodology
    add_heading(doc, "2.1. Methodology of work", 2)
    add_p(doc,
        "The development of StrayPet followed an iterative, incremental approach inspired by "
        "Agile principles. Rather than attempting to design the entire system upfront in a "
        "waterfall fashion, the project was organised into development cycles (iterations), "
        "each delivering a functional, testable subset of features that could be evaluated "
        "and refined before proceeding to the next iteration. This approach was selected for "
        "several reasons: (a) the requirements for community-facing features such as the blog "
        "and social system were expected to evolve during development based on user interface "
        "experimentation; (b) the geographic features (geocoding, maps) required prototyping "
        "to determine the optimal API provider and integration approach; and (c) the signal-"
        "driven business logic benefited from incremental complexity, starting with simple "
        "status transitions and extending to cross-model coordination."
    )
    add_p(doc,
        "Version control was managed using Git with a feature-branch workflow. Each significant "
        "feature was developed in a dedicated branch, reviewed for quality, and merged into the "
        "main branch upon completion. Commit messages follow the Conventional Commits "
        "specification (feat:, fix:, docs:, refactor:, style:, test:, chore:), enforced by "
        "Commitlint running as a Husky pre-commit hook on the frontend repository."
    )
    add_p(doc,
        "The development workflow was further strengthened by a robust toolchain on the "
        "frontend side. Husky manages Git hooks, lint-staged runs ESLint and Stylelint on "
        "staged files before each commit, and Prettier formats all JavaScript/TypeScript/SCSS "
        "files to a consistent style. On the backend, Django's Code itself follows PEP 8 "
        "conventions and the project uses requirements.txt for dependency pinning."
    )

    add_p(doc,
        "The development was organised into seven major iterations, each lasting approximately "
        "two to three weeks:", first_line_indent=0, space_before=8)

    add_table(doc, "2.1", "Development iterations and delivered features",
        ["Iteration", "Duration", "Features delivered"],
        [
            ["1", "Weeks 1–3",
             "Project scaffold (Django + Vite), database schema (Pet, User, Address "
             "models), JWT authentication, basic CRUD for pets"],
            ["2", "Weeks 4–6",
             "Adoption workflow (Adoption model + signals), multi-criteria pet filtering "
             "(PetFilter with 16 parameters), responsive frontend layout (React Bootstrap)"],
            ["3", "Weeks 7–9",
             "Lost-pet module (Lost model + sync signal), Mapbox GL JS integration "
             "(interactive map with markers), dual-provider geocoding service"],
            ["4", "Weeks 10–12",
             "Blog system (Article, Category, Tag models), FluentEditor WYSIWYG, "
             "generic threaded Comment system, view statistics with deduplication"],
            ["5", "Weeks 13–15",
             "Shelter management, Donation workflow with approval + atomic Pet creation, "
             "Holiday-family application and review, address cascading selects"],
            ["6", "Weeks 16–18",
             "Friendship system, private messaging with rate limiting, unified "
             "Notification centre (7 types), user preferences and trait matching"],
            ["7", "Weeks 19–21",
             "End-to-end testing, bug fixes, performance optimisation (database indexes, "
             "code splitting, caching), Docker deployment, documentation"],
        ]
    )

    # 2.2 System overview
    add_heading(doc, "2.2. System overview", 2)
    add_p(doc,
        "StrayPet is a client-server web application comprising a RESTful API backend and a "
        "Single Page Application (SPA) frontend. The system is designed to serve three primary "
        "categories of users:"
    )
    add_bullet(doc,
        "Anonymous visitors: Can browse available pets, read blog articles, view shelters on "
        "a map, and access the lost-pets map. Registration is required for all write operations.")
    add_bullet(doc,
        "Registered users: Can submit adoption applications, report lost pets, donate pets, "
        "write blog articles, post comments, apply as holiday families, manage friendships, "
        "send private messages, and customise pet-matching preferences.")
    add_bullet(doc,
        "Administrators (staff): Can review and approve/reject donations and holiday-family "
        "applications, manage pet and shelter data, moderate content, and handle support "
        "tickets through the Django Admin interface.")

    # 2.2.1 Functional Requirements
    add_heading(doc, "2.2.1. Functional requirements", 3)
    add_p(doc,
        "The functional requirements were established through analysis of existing pet "
        "adoption platforms, identification of common pain points in the adoption process, "
        "and consideration of the Polish regulatory context for animal shelters. Requirements "
        "are categorised by priority: High (must-have for MVP), Medium (important for "
        "completeness), and Low (nice-to-have enhancements)."
    )

    add_table(doc, "2.2", "Functional requirements – Authentication and user management",
        ["ID", "Requirement", "Priority"],
        [
            ["FR-U1", "User registration with email verification code (4-digit, 5-min TTL)", "High"],
            ["FR-U2", "User login with server-generated CAPTCHA (4-char image) and JWT tokens", "High"],
            ["FR-U3", "User profile management: avatar, phone, personal info", "High"],
            ["FR-U4", "Password reset via email verification code", "High"],
            ["FR-U5", "User adoption preferences: species, size, age range, gender, 11 trait booleans", "Medium"],
            ["FR-U6", "Avatar upload, deletion, and auto-generation from user initials", "Medium"],
        ]
    )

    add_table(doc, "2.3", "Functional requirements – Pet management and adoption",
        ["ID", "Requirement", "Priority"],
        [
            ["FR-P1", "Pet listing with 26-field profiles (name, species, breed, sex, age, size, "
             "12 traits, status, photos, address)", "High"],
            ["FR-P2", "Multi-criteria pet filtering: name, species, breed, sex, size, city, "
             "age range, 11 trait booleans", "High"],
            ["FR-P3", "Adoption application submission with personal message", "High"],
            ["FR-P4", "Adoption status tracking: submitted → processing → approved/rejected/closed", "High"],
            ["FR-P5", "Signal-driven pet status transitions on adoption changes", "High"],
            ["FR-P6", "Pet photo management: upload (up to 8), ordering, cover image selection", "Medium"],
            ["FR-P7", "Pet favouriting (bookmark) for registered users", "Medium"],
            ["FR-P8", "Intelligent pet matching based on user preference profile", "Medium"],
        ]
    )

    add_table(doc, "2.4", "Functional requirements – Lost pets, donations, shelters",
        ["ID", "Requirement", "Priority"],
        [
            ["FR-L1", "Lost-pet reporting with photo, last-known address, loss time, reward", "High"],
            ["FR-L2", "Interactive map display of lost pets with Mapbox GL JS markers", "High"],
            ["FR-L3", "Automatic Pet record creation from Lost report (signal-driven)", "High"],
            ["FR-D1", "Pet donation submission with multi-photo upload", "Medium"],
            ["FR-D2", "Admin donation review: approve (atomic Pet creation) or reject with note", "Medium"],
            ["FR-S1", "Shelter registration with address, capacity, logo, social media links", "Medium"],
            ["FR-S2", "Shelter map preview in listing cards", "Medium"],
            ["FR-S3", "Shelter capacity tracking: capacity, current_animals, occupancy_rate", "Low"],
        ]
    )

    add_table(doc, "2.5", "Functional requirements – Blog, social, and support",
        ["ID", "Requirement", "Priority"],
        [
            ["FR-B1", "Blog article creation with WYSIWYG rich-text editor (FluentEditor)", "Medium"],
            ["FR-B2", "Threaded comment system (generic, usable on any model)", "Medium"],
            ["FR-B3", "Article favouriting and view-count tracking with per-visitor dedup", "Low"],
            ["FR-B4", "Blog archive by year/month with aggregated article counts", "Low"],
            ["FR-B5", "Tag-based article organisation with popular-tags display", "Low"],
            ["FR-H1", "Holiday-family application with personal info, docs, photos", "Medium"],
            ["FR-H2", "Admin review: approve (certifies user) or reject with reason", "Medium"],
            ["FR-F1", "Friendship system: request, accept, reject, block", "Low"],
            ["FR-F2", "Private messaging with rate limit (3/day for non-friends)", "Low"],
            ["FR-N1", "Unified notification centre: reply, mention, friend_request, system, "
             "holiday_family_apply, approve, reject", "Medium"],
            ["FR-T1", "Support ticket system with 8 categories and priority levels", "Low"],
        ]
    )

    # 2.2.2 Non-functional requirements
    add_heading(doc, "2.2.2. Non-functional requirements", 3)

    add_table(doc, "2.6", "Non-functional requirements of the StrayPet platform",
        ["ID", "Requirement", "Category"],
        [
            ["NFR1", "Responsive design for viewports from 375 px (mobile) to 1920 px (desktop)", "Usability"],
            ["NFR2", "RESTful API following HTTP method semantics (GET/POST/PATCH/DELETE)", "Architecture"],
            ["NFR3", "Stateless JWT authentication (access + refresh token pair)", "Security"],
            ["NFR4", "Server-generated CAPTCHA with noise lines/dots, 5-min cache TTL", "Security"],
            ["NFR5", "DOMPurify sanitisation of all user-generated HTML to prevent XSS", "Security"],
            ["NFR6", "CORS headers enabled for cross-origin frontend–backend communication", "Security"],
            ["NFR7", "Docker + Docker Compose containerised deployment (3 services)", "Deployment"],
            ["NFR8", "Gunicorn WSGI server with 3 workers and 120 s timeout", "Deployment"],
            ["NFR9", "File-based cache with 300 s default TTL, 10 000 max entries", "Performance"],
            ["NFR10", "Pagination on all list endpoints (default 10, max 100 per page)", "Performance"],
            ["NFR11", "Lazy-loaded routes with code-split chunks and vendor separation", "Performance"],
            ["NFR12", "Database indexes on status, (species, breed), created_by, (pet, status)", "Performance"],
            ["NFR13", "Geocoding result cache with 24-hour TTL", "Performance"],
            ["NFR14", "Static file serving via WhiteNoise with compression", "Performance"],
        ]
    )

    # 2.2.3 Use cases
    add_heading(doc, "2.2.3. Use cases", 3)
    add_p(doc,
        "The system supports three primary actor roles: Anonymous User, Registered User, and "
        "Administrator. The use cases are organised into six functional areas."
    )

    add_figure(doc, "2.1", "Use case diagram for the StrayPet platform",
        "UML Use Case diagram: three actors (Anonymous, Registered, Admin) with use case "
        "groups for Auth, Pet, Lost, Blog, Social, Admin")

    add_p(doc, "Area 1: Authentication and Profile Management",
          bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc,
        "UC-A1 – Register: Provide username, email, password. Receive 4-digit email code. "
        "Enter code to verify. System creates User + auto-generated UserProfile with "
        "initial-based default avatar.")
    add_bullet(doc,
        "UC-A2 – Login: Enter email, password, CAPTCHA solution. System validates CAPTCHA "
        "against cache, authenticates credentials, returns JWT access + refresh tokens.")
    add_bullet(doc,
        "UC-A3 – Reset password: Request reset code via email → verify code → set new "
        "password. Two-step process with 5-minute code validity.")
    add_bullet(doc,
        "UC-A4 – Manage profile: Update personal information, upload/delete/reset avatar, "
        "set adoption preferences (15 fields), change email (requires verification).")

    add_p(doc, "Area 2: Pet Adoption",
          bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc,
        "UC-P1 – Browse pets: View paginated pet cards with filtering (16 parameters). "
        "Each card shows cover photo, name, species, age_display, city, favourites count.")
    add_bullet(doc,
        "UC-P2 – View pet details: Access full 26-field profile with all photos (gallery), "
        "health/trait indicators, shelter information, address on map, and adoption button.")
    add_bullet(doc,
        "UC-P3 – Apply for adoption: Submit application with personal message. System "
        "validates pet is not LOST, creates Adoption record, triggers signal to set pet "
        "status to PENDING.")
    add_bullet(doc,
        "UC-P4 – Track adoption: View own applications with current status. Receive "
        "notification when status changes.")
    add_bullet(doc,
        "UC-P5 – Favourite pet: Toggle favourite on pet detail page. View personal "
        "favourites list on profile.")
    add_bullet(doc,
        "UC-P6 – Donate pet: Submit donation form with up to 8 photos, full trait "
        "profile, and address. Status: pending review → approved/rejected.")

    add_p(doc, "Area 3: Lost Pet Tracking",
          bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc,
        "UC-L1 – Report lost pet: Fill form with physical description (name, species, "
        "breed, colour, sex, size), last-known address, loss time, photo, reward. "
        "System geocodes address and creates map marker.")
    add_bullet(doc,
        "UC-L2 – Map view: View all open lost-pet reports as interactive markers on a "
        "Poland-centred Mapbox map. Click marker to see details and navigate to report.")
    add_bullet(doc,
        "UC-L3 – Update status: Reporter can mark pet as found (status → FOUND) or close "
        "report. Signal reverts associated Pet record to AVAILABLE.")

    add_p(doc, "Area 4: Blog and Community",
          bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc,
        "UC-B1 – Read article: View article with formatted HTML content (sanitised via "
        "DOMPurify), view count, comment section, and related tags.")
    add_bullet(doc,
        "UC-B2 – Write article: Create article using FluentEditor WYSIWYG with image "
        "upload, assign category and tags. Auto-generates plain-text description from HTML.")
    add_bullet(doc,
        "UC-B3 – Comment: Post top-level comments or threaded replies. Author of parent "
        "comment receives notification.")
    add_bullet(doc,
        "UC-B4 – Browse archive: Navigate monthly archives with aggregated article counts. "
        "Filter by tag, category, or search term.")

    add_p(doc, "Area 5: Social Features",
          bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc,
        "UC-S1 – Send friend request: From another user's profile, request friendship. "
        "Target user receives notification with inline accept/reject buttons.")
    add_bullet(doc,
        "UC-S2 – Private messaging: Send text messages with emoji (EmojiPicker). "
        "Rate limit: 3 messages/day to non-friends. Conversations displayed in "
        "two-pane layout (contacts + thread).")
    add_bullet(doc,
        "UC-S3 – Notifications: View notification feed (polled every 30 s). "
        "Types: reply, friend_request, system, holiday_family_apply/approve/reject. "
        "Mark individual or all as read.")

    add_p(doc, "Area 6: Administration",
          bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc,
        "UC-ADM1 – Review donation: Inspect donation details and photos, approve "
        "(atomically creates Pet + copies photos, generates notification) or reject "
        "with note.")
    add_bullet(doc,
        "UC-ADM2 – Review holiday-family application: Inspect application, documents, "
        "photos. Approve (sets user as certified, creates notification) or reject "
        "with reason.")
    add_bullet(doc,
        "UC-ADM3 – Manage system: Django Admin interface for CRUD on all models, user "
        "management, shelter management, support ticket handling.")

    # 2.3 Similar Systems
    add_heading(doc, "2.3. Analysis of similar systems", 2)
    add_p(doc,
        "Prior to the development of StrayPet, an analysis of existing pet adoption platforms "
        "was conducted to identify common features, design patterns, and areas where "
        "improvement is possible."
    )

    add_heading(doc, "2.3.1. Petfinder (petfinder.com)", 3)
    add_p(doc,
        "Petfinder is one of the largest online pet adoption platforms globally, operating "
        "primarily in the United States and Canada since 1996. The platform aggregates pet "
        "listings from over 11,000 animal shelters and rescue organisations. Key features "
        "include advanced search filters (species, breed, age, size, gender, coat length, "
        "colour), location-based search with distance radius, and an integration with shelter "
        "management software."
    )
    add_p(doc,
        "Strengths include its massive database of adoptable animals, well-established brand "
        "recognition, and a mature public API (Petfinder API v2) enabling third-party "
        "integrations. Weaknesses include the lack of community features (no user blog, "
        "no social networking), absence of a dedicated lost-pet tracking system with map "
        "visualisation, and its geographic limitation to North America. The adoption process "
        "redirects users to external shelter websites rather than providing in-platform "
        "application tracking."
    )

    add_heading(doc, "2.3.2. Adopt-a-Pet (adoptapet.com)", 3)
    add_p(doc,
        "Adopt-a-Pet is another prominent North American platform, partnering with "
        "approximately 17,000 shelters. It differentiates itself with a clean, modern UI "
        "and a focus on the user experience. Prospective adopters can create wish lists and "
        "receive email alerts when matching animals become available."
    )
    add_p(doc,
        "While Adopt-a-Pet offers a wish-list matching feature, it similarly lacks community "
        "engagement tools, does not support lost-pet tracking, and has no provisions for "
        "holiday/foster family programmes. Its adoption workflow is basic, forwarding enquiries "
        "directly to shelters without providing an in-platform application tracking system."
    )

    add_heading(doc, "2.3.3. Polish platforms: adopciaki.pl, przygarnij.org", 3)
    add_p(doc,
        "In Poland, pet adoption services are primarily offered through individual shelter "
        "websites and social media pages (Facebook groups). Centralised platforms such as "
        "adopciaki.pl and przygarnij.org provide aggregated listings but with limited "
        "functionality compared to international counterparts. Common limitations include "
        "basic or no filtering, no map-based search, minimal community features, and "
        "non-responsive designs that perform poorly on mobile devices. Most Polish shelters "
        "rely on phone calls and in-person visits as the primary adoption channel."
    )

    add_heading(doc, "2.3.4. Feature comparison", 3)
    add_p(doc,
        "Table 2.7 provides a systematic comparison of the features offered by the analysed "
        "platforms against StrayPet's capabilities."
    )

    add_table(doc, "2.7", "Feature comparison of pet adoption platforms",
        ["Feature", "Petfinder", "Adopt-a-Pet", "Polish sites", "StrayPet"],
        [
            ["Centralised pet listings", "Yes", "Yes", "Basic", "Yes"],
            ["Advanced multi-field filtering", "Yes", "Limited", "No", "Yes (16 params)"],
            ["Interactive map search", "Distance only", "No", "No", "Yes (Mapbox GL)"],
            ["In-platform adoption tracking", "No (redirect)", "No (redirect)", "No", "Yes (5 statuses)"],
            ["Lost-pet map tracking", "Limited", "No", "No", "Yes (geocoded)"],
            ["Pet donation with review", "No", "No", "No", "Yes (atomic)"],
            ["Blog / rich-text articles", "Articles", "No", "No", "Yes (WYSIWYG)"],
            ["Threaded comment system", "No", "No", "No", "Yes (generic FK)"],
            ["Holiday-family programme", "No", "No", "No", "Yes"],
            ["Friendship system", "No", "No", "No", "Yes"],
            ["Private messaging", "No", "No", "No", "Yes (rate-limited)"],
            ["In-app notification centre", "Email only", "Email only", "No", "Yes (7 types)"],
            ["Preference-based matching", "Email alerts", "Wish list", "No", "Yes (15 fields)"],
            ["Shelter management panel", "Via partner SW", "Via partner SW", "Per shelter", "Yes (built-in)"],
            ["Support ticket system", "External", "External", "No", "Yes (8 categories)"],
            ["Responsive mobile design", "Yes", "Yes", "Partial", "Yes"],
            ["Open-source / self-hosted", "No", "No", "Varies", "Yes (Docker)"],
        ]
    )
    add_source(doc, "Own analysis based on publicly available platform features, accessed January 2026.")

    add_p(doc,
        "As demonstrated in Table 2.7, StrayPet fills several gaps left by existing platforms, "
        "most notably the combination of a lost-pet tracking system with interactive map "
        "visualisation, a built-in community and social system, and an integrated holiday-family "
        "certification programme. While the platform's current user base is smaller than "
        "established North American services, its feature set is significantly more "
        "comprehensive for the European market context."
    )

    # 2.4 Technology selection
    add_heading(doc, "2.4. Technology selection", 2)
    add_p(doc,
        "Technology selection was guided by five criteria: (1) support for geographic data "
        "processing (PostGIS, geocoding), (2) rapid development with mature ORM and admin, "
        "(3) componentised frontend with TypeScript support, (4) strong community support "
        "and documentation, and (5) containerisation for reproducible deployment."
    )

    # 2.4.1 Database
    add_heading(doc, "2.4.1. Database Management System", 3)
    add_p(doc,
        "PostgreSQL 16 was selected as the primary DBMS, primarily for its industry-leading "
        "support for geographic data through the PostGIS extension. StrayPet relies heavily "
        "on geographic features: lost-pet locations must be stored with precise coordinates, "
        "shelters require map-based visualisation, and pets should be searchable by city and "
        "proximity. PostGIS provides spatial data types (geometry, geography), spatial indexing "
        "(GiST), and spatial functions (distance calculations, containment tests) that would "
        "be significantly more complex to implement with alternative databases."
    )
    add_p(doc,
        "PostgreSQL also offers native JSONField support (via the jsonb type), which is used "
        "to store GeoJSON Point objects alongside traditional latitude/longitude decimal fields, "
        "providing flexibility for future spatial query expansion. The database engine is "
        "deployed as a Docker container using the official postgis/postgis:16-3.4 image, "
        "which comes pre-configured with all required spatial extensions."
    )

    add_table(doc, "2.8", "Database management system comparison",
        ["Criterion", "PostgreSQL + PostGIS", "MySQL 8", "MongoDB 7"],
        [
            ["Spatial data support", "Excellent (PostGIS)", "Basic (spatial ext.)", "Good (GeoJSON)"],
            ["Django integration", "Excellent (GeoDjango)", "Good", "Limited (djongo)"],
            ["Relational integrity (FK)", "Excellent", "Good", "Not native"],
            ["Complex aggregate queries", "Excellent", "Good", "Aggregation pipeline"],
            ["JSON native support", "jsonb (indexed)", "JSON type", "Native"],
            ["Community & documentation", "Excellent", "Excellent", "Good"],
            ["Docker image available", "postgis/postgis", "mysql", "mongo"],
            ["Maturity (years)", "35+", "28+", "15+"],
        ]
    )
    add_source(doc, "Own comparison based on official documentation and feature matrices.")

    # 2.4.2 Server-side
    add_heading(doc, "2.4.2. Server-side framework", 3)
    add_p(doc,
        "Django 5.1, a high-level Python web framework, was selected for the backend, paired "
        "with Django REST Framework (DRF) 3.15 for the API layer. Django follows the "
        "Model-View-Template (MVT) architectural pattern and the \"Don't Repeat Yourself\" "
        "(DRY) principle. In StrayPet, Django serves purely as an API backend without "
        "server-side template rendering."
    )
    add_p(doc, "Key advantages motivating this selection:", first_line_indent=0, space_before=4)
    add_bullet(doc,
        "Built-in ORM with automatic migration generation, supporting complex relationships "
        "(ForeignKey, OneToOne, ManyToMany, GenericForeignKey), custom model managers, and "
        "database-level constraints.")
    add_bullet(doc,
        "GeoDjango module providing native integration with PostGIS spatial fields and "
        "geographic queries, eliminating the need for raw SQL or third-party geo libraries.")
    add_bullet(doc,
        "DRF's powerful serialiser framework: ModelSerializer for automatic field mapping, "
        "customisable to_representation() and to_internal_value() methods for data "
        "transformation, nested serialisers for denormalised responses, and write-only "
        "fields for multipart form data handling.")
    add_bullet(doc,
        "djangorestframework-simplejwt for JWT token management with customisable "
        "serialisers (used to inject CAPTCHA validation into the login flow).")
    add_bullet(doc,
        "Django's signal framework (pre_save, post_save) for implementing event-driven "
        "business logic that spans multiple models without coupling view logic.")
    add_bullet(doc,
        "Django Admin for rapid administrative interface construction with custom actions "
        "(approve/reject donations), inline editing (photos within pet admin), and automatic "
        "form generation from model definitions.")
    add_bullet(doc,
        "Comprehensive ecosystem: django-filter (declarative query filtering), "
        "django-cors-headers (CORS), WhiteNoise (static files), django-smart-selects "
        "(cascading foreign-key dropdowns).")

    add_table(doc, "2.9", "Server-side framework comparison",
        ["Criterion", "Django + DRF", "Flask + Marshmallow", "Express.js", "Spring Boot"],
        [
            ["Built-in ORM", "Yes (powerful)", "No (SQLAlchemy)", "No (Prisma/Sequelize)", "Yes (JPA)"],
            ["Auto migrations", "Yes", "Via Alembic", "Via library", "Yes (Flyway)"],
            ["Admin interface", "Built-in", "Via Flask-Admin", "No", "No (Spring Admin)"],
            ["Geo support", "GeoDjango", "Via GeoAlchemy", "Via library", "Via library"],
            ["Serialisation", "DRF (powerful)", "Marshmallow", "Manual/library", "Jackson"],
            ["Auth/JWT packages", "simplejwt", "Flask-JWT", "passport.js", "Spring Security"],
            ["Signal/event system", "Built-in", "Via Blinker", "EventEmitter", "ApplicationEvent"],
            ["Learning curve", "Moderate", "Low", "Low", "High"],
            ["Development speed", "High", "Medium", "Medium", "Medium"],
        ]
    )
    add_source(doc, "Own comparison based on framework documentation and community benchmarks.")

    add_p(doc,
        "Flask was considered but rejected due to the significant manual assembly required "
        "(ORM, migration, admin, auth — all separate packages). Express.js was viable but "
        "would have introduced a language mismatch with the GeoDjango/PostGIS ecosystem. "
        "Spring Boot, while powerful, imposes a significantly heavier learning curve and "
        "development overhead for a project of this scope."
    )

    # 2.4.3 Client-side
    add_heading(doc, "2.4.3. Client-side technologies", 3)
    add_p(doc,
        "React 19 with TypeScript was selected for the frontend. React's component-based "
        "architecture enables the creation of reusable UI elements (e.g., MapboxMap, "
        "NotificationBell, SafeHtml, AddressPicker are shared across multiple pages), while "
        "TypeScript adds static type safety that catches errors during development rather "
        "than at runtime. React 19 introduces the use() hook, employed in StrayPet's "
        "AuthProvider for reading context values without the useContext() wrapper."
    )
    add_p(doc,
        "Vite 7 serves as the build tool, offering significantly faster development server "
        "startup and Hot Module Replacement (HMR) compared to webpack-based setups (Create "
        "React App). The SWC (Speedy Web Compiler) plugin replaces Babel for JSX/TS "
        "transformation, providing near-instant compilation. Vite's configuration also "
        "enables manual chunk splitting, separating React core libraries and utility "
        "packages into separate vendor chunks for optimal browser caching."
    )

    add_table(doc, "2.10", "Key frontend library selections and justifications",
        ["Library", "Version", "Purpose", "Justification"],
        [
            ["React", "19.1", "UI framework", "Component model, hooks, largest ecosystem"],
            ["TypeScript", "~5.9", "Type system", "Static analysis, IDE intelligence, refactor safety"],
            ["Vite", "7.0", "Build tool", "ESM dev server, fast HMR, SWC compiler, tree shaking"],
            ["React Bootstrap", "2.10", "UI components", "Responsive grid, pre-built widgets, Bootstrap 5"],
            ["Mapbox GL JS", "3.16", "Interactive maps", "WebGL rendering, custom markers, geocoding API"],
            ["@opentiny/fluent-editor", "3.25", "Rich text", "Quill-based WYSIWYG, image upload support"],
            ["ahooks", "3.9", "React hooks", "useRequest (loading/error/caching), useDebounce"],
            ["Zustand", "5.0", "Global state", "Minimal boilerplate, Immer middleware, devtools"],
            ["axios", "1.11", "HTTP client", "Interceptors for JWT refresh, multipart support"],
            ["dayjs", "1.11", "Date handling", "1/40th Moment.js size, locale support"],
            ["DOMPurify", "3.0", "HTML sanitise", "XSS prevention for user-generated HTML content"],
            ["Supercluster", "8.0", "Map clustering", "Efficient geospatial point clustering"],
            ["React Router", "7.x", "Routing", "Nested routes, loaders, lazy loading support"],
        ]
    )
    add_source(doc, "Own selection based on npm statistics, documentation quality, and project needs.")

    add_table(doc, "2.11", "Frontend framework comparison",
        ["Criterion", "React 19", "Vue 3", "Angular 17", "Svelte 5"],
        [
            ["Component model", "Functions + hooks", "SFC + Composition", "Classes + decorators", "Compiled components"],
            ["TypeScript support", "Excellent", "Excellent", "Native", "Good"],
            ["Ecosystem size (npm)", "Largest", "Large", "Large", "Growing"],
            ["Build tooling", "Vite / CRA", "Vite (native)", "Angular CLI", "SvelteKit"],
            ["Map library support", "Mapbox GL, Leaflet", "vue-mapbox", "ngx-mapbox-gl", "Limited"],
            ["State management", "Context, Zustand, Redux", "Pinia", "NgRx, signals", "Stores"],
            ["Learning curve", "Moderate", "Low–Moderate", "High", "Low"],
            ["Community / jobs", "Largest", "Large", "Large", "Growing"],
        ]
    )
    add_source(doc, "Own comparison based on framework documentation and ecosystem analysis.")

    add_p(doc,
        "React was preferred over Vue primarily for its larger ecosystem of compatible "
        "libraries (especially Mapbox GL JS wrappers), TypeScript-first community tooling, "
        "and the author's prior experience. Angular was rejected due to its heavier "
        "convention-over-configuration approach. Svelte, while appealing for its compiled "
        "approach, has a smaller ecosystem particularly for mapping libraries."
    )

    # 2.4.4 Geocoding
    add_heading(doc, "2.4.4. Geocoding and map services", 3)
    add_p(doc,
        "Geographic information processing is a core requirement of StrayPet. Both lost-pet "
        "tracking and shelter management rely on accurate address-to-coordinate conversion "
        "(forward geocoding) and interactive map display. After evaluating several providers, "
        "a dual-provider strategy was implemented:"
    )
    add_p_multi(doc, [
        ("Primary provider — Mapbox Geocoding API: ", True),
        ("Provides high-accuracy structured geocoding with relevance scoring. The "
         "implementation accepts results only when the relevance score exceeds 0.7 and the "
         "result type is 'address' or 'poi' (point of interest). The API accepts contextual "
         "parameters (country code, city, postal code) for improved accuracy. A specialised "
         "Polish address normaliser reorders number-first addresses (e.g., '12/16 Kopińska' "
         "→ 'Kopińska 12/16') to match Mapbox's expected format. A built-in fallback "
         "simplifies complex street numbers (e.g., trying '12' if '12/16' fails).", False)
    ])
    add_p_multi(doc, [
        ("Fallback provider — OpenStreetMap Nominatim: ", True),
        ("A free, open-source geocoding service used when Mapbox returns no results or when "
         "the Mapbox API token is unavailable. Structured queries with individual address "
         "components (street, city, postalcode, country) are attempted first, falling back "
         "to free-form text queries if structured queries fail.", False)
    ])
    add_p(doc,
        "All geocoding results are cached for 24 hours using Django's file-based cache "
        "backend, with cache keys derived from MD5 hashes of the address string and context "
        "parameters. This caching layer significantly reduces external API calls and improves "
        "response times for repeated address lookups. The function returns a (longitude, "
        "latitude) tuple or None if both providers fail."
    )

    # 2.4.5 Auth
    add_heading(doc, "2.4.5. Authentication strategy", 3)
    add_p(doc,
        "JSON Web Tokens (JWT) [14] were selected as the authentication mechanism, "
        "implemented through djangorestframework-simplejwt. JWT provides stateless "
        "authentication, meaning the server does not need to store session state — "
        "each request includes a cryptographically signed token that the server verifies."
    )
    add_p(doc, "The JWT authentication flow in StrayPet:", first_line_indent=0, space_before=4)
    add_bullet(doc,
        "Step 1: User submits email + password + CAPTCHA solution to POST /user/token/.")
    add_bullet(doc,
        "Step 2: LoginSerializer validates CAPTCHA against cache (case-insensitive), then "
        "delegates to Django's authenticate() for credential verification.")
    add_bullet(doc,
        "Step 3: On success, server returns {access: <short-lived>, refresh: <long-lived>}.")
    add_bullet(doc,
        "Step 4: Frontend stores both tokens in localStorage and attaches 'Authorization: "
        "Bearer <access>' to all subsequent requests via Axios request interceptor.")
    add_bullet(doc,
        "Step 5: When access token expires (HTTP 401), the Axios response interceptor "
        "automatically calls POST /user/token/refresh/ with the refresh token. A deduplication "
        "mechanism ensures only one refresh request is in flight — concurrent 401 errors "
        "queue their retry promises behind the single refresh operation.")
    add_bullet(doc,
        "Step 6: If the refresh token is also expired, all tokens are cleared and the user "
        "is redirected to the login page.")

    add_p(doc,
        "The login endpoint is further protected by a server-generated CAPTCHA. The backend's "
        "generate_captcha_image() function (common/utils.py) creates a 120×50 pixel PNG image "
        "containing a random 4-character alphanumeric code rendered at 36pt DejaVu Sans font, "
        "with visual noise (5 random lines and 60 random coloured dots). The image is encoded "
        "as a base64 data URI and returned alongside a UUID identifier. The CAPTCHA code is "
        "cached with a 5-minute TTL."
    )

    # 2.4.6 Deployment
    add_heading(doc, "2.4.6. Deployment tools", 3)
    add_p(doc,
        "Docker and Docker Compose were selected for application containerisation. "
        "Containerisation provides several benefits for this project: consistent development "
        "and production environments (eliminating 'works on my machine' issues), isolation of "
        "the PostGIS database and Python runtime, simple scaling through container "
        "orchestration, and single-command deployment via 'docker-compose up'."
    )
    add_p(doc, "The deployment stack comprises three Docker services:", first_line_indent=0, space_before=4)
    add_bullet(doc,
        "db: postgis/postgis:16-3.4 — PostgreSQL 16 with PostGIS 3.4. Data persisted in "
        "a named Docker volume (pgdata).")
    add_bullet(doc,
        "web: Custom image (Python 3.12-slim) — Installs GDAL, GEOS, PROJ for GeoDjango, "
        "runs collectstatic during build, executes migrations on startup, then launches "
        "Gunicorn (3 workers, 120 s timeout, binding to 0.0.0.0:8000).")
    add_bullet(doc,
        "adminer: adminer:latest — Lightweight PHP-based database administration UI on "
        "port 8080 for development and debugging.")

    add_table(doc, "2.12", "Python dependencies configured in requirements.txt",
        ["Package", "Purpose"],
        [
            ["Django==5.1", "Web framework"],
            ["djangorestframework==3.15.2", "REST API framework"],
            ["djangorestframework-simplejwt", "JWT authentication"],
            ["django-filter", "Declarative query filtering"],
            ["django-cors-headers", "CORS middleware"],
            ["django-smart-selects", "Cascading FK dropdowns"],
            ["whitenoise", "Static file serving"],
            ["gunicorn", "WSGI production server"],
            ["psycopg2-binary", "PostgreSQL adapter"],
            ["Pillow", "Image processing (CAPTCHA, avatar)"],
            ["requests", "HTTP client (geocoding APIs)"],
            ["markdown", "Markdown-to-HTML rendering"],
        ]
    )

    page_break(doc)
    print("  ✓ Phase 2 complete: Chapter 1 + Chapter 2")
