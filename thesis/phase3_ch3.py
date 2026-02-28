"""Phase 3: Chapter 3 — System Design (architecture, database model, API, UI)."""

from thesis_utils import *


def write_ch3(doc):
    add_heading(doc, "3. System design", 1)

    # ── 3.1 Architecture ──
    add_heading(doc, "3.1. System architecture", 2)
    add_p(doc,
        "StrayPet employs a layered client-server architecture with strict separation between "
        "the presentation layer (React SPA) and the data/business logic layer (Django REST API). "
        "All communication between the two layers occurs exclusively through HTTP requests to "
        "RESTful API endpoints, with data exchanged in JSON format. This decoupled architecture "
        "enables independent development, testing, and deployment of the frontend and backend, "
        "and allows either side to be replaced or supplemented (for example, adding a mobile "
        "client) without modifying the other."
    )

    add_figure(doc, "3.1", "System architecture diagram of the StrayPet platform",
        "Diagram: Browser → React SPA (Vite build) → HTTP/JSON → Gunicorn (WSGI) → "
        "Django+DRF → PostgreSQL+PostGIS; side: Mapbox API, Nominatim, File storage")

    add_p(doc, "The architecture comprises five logical layers:",
          first_line_indent=0, space_before=8)

    add_p_multi(doc, [
        ("1. Presentation Layer (Frontend): ", True),
        ("The React 19 SPA runs entirely in the browser, built and bundled by Vite 7 into "
         "optimised static assets (JavaScript chunks, CSS, images). Routes are code-split "
         "using React.lazy() with a custom lazyWithFallback wrapper that catches chunk-load "
         "errors and shows a recoverable fallback instead of a white screen. The application "
         "communicates with the backend exclusively through the Axios HTTP client, which "
         "includes request interceptors for attaching JWT tokens and response interceptors "
         "for automatic token refresh.", False)
    ])
    add_p_multi(doc, [
        ("2. API Layer (Django REST Framework): ", True),
        ("DRF ViewSets and serialisers expose RESTful endpoints for all entities. The API "
         "follows standard HTTP method semantics: GET for retrieval, POST for creation, "
         "PATCH for partial updates, DELETE for removal. Authentication is enforced through "
         "JWTAuthentication, with endpoint-specific permission classes controlling access. "
         "Django-filter provides declarative query-parameter filtering with custom Filter "
         "classes (PetFilter with 16 parameters, LostFilter with comprehensive search).", False)
    ])
    add_p_multi(doc, [
        ("3. Business Logic Layer (Models + Signals): ", True),
        ("Core business rules are implemented through Django model methods (e.g., "
         "Donation.approve()) and the signal framework (pre_save, post_save handlers). "
         "The signal-driven approach ensures data consistency regardless of whether changes "
         "originate from the REST API or the Django Admin interface. Three signal modules "
         "manage the pet lifecycle, lost-pet synchronisation, user profile auto-creation, "
         "and notification generation.", False)
    ])
    add_p_multi(doc, [
        ("4. Data Layer (PostgreSQL + PostGIS): ", True),
        ("The relational database stores all persistent data across 22 primary tables. "
         "PostGIS provides spatial data types and GiST-indexed spatial queries. Django's "
         "ORM generates optimised SQL queries including JOIN, aggregation, and annotation, "
         "and manages schema migrations automatically via makemigrations/migrate.", False)
    ])
    add_p_multi(doc, [
        ("5. External Services: ", True),
        ("Mapbox API (geocoding + map tiles) and OpenStreetMap Nominatim (fallback geocoding) "
         "provide geographic data processing. The email system is configured via Django's "
         "EMAIL_BACKEND (console in development, SMTP in production). File storage uses the "
         "local filesystem with WhiteNoise serving static files.", False)
    ])

    # ── 3.1.1 Request lifecycle ──
    add_heading(doc, "3.1.1. Request lifecycle", 3)
    add_p(doc,
        "A typical API request follows this lifecycle: (1) The browser issues an HTTP request "
        "with a JSON body and an Authorization header containing the JWT access token. "
        "(2) Gunicorn receives the request and dispatches it to a Django worker process. "
        "(3) Django middleware processes the request in order: CORS headers (django-cors-"
        "headers), security middleware, session middleware, authentication middleware, and "
        "the custom UserUidMiddleware that assigns an anonymous visitor identifier cookie. "
        "(4) URL routing dispatches to the appropriate ViewSet action. (5) The permission "
        "class verifies access rights. (6) The serialiser validates and deserialises the "
        "input data. (7) The view performs the business logic (typically a queryset "
        "operation). (8) The response serialiser renders the output as JSON. (9) The "
        "response traverses middleware in reverse order and is returned to the client."
    )

    add_figure(doc, "3.2", "Sequence diagram: pet adoption application flow",
        "UML sequence diagram: User → Frontend → POST /pet/{id}/apply → "
        "DRF ViewSet → AdoptionSerializer → Database → post_save signal → "
        "Update Pet.status → Response 201")

    # ── 3.2 Database Model ──
    add_heading(doc, "3.2. Database model", 2)
    add_p(doc,
        "The StrayPet database consists of 22 primary tables organised into five Django "
        "applications: pet (12 models), user (5 models), blog (4 models), comment (1 model), "
        "and holiday_family (2 models). Additionally, Django's built-in auth_user, "
        "django_content_type, and auth_permission tables support the authentication and "
        "generic relation systems."
    )

    add_figure(doc, "3.3", "Entity-Relationship diagram of the StrayPet database",
        "ER diagram showing all 22 models grouped by Django app, with FK/M2M "
        "relationships indicated by lines")

    # ── 3.2.1 Pet application ──
    add_heading(doc, "3.2.1. Pet application models", 3)
    add_p(doc,
        "The pet application is the largest module, containing 12 models that cover pet "
        "management, the adoption workflow, lost pets, shelters, geographic addressing, "
        "and support tickets."
    )

    add_p(doc, "Pet Model", bold=True, first_line_indent=0, space_before=8)
    add_p(doc,
        "The central entity is the Pet model with 26 fields. The model defines six possible "
        "statuses (DRAFT, AVAILABLE, PENDING, ADOPTED, ARCHIVED, LOST) managed through "
        "Django TextChoices. Database indexes are defined on status, (species, breed), "
        "and created_by for query optimisation. Records are ordered by -pub_date by default."
    )

    add_table(doc, "3.1", "Pet model — complete field specification",
        ["Field", "Type", "Constraints / Details"],
        [
            ["name", "CharField(80)", "Pet name, required"],
            ["species", "CharField(40)", "E.g. cat, dog, rabbit"],
            ["breed", "CharField(80)", "blank=True, default=''"],
            ["sex", "CharField(10)", "Choices: male ('Boy'), female ('Girl')"],
            ["age_years", "PositiveIntegerField", "default=0"],
            ["age_months", "PositiveIntegerField", "default=0"],
            ["size", "CharField(20)", "Choices: small, medium, large, xlarge"],
            ["description", "CharField(300)", "Free-text description"],
            ["dewormed", "BooleanField", "default=False — health trait"],
            ["vaccinated", "BooleanField", "default=False — health trait"],
            ["microchipped", "BooleanField", "default=False — health trait"],
            ["sterilized", "BooleanField", "default=False — health trait"],
            ["child_friendly", "BooleanField", "default=False — behavioural trait"],
            ["trained", "BooleanField", "default=False — house trained"],
            ["loves_play", "BooleanField", "default=False — behavioural trait"],
            ["loves_walks", "BooleanField", "default=False — behavioural trait"],
            ["good_with_dogs", "BooleanField", "default=False — behavioural trait"],
            ["good_with_cats", "BooleanField", "default=False — behavioural trait"],
            ["affectionate", "BooleanField", "default=False — behavioural trait"],
            ["needs_attention", "BooleanField", "default=False — behavioural trait"],
            ["contact_phone", "CharField(30)", "Contact phone number"],
            ["address", "FK → Address", "on_delete=SET_NULL, nullable"],
            ["shelter", "FK → Shelter", "on_delete=SET_NULL, nullable"],
            ["cover", "ImageField", "upload_to='pets/'"],
            ["status", "CharField(20)", "TextChoices: DRAFT/AVAILABLE/PENDING/ADOPTED/ARCHIVED/LOST"],
            ["created_by", "FK → User", "on_delete=CASCADE"],
            ["add_date", "DateTimeField", "auto_now_add=True"],
            ["pub_date", "DateTimeField", "auto_now=True"],
        ]
    )

    add_p(doc, "Adoption Model", bold=True, first_line_indent=0, space_before=10)
    add_p(doc,
        "The Adoption model represents the adoption application workflow, linking a Pet to "
        "an applicant User with a message field and a status field tracking the lifecycle. "
        "A clean() validator prevents applications for pets with LOST status. Indexes on "
        "(pet, status) and (applicant, status) optimise the most common query patterns."
    )

    add_table(doc, "3.2", "Adoption model — field specification",
        ["Field", "Type", "Constraints"],
        [
            ["pet", "FK → Pet", "on_delete=CASCADE, related_name='adoptions'"],
            ["applicant", "FK → User", "on_delete=CASCADE"],
            ["message", "TextField", "Application message from user"],
            ["status", "CharField(20)", "Choices: submitted/processing/approved/rejected/closed"],
            ["created_at", "DateTimeField", "auto_now_add=True"],
            ["updated_at", "DateTimeField", "auto_now=True"],
        ]
    )

    add_p(doc, "Donation Model", bold=True, first_line_indent=0, space_before=10)
    add_p(doc,
        "The Donation model mirrors the Pet model's structure but adds donor-specific fields "
        "for the review workflow. The critical approve() method is implemented as an atomic "
        "database transaction (transaction.atomic()) that creates a new Pet record from the "
        "donation data, copies all associated DonationPhoto records to PetPhoto records "
        "(including setting the first photo as the cover image), and updates the donation "
        "status. This ensures either all operations succeed or all are rolled back."
    )

    add_table(doc, "3.3", "Donation model — additional fields beyond Pet mirror",
        ["Field", "Type", "Purpose"],
        [
            ["is_stray", "BooleanField", "Whether the donated animal is a stray (vs owned)"],
            ["status", "CharField", "pending / approved / rejected"],
            ["reviewer", "FK → User", "Admin who reviewed, null until reviewed"],
            ["review_note", "TextField", "Admin note (especially for rejections)"],
            ["created_pet", "OneToOne → Pet", "Link to Pet created on approval, null until approved"],
            ["donor", "FK → User", "User who submitted the donation"],
        ]
    )

    add_p(doc, "Address Hierarchy (Country → Region → City → Address)",
          bold=True, first_line_indent=0, space_before=10)
    add_p(doc,
        "Geographic data is modelled as a four-level hierarchy. ChainedForeignKey from "
        "django-smart-selects enables cascading selection in the Django Admin — selecting "
        "a country filters available regions, selecting a region filters available cities. "
        "The Address model stores the resolved coordinates both as Decimal fields (latitude, "
        "longitude, precision 9,6) and as a GeoJSON Point object in a JSONField."
    )

    add_table(doc, "3.4", "Address hierarchy models",
        ["Model", "Key Fields", "Notes"],
        [
            ["Country", "code (ISO alpha-2), name", "E.g. PL, Poland"],
            ["Region", "country (FK), code, name", "E.g. Mazowieckie"],
            ["City", "region (ChainedFK), name", "Chained to Region"],
            ["Address", "country, region (ChainedFK), city (ChainedFK), "
             "street, building_number, postal_code, latitude (Decimal 9,6), "
             "longitude (Decimal 9,6), location (JSONField — GeoJSON)", "Full address with coordinates"],
        ]
    )

    add_p(doc, "Lost Model", bold=True, first_line_indent=0, space_before=10)
    add_p(doc,
        "The Lost model stores lost-pet reports with 17 fields covering physical description "
        "(name, species, breed, colour, sex, size), geographic information (address FK with "
        "coordinates), temporal information (lost_time), contact details (phone, email), "
        "status (OPEN/FOUND/CLOSED), reporter reference, description text, reward amount "
        "(Decimal), and a single photo. A post_save signal (sync_pet_with_lost) automatically "
        "creates or updates a corresponding Pet record with LOST status."
    )

    add_p(doc, "Shelter Model", bold=True, first_line_indent=0, space_before=10)
    add_p(doc,
        "The Shelter model represents animal shelters with 18 fields covering identification "
        "(name, description), contact information (email, phone, website), geographic location "
        "(Address FK), visual assets (logo, cover_image), capacity metrics (capacity, "
        "current_animals), social media URLs (facebook, instagram, twitter), founded_year, "
        "verification status (is_verified, is_active), and created_by. Computed properties "
        "available_capacity and occupancy_rate provide real-time statistics."
    )

    add_table(doc, "3.5", "Remaining pet application models",
        ["Model", "Fields", "Purpose"],
        [
            ["PetPhoto", "pet (FK), image, order", "Ordered multi-photo per pet"],
            ["DonationPhoto", "donation (FK), image", "Photos for donation review"],
            ["PetFavorite", "user (FK), pet (FK)", "Unique per user-pet pair (bookmark)"],
            ["Ticket", "title, description, category (8 choices), priority (4 levels), "
             "status, assigned_to, created_by", "Support ticket system"],
            ["HolidayFamily", "user (FK), motivation, status, review fields",
             "Basic holiday-family application"],
        ]
    )

    # ── 3.2.2 User application ──
    add_heading(doc, "3.2.2. User application models", 3)

    add_p(doc, "UserProfile", bold=True, first_line_indent=0, space_before=4)
    add_p(doc,
        "UserProfile is a one-to-one extension of Django's built-in User model, containing "
        "22 fields. The phone field is validated by a regex (^\\+?[0-9\\- ]{6,20}$). "
        "The profile is automatically created via a post_save signal when a new User is "
        "registered, which also generates a default avatar image with the user's initials "
        "using PIL (Pillow)."
    )

    add_table(doc, "3.6", "UserProfile model — field specification",
        ["Field", "Type", "Purpose"],
        [
            ["user", "OneToOneField(User)", "Link to auth_user"],
            ["phone", "CharField(32)", "RegexValidator: ^\\+?[0-9\\- ]{6,20}$"],
            ["avatar", "ImageField", "upload_to='avatars/%Y/%m/%d/'"],
            ["is_holiday_family_certified", "BooleanField", "Set by admin on approval"],
            ["preferred_species", "CharField(50)", "dog, cat, rabbit, etc."],
            ["preferred_size", "CharField(50)", "small / medium / large"],
            ["preferred_age_min", "IntegerField", "Minimum age in months (nullable)"],
            ["preferred_age_max", "IntegerField", "Maximum age in months (nullable)"],
            ["preferred_gender", "CharField(20)", "male / female / any"],
            ["has_experience", "BooleanField", "Prior pet ownership experience"],
            ["living_situation", "CharField(100)", "apartment / house / farm"],
            ["has_yard", "BooleanField", "Has outdoor space"],
            ["other_pets", "CharField(200)", "Description of existing pets"],
            ["additional_notes", "TextField", "Free-text notes"],
            ["prefer_vaccinated", "BooleanField", "Trait preference mirror"],
            ["prefer_sterilized", "BooleanField", "Trait preference mirror"],
            ["prefer_dewormed", "BooleanField", "Trait preference mirror"],
            ["prefer_child_friendly", "BooleanField", "Trait preference mirror"],
            ["prefer_trained", "BooleanField", "Trait preference mirror"],
            ["prefer_loves_play", "BooleanField", "Trait preference mirror"],
            ["prefer_loves_walks", "BooleanField", "Trait preference mirror"],
            ["prefer_good_with_dogs", "BooleanField", "Trait preference mirror"],
            ["prefer_good_with_cats", "BooleanField", "Trait preference mirror"],
            ["prefer_affectionate", "BooleanField", "Trait preference mirror"],
            ["prefer_needs_attention", "BooleanField", "Trait preference mirror"],
        ]
    )

    add_p(doc,
        "The 11 prefer_* boolean fields mirror the 12 trait booleans on the Pet model, "
        "enabling algorithmic preference matching: the system can recommend pets whose "
        "traits align with the user's stated preferences."
    )

    add_table(doc, "3.7", "Remaining user application models",
        ["Model", "Key Fields", "Purpose"],
        [
            ["ViewStatistics", "content_type (FK), object_id, date, count",
             "Generic view counter with per-visitor 24h deduplication via cache"],
            ["Notification", "recipient (FK→User), type (7 choices), message, is_read, "
             "comment (FK), friendship (FK), holiday_app (FK)",
             "Unified notification feed linking to source objects"],
            ["Friendship", "from_user (FK), to_user (FK), status (pending/accepted/blocked)",
             "Bidirectional friendship with unique_together constraint"],
            ["PrivateMessage", "sender (FK), recipient (FK), content, is_read, read_at, "
             "is_system",
             "Direct messaging with read tracking"],
        ]
    )

    # ── 3.2.3 Blog + Comment ──
    add_heading(doc, "3.2.3. Blog and Comment models", 3)

    add_table(doc, "3.8", "Blog application models",
        ["Model", "Key Fields", "Notes"],
        [
            ["Category", "name, parent (self-FK), slug",
             "Hierarchical categories via self-referencing FK"],
            ["Article", "title, content (HTML), description (auto-generated), author (FK), "
             "category (FK), tags (M2M→Tag), created/updated",
             "GenericRelation to ViewStatistics and Comments"],
            ["Tag", "name",
             "Simple tag; article_count computed via annotation"],
            ["FavoriteArticle", "user (FK), article (FK)",
             "Unique per user-article pair"],
        ]
    )

    add_p(doc,
        "The Article model's save() method automatically generates a plain-text description "
        "from the HTML content by stripping tags and truncating to 200 characters. The "
        "get_markdown() and get_toc() methods provide Markdown rendering with table-of-"
        "contents extraction for frontend display."
    )

    add_p(doc, "Comment Model (Generic)", bold=True, first_line_indent=0, space_before=8)
    add_p(doc,
        "The Comment model uses Django's ContentType framework (GenericForeignKey) to "
        "enable comments on any model — currently used for Article comments but extensible "
        "to pets, shelters, or any other entity. A self-referencing parent FK enables "
        "threaded reply chains of arbitrary depth. A post_save signal creates a "
        "Notification record for the parent comment's author when a reply is posted."
    )

    # ── 3.2.4 Holiday Family ──
    add_heading(doc, "3.2.4. Holiday Family application models", 3)
    add_p(doc,
        "The holiday_family application provides a detailed application system with two "
        "models. HolidayFamilyApplication contains 20 fields including personal information "
        "(full name, age, phone, email), detailed address, pet care capabilities (boolean "
        "fields per species: can_care_dogs, can_care_cats, can_care_birds, etc.), "
        "pet_experience level, home_type, has_garden, motivation text, introduction, ID "
        "document upload (with FileExtensionValidator for pdf/jpg/png), terms agreement "
        "checkbox, and review fields (status, reviewer, review_note). "
        "HolidayFamilyPhoto stores multiple family photos per application."
    )

    # ── 3.3 REST API Design ──
    add_heading(doc, "3.3. REST API design", 2)
    add_p(doc,
        "The StrayPet API follows RESTful conventions with resource-oriented URL design, "
        "standard HTTP method semantics, and consistent JSON response formats. The API is "
        "organised into four URL namespaces registered in the root urls.py."
    )

    add_table(doc, "3.9", "API namespace structure and endpoint counts",
        ["Path Prefix", "Module", "ViewSets/Views", "Total Endpoints"],
        [
            ["/user/", "Auth, profiles, friends, messages, notifications", "8", "~35"],
            ["/pet/", "Pets, adoptions, lost, donations, shelters, tickets", "7", "~28"],
            ["/blog/", "Articles, categories, tags, comments", "4", "~16"],
            ["/holiday-family/", "Applications, review, photos", "2", "~8"],
        ]
    )
    add_p(doc,
        "In total, the API exposes approximately 87 endpoints across the four namespaces. "
        "Each endpoint follows a consistent pattern: resource collections at the base URL "
        "(e.g., GET /pet/ for listing, POST /pet/ for creation), individual resources at "
        "/pet/<id>/ (GET, PATCH, DELETE), and custom actions at /pet/<id>/action_name/ "
        "(e.g., POST /pet/<id>/favorite/)."
    )

    # 3.3.1 Serialisation patterns
    add_heading(doc, "3.3.1. Serialisation patterns", 3)
    add_p(doc,
        "The API employs a Dual Serialiser Pattern throughout most ViewSets, using separate "
        "serialisers for read and write operations. This design decision addresses a "
        "fundamental tension in REST APIs: read responses should be rich and denormalised "
        "(with nested objects, computed fields, and absolute URLs) for frontend convenience, "
        "while write requests should accept minimal, flat data that maps efficiently to "
        "database operations."
    )
    add_p(doc,
        "For example, the PetViewSet uses PetListSerializer for GET requests, which returns "
        "over 40 fields including computed properties (age_display, address_display, "
        "full_address, city, shelter name, favourites_count, is_favorited for the current "
        "user, photo URLs with absolute paths, and owner information). For POST/PATCH "
        "requests, PetCreateUpdateSerializer accepts a flat set of fields plus a write-only "
        "address_data JSON string, with to_internal_value() overridden to handle FormData "
        "normalisation: converting string 'true'/'false' to Python booleans, extracting "
        "list values from multipart encoding, and parsing the embedded JSON address object."
    )
    add_p(doc,
        "A DynamicFieldsModelSerializer base class provides runtime field selection on the "
        "user detail endpoint, allowing clients to specify which fields to include or "
        "exclude via constructor parameters. This reduces payload size for targeted queries."
    )

    # 3.3.2 Auth & Permissions
    add_heading(doc, "3.3.2. Authentication and permissions", 3)
    add_p(doc,
        "The API's global permission is set to AllowAny, with endpoint-specific overrides "
        "at the ViewSet level. This allows anonymous browsing of public data (pet listings, "
        "articles, shelters) while protecting write operations. Three custom permission "
        "classes enforce access control:"
    )
    add_bullet(doc,
        "IsOwnerOrAdmin: Allows any authenticated user to read (safe methods), but restricts "
        "write operations to the object's creator (checked via created_by field) or staff.")
    add_bullet(doc,
        "IsAdopterOrOwnerOrAdmin: Specialised for adoptions — the applicant can view and "
        "close their own application, the pet owner can view and manage applications for "
        "their pets, and administrators have full access.")
    add_bullet(doc,
        "IsOwnerOrReadOnly: Applied to lost-pet reports — the reporter can edit or delete "
        "their own reports while permitting read-only access for everyone else.")

    # 3.3.3 Filtering
    add_heading(doc, "3.3.3. Filtering and search", 3)
    add_p(doc,
        "Two comprehensive FilterSet classes are implemented using django-filter:"
    )
    add_p_multi(doc, [
        ("PetFilter (16 parameters): ", True),
        ("Text search on name (icontains), species, breed; exact match on status, sex, "
         "size; a custom city filter that searches both the pet's direct address and the "
         "associated shelter's address using Q objects (OR logic); age_min/age_max filters "
         "that convert total months to composite year + month queries; and 11 individual "
         "boolean trait filters.", False)
    ])
    add_p_multi(doc, [
        ("LostFilter: ", True),
        ("A general search parameter (q) that queries pet_name, address hierarchy (city, "
         "region, country names), description, colour, and breed simultaneously using OR "
         "logic; text filters for pet_name and city; date range filters for creation and "
         "loss dates; address hierarchy filters (country, region by ID, city by name); and "
         "exact filters for species, breed, colour, sex, size, and status.", False)
    ])

    # ── 3.4 UI Design ──
    add_heading(doc, "3.4. User interface design", 2)
    add_p(doc,
        "The user interface follows a consistent layout with a global navigation bar "
        "(TopNavbar) at the top providing links to all major sections: Home, Adopt, Lost "
        "Pet, Found/Stray, Shelters, Blog, and Holiday Family. The navbar also hosts the "
        "NotificationBell component (displaying an unread count badge updated every 30 "
        "seconds via polling) and the SignInWidget (avatar dropdown with profile and "
        "logout options)."
    )

    add_heading(doc, "3.4.1. Design principles", 3)
    add_p(doc,
        "The interface design follows several guiding principles:"
    )
    add_bullet(doc,
        "Consistency: All listing pages implement a uniform pattern — filter controls at "
        "the top, results in a responsive card grid, and pagination at the bottom.")
    add_bullet(doc,
        "Responsive-first: React Bootstrap's 12-column grid with breakpoint props (xs, sm, "
        "md, lg, xl) ensures content adapts from 375 px mobile screens to 1920 px desktops.")
    add_bullet(doc,
        "Visual hierarchy: Pet-friendly colour palette with clear call-to-action buttons. "
        "Important status information (adoption status, pet traits) uses colour-coded badges.")
    add_bullet(doc,
        "Progressive disclosure: Detail pages show essential information first, with "
        "expandable sections for additional data (full health records, shelter contact "
        "information).")
    add_bullet(doc,
        "Security: All user-generated HTML content (blog articles, comments) is sanitised "
        "through DOMPurify before rendering, preventing XSS attacks.")

    add_heading(doc, "3.4.2. Page layouts", 3)
    add_p(doc,
        "The application organises its 30+ pages into the following layout categories:"
    )

    add_table(doc, "3.10", "Page layout categories and associated views",
        ["Layout Type", "Pages", "Design Elements"],
        [
            ["Landing / Hero", "Home, Holiday Family landing",
             "Full-width hero banner, feature cards, call-to-action"],
            ["Card Grid + Filters", "Pet listing, Blog listing, Shelter listing, "
             "Lost pets (list mode)",
             "Filter sidebar/top bar, responsive card grid (1-4 cols), pagination"],
            ["Detail / Profile", "Pet detail, Article detail, Shelter detail, "
             "User profile, Lost pet detail",
             "Full-width header image, info sections, action buttons, map embed"],
            ["Form / Editor", "Add pet, Report lost, Write article, Holiday-family "
             "apply, Register, Login",
             "Centred form card, validation messages, file upload with preview"],
            ["Map View", "Lost pets map, Shelter map preview",
             "Full-width Mapbox GL canvas, custom markers, click-to-details"],
            ["Communication", "Messages, Notifications",
             "Two-pane layout (contacts + thread), dropdown notification list"],
        ]
    )

    add_figure(doc, "3.4", "Wireframe: Pet listing page with filter panel and card grid",
        "Wireframe showing desktop layout: left filter sidebar, right card grid 3 columns, "
        "bottom pagination")

    add_figure(doc, "3.5", "Wireframe: Pet detail page with photo gallery and adoption button",
        "Wireframe showing full-width cover photo, pet info sections, trait badges, "
        "map embed, shelter card, adopt button")

    add_heading(doc, "3.4.3. Interactive map design", 3)
    add_p(doc,
        "Interactive maps are implemented using Mapbox GL JS with WebGL rendering, providing "
        "smooth panning and zooming. The Poland-centred configuration (polandMapConfig.ts) "
        "defines geographic bounds (longitude 14.0-24.2, latitude 49.0-55.0), major city "
        "coordinates for map centre defaults, and coordinate validation/clamping functions "
        "to ensure all markers fall within the expected region."
    )
    add_p(doc,
        "Three map contexts are used in the application: (1) the lost-pets page displays "
        "all open reports as interactive markers with popups showing pet name, photo, and "
        "loss date; (2) pet and shelter detail pages embed a single-marker map showing the "
        "entity's address; and (3) the AddressPicker component in forms provides map-based "
        "address selection with reverse geocoding. A static image fallback (Mapbox Static "
        "Images API) is provided for browsers without WebGL support."
    )

    add_figure(doc, "3.6", "Map interface: lost pets with interactive markers",
        "Screenshot of the lost-pets page in map mode showing markers clustered "
        "around major Polish cities")

    add_heading(doc, "3.4.4. Shared component library", 3)
    add_p(doc,
        "Fifteen reusable components form the shared component library, promoting "
        "consistency and reducing code duplication:"
    )

    add_table(doc, "3.11", "Shared frontend components",
        ["Component", "Props / Features", "Used In"],
        [
            ["TopNavbar", "NavLinks to all sections, responsive collapse",
             "RootLayout (all pages)"],
            ["NotificationBell", "30s polling, unread badge, dropdown list, "
             "inline accept/reject for friend requests", "TopNavbar"],
            ["SignInWidget", "Avatar display, dropdown menu (profile, logout)",
             "TopNavbar"],
            ["MapboxMap", "lng/lat or address prop, auto-geocode, WebGL check, "
             "static fallback", "Pet detail, Shelter detail, Lost detail"],
            ["AddressPicker", "Cascading Country→Region→City selects, "
             "'create new' mode", "Add pet, Report lost, Shelter forms"],
            ["SafeHtml", "DOMPurify + html-react-parser, lazy import",
             "Article detail, Comment rendering"],
            ["EmojiPicker", "7-category grid in Bootstrap Popover",
             "Messages, Comments"],
            ["AvatarBadge", "User avatar + holiday-family gold badge, "
             "sizes sm/md/lg", "Profiles, Comments, Messages"],
            ["Pagination", "Smart ellipsis (≤5: show all, else windowed)",
             "All listing pages"],
            ["Loading", "Full-screen spinner overlay",
             "Global (Zustand loading store)"],
            ["PageHeroTitle", "Page title with optional subtitle",
             "Section landing pages"],
            ["AutoScrollToTop", "Scrolls to top on route change",
             "RootLayout"],
            ["DevErrorOverlay", "Catches onerror + unhandledrejection",
             "Dev mode only"],
            ["HighLight", "Syntax highlighting",
             "Code display in blog articles"],
            ["NotFound", "404 page with navigation link",
             "Catch-all route"],
        ]
    )

    page_break(doc)
    print("  ✓ Phase 3 complete: Chapter 3")
