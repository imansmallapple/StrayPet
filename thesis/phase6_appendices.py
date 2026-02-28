"""Phase 6: Appendices A–E + Bibliography."""

from thesis_utils import *


def write_appendices(doc):
    # =====================================================================
    # Appendix A — Installation and Deployment Manual
    # =====================================================================
    add_heading(doc, "Appendix A. Installation and deployment manual", 1)
    add_p(doc,
        "This appendix provides step-by-step instructions for setting up the StrayPet "
        "platform in a development environment."
    )

    add_heading(doc, "A.1. Prerequisites", 2)
    add_table(doc, "A.1", "Required software",
        ["Software", "Minimum Version", "Purpose"],
        [
            ["Docker Desktop", "4.x", "Container runtime for backend services"],
            ["Docker Compose", "2.x", "Multi-service orchestration (bundled with Desktop)"],
            ["Node.js", "18.x", "Frontend build toolchain"],
            ["pnpm", "8.x", "Package manager (npm install -g pnpm)"],
            ["Git", "2.x", "Version control"],
        ]
    )

    add_heading(doc, "A.2. Backend setup", 2)
    add_code_block(doc,
        "# 1. Clone the repository\n"
        "git clone https://github.com/<user>/StrayPet.git\n"
        "cd StrayPet/backend\n\n"
        "# 2. Create environment file\n"
        "cp .env.example .env\n"
        "# Edit .env: set POSTGRES_PASSWORD, MAPBOX_TOKEN, SECRET_KEY\n\n"
        "# 3. Build and start Docker services\n"
        "docker-compose up --build -d\n\n"
        "# 4. Verify services are running\n"
        "docker-compose ps\n"
        "# Expected: db (healthy), web (running), adminer (running)\n\n"
        "# 5. Create superuser (first time only)\n"
        "docker-compose exec web python manage.py createsuperuser\n\n"
        "# 6. Access points:\n"
        "#    API:       http://localhost:8000/\n"
        "#    Admin:     http://localhost:8000/admin/\n"
        "#    Adminer:   http://localhost:8080/",
        "Listing A.1: Backend setup commands"
    )

    add_heading(doc, "A.3. Frontend setup", 2)
    add_code_block(doc,
        "# 1. Navigate to frontend directory\n"
        "cd StrayPet/frontend\n\n"
        "# 2. Install dependencies\n"
        "pnpm install\n\n"
        "# 3. Create environment file\n"
        "cp .env.example .env.local\n"
        "# Edit .env.local: set VITE_MAPBOX_TOKEN\n\n"
        "# 4. Start development server\n"
        "pnpm dev\n"
        "# Runs at http://localhost:5173 with HMR\n\n"
        "# 5. Production build\n"
        "pnpm build\n"
        "# Output in dist/ directory",
        "Listing A.2: Frontend setup commands"
    )

    add_heading(doc, "A.4. Environment variables", 2)
    add_table(doc, "A.2", "Required environment variables",
        ["Variable", "Location", "Purpose", "Example Value"],
        [
            ["POSTGRES_DB", "backend/.env", "Database name", "straypet"],
            ["POSTGRES_USER", "backend/.env", "Database user", "postgres"],
            ["POSTGRES_PASSWORD", "backend/.env", "Database password", "(secure value)"],
            ["SECRET_KEY", "backend/.env", "Django secret key", "(64-char random string)"],
            ["MAPBOX_TOKEN", "backend/.env", "Server-side geocoding", "pk.ey..."],
            ["VITE_MAPBOX_TOKEN", "frontend/.env.local", "Client-side map rendering", "pk.ey..."],
            ["DEBUG", "backend/.env", "Django debug mode", "True / False"],
        ]
    )

    page_break(doc)

    # =====================================================================
    # Appendix B — User Manual (with figure placeholders)
    # =====================================================================
    add_heading(doc, "Appendix B. User manual", 1)
    add_p(doc,
        "This appendix illustrates the main user flows of the StrayPet platform."
    )

    add_heading(doc, "B.1. Registration and login", 2)
    add_figure(doc, "B.1", "Registration page: username, email, password fields",
        "Screenshot of the registration form with validation messages")
    add_p(doc,
        "New users register by providing a username, email address, and password. "
        "After registration, the system automatically creates a UserProfile with a "
        "generated avatar. To log in, the user must enter credentials and solve a "
        "CAPTCHA challenge. The CAPTCHA image displays 4 alphanumeric characters; the "
        "comparison is case-insensitive."
    )
    add_figure(doc, "B.2", "Login page with CAPTCHA verification",
        "Screenshot of the login form showing username/password fields and CAPTCHA image")

    add_heading(doc, "B.2. Browsing and adopting pets", 2)
    add_figure(doc, "B.3", "Pet listing page with active filters",
        "Screenshot showing species=dog, size=medium filters with card grid results")
    add_p(doc,
        "The Adopt page displays all available pets in a responsive card grid. Users "
        "can filter by species, breed, sex, size, city, age range, and 11 behavioural "
        "traits. Each card shows the pet's photo, name, species, age, size, and location. "
        "Clicking a card opens the detail page."
    )
    add_figure(doc, "B.4", "Pet detail page with adoption button",
        "Screenshot showing pet photo gallery, trait badges, map, and 'Apply to Adopt' button")
    add_p(doc,
        "The detail page shows the full photo gallery, description, health and behavioural "
        "traits as colour-coded badges, a map showing the pet's location, and shelter "
        "information if applicable. The 'Apply to Adopt' button opens a form where the "
        "user writes a motivation message."
    )

    add_heading(doc, "B.3. Reporting a lost pet", 2)
    add_figure(doc, "B.5", "Lost pet report form with address picker",
        "Screenshot of the report form with species, colour, description, address picker, photo upload")
    add_p(doc,
        "The Report Lost page provides a comprehensive form including pet identity "
        "(name, species, breed, colour), the date and location of the loss (with the "
        "AddressPicker component for address selection), contact information (phone, "
        "email), a description field, reward amount, and a photo upload. Submitted "
        "reports appear immediately on the interactive map."
    )
    add_figure(doc, "B.6", "Lost pets map view with marker popups",
        "Screenshot of the full-page map with markers around Polish cities")

    add_heading(doc, "B.4. Blog and community", 2)
    add_figure(doc, "B.7", "Blog article editor with rich text toolbar",
        "Screenshot of the Fluent Editor with formatting toolbar, image, and code block")
    add_p(doc,
        "Authenticated users can write blog articles using the WYSIWYG editor. Articles "
        "are organised by categories and tags. Readers can leave threaded comments and "
        "bookmark articles for later reading."
    )

    add_heading(doc, "B.5. Shelter directory", 2)
    add_figure(doc, "B.8", "Shelter listing with map previews",
        "Screenshot showing shelter cards with embedded map previews in a grid layout")
    add_p(doc,
        "The Shelters page lists all registered shelters with their logo, name, "
        "location, capacity statistics, and a small map preview. Clicking a shelter "
        "opens a detail page with full contact information, social media links, "
        "and a list of pets available at that shelter."
    )

    add_heading(doc, "B.6. Messaging and notifications", 2)
    add_figure(doc, "B.9", "Private messaging interface (two-pane layout)",
        "Screenshot of the messages view with contact list on left and conversation thread on right")
    add_p(doc,
        "Friends can exchange private messages through a two-pane interface. The left "
        "panel shows active contacts; the right panel displays the conversation thread "
        "with read indicators. The notification bell in the navbar shows unread count "
        "badges and provides inline actions for friend request management."
    )

    page_break(doc)

    # =====================================================================
    # Appendix C — API Reference
    # =====================================================================
    add_heading(doc, "Appendix C. API endpoint reference", 1)
    add_p(doc,
        "The following tables document the principal API endpoints. All endpoints use "
        "the base URL http://localhost:8000 and accept/return JSON unless noted."
    )

    add_table(doc, "C.1", "Pet management endpoints",
        ["Method", "Path", "Auth", "Description"],
        [
            ["GET", "/pet/", "—", "List pets (filterable, paginated)"],
            ["POST", "/pet/", "JWT", "Create new pet listing"],
            ["GET", "/pet/{id}/", "—", "Retrieve pet details"],
            ["PATCH", "/pet/{id}/", "JWT (owner)", "Update pet listing"],
            ["DELETE", "/pet/{id}/", "JWT (owner/admin)", "Delete pet listing"],
            ["POST", "/pet/{id}/favorite/", "JWT", "Toggle favourite status"],
            ["GET", "/pet/favorites/", "JWT", "List user's favourited pets"],
            ["POST", "/pet/{id}/apply/", "JWT", "Submit adoption application"],
            ["GET", "/pet/my-adoptions/", "JWT", "List user's applications"],
        ]
    )

    add_table(doc, "C.2", "Lost pet endpoints",
        ["Method", "Path", "Auth", "Description"],
        [
            ["GET", "/pet/lost/", "—", "List lost pets (filterable)"],
            ["POST", "/pet/lost/", "JWT", "Report a lost pet"],
            ["GET", "/pet/lost/{id}/", "—", "Retrieve lost pet details"],
            ["PATCH", "/pet/lost/{id}/", "JWT (reporter)", "Update report (e.g., mark FOUND)"],
            ["DELETE", "/pet/lost/{id}/", "JWT (reporter/admin)", "Remove report"],
        ]
    )

    add_table(doc, "C.3", "User and social endpoints",
        ["Method", "Path", "Auth", "Description"],
        [
            ["POST", "/user/token/", "—", "Login (CAPTCHA + credentials → JWT)"],
            ["POST", "/user/token/refresh/", "—", "Refresh access token"],
            ["POST", "/user/register/", "—", "Create new account"],
            ["GET", "/user/captcha/", "—", "Generate CAPTCHA image"],
            ["GET", "/user/profile/", "JWT", "Get current user profile"],
            ["PATCH", "/user/profile/", "JWT", "Update profile"],
            ["GET", "/user/profile/{id}/", "—", "View another user's profile"],
            ["POST", "/user/friends/", "JWT", "Send friend request"],
            ["PATCH", "/user/friends/{id}/", "JWT", "Accept/reject request"],
            ["GET", "/user/messages/", "JWT", "List conversations"],
            ["POST", "/user/messages/", "JWT", "Send private message"],
            ["GET", "/user/notifications/", "JWT", "List notifications"],
            ["PATCH", "/user/notifications/{id}/", "JWT", "Mark as read"],
        ]
    )

    add_table(doc, "C.4", "Blog and comment endpoints",
        ["Method", "Path", "Auth", "Description"],
        [
            ["GET", "/blog/articles/", "—", "List articles (paginated, searchable)"],
            ["POST", "/blog/articles/", "JWT", "Create article"],
            ["GET", "/blog/articles/{id}/", "—", "Retrieve article (increments view count)"],
            ["PATCH", "/blog/articles/{id}/", "JWT (author)", "Update article"],
            ["POST", "/blog/articles/{id}/favorite/", "JWT", "Toggle bookmark"],
            ["GET", "/blog/categories/", "—", "List categories (hierarchical)"],
            ["GET", "/blog/tags/", "—", "List tags with article counts"],
            ["GET", "/blog/comments/", "—", "List comments for an object"],
            ["POST", "/blog/comments/", "JWT", "Create comment/reply"],
        ]
    )

    add_table(doc, "C.5", "Donation and shelter endpoints",
        ["Method", "Path", "Auth", "Description"],
        [
            ["GET", "/pet/donations/", "—", "List donations"],
            ["POST", "/pet/donations/", "JWT", "Submit donation"],
            ["POST", "/pet/donations/{id}/approve/", "JWT (admin)", "Approve donation → create pet"],
            ["GET", "/pet/shelters/", "—", "List shelters"],
            ["GET", "/pet/shelters/{id}/", "—", "Shelter details with pet list"],
        ]
    )

    page_break(doc)

    # =====================================================================
    # Appendix D — List of Figures / List of Tables (placeholders)
    # =====================================================================
    add_heading(doc, "Appendix D. List of figures", 1)
    add_p(doc,
        "[This appendix will be auto-generated by the word processor. Insert a "
        "Table of Figures field here referencing the 'Figure' caption style.]",
        italic=True)

    add_heading(doc, "Appendix E. List of tables", 1)
    add_p(doc,
        "[This appendix will be auto-generated by the word processor. Insert a "
        "Table of Tables field here referencing the 'Table' caption style.]",
        italic=True)

    page_break(doc)

    # =====================================================================
    # Bibliography
    # =====================================================================
    add_heading(doc, "Bibliography", 1)

    refs = [
        '[1]  Django Software Foundation, "Django documentation -- version 5.1," 2024. '
        '[Online]. Available: https://docs.djangoproject.com/en/5.1/. '
        '[Accessed: Jan. 2025].',

        '[2]  T. Christie, "Django REST Framework -- Web APIs for Django," 2024. '
        '[Online]. Available: https://www.django-rest-framework.org/. '
        '[Accessed: Jan. 2025].',

        '[3]  The PostgreSQL Global Development Group, "PostgreSQL 16 Documentation," '
        '2024. [Online]. Available: https://www.postgresql.org/docs/16/. '
        '[Accessed: Jan. 2025].',

        '[4]  PostGIS Development Team, "PostGIS 3.4 Documentation," 2024. '
        '[Online]. Available: https://postgis.net/documentation/. '
        '[Accessed: Jan. 2025].',

        '[5]  Meta Platforms, Inc., "React -- A JavaScript library for building user '
        'interfaces," 2024. [Online]. Available: https://react.dev/. '
        '[Accessed: Jan. 2025].',

        '[6]  Microsoft, "TypeScript Documentation," 2024. '
        '[Online]. Available: https://www.typescriptlang.org/docs/. '
        '[Accessed: Jan. 2025].',

        '[7]  E. You, "Vite -- Next Generation Frontend Tooling," 2024. '
        '[Online]. Available: https://vitejs.dev/. '
        '[Accessed: Jan. 2025].',

        '[8]  Mapbox Inc., "Mapbox GL JS -- Interactive, customizable vector maps," '
        '2024. [Online]. Available: https://docs.mapbox.com/mapbox-gl-js/. '
        '[Accessed: Jan. 2025].',

        '[9]  Mapbox Inc., "Mapbox Geocoding API v5," 2024. '
        '[Online]. Available: https://docs.mapbox.com/api/search/geocoding/. '
        '[Accessed: Jan. 2025].',

        '[10] OpenStreetMap Contributors, "Nominatim -- Open-source geocoding," 2024. '
        '[Online]. Available: https://nominatim.org/. '
        '[Accessed: Jan. 2025].',

        '[11] Docker Inc., "Docker Documentation," 2024. '
        '[Online]. Available: https://docs.docker.com/. '
        '[Accessed: Jan. 2025].',

        '[12] D. Scherer et al., "Gunicorn -- Python WSGI HTTP Server for UNIX," 2024. '
        '[Online]. Available: https://gunicorn.org/. '
        '[Accessed: Jan. 2025].',

        '[13] D. Abramov and A. Clark, "React Router -- Declarative Routing for React," '
        '2024. [Online]. Available: https://reactrouter.com/. '
        '[Accessed: Jan. 2025].',

        '[14] D. Akerman, "Zustand -- Bear necessities for state management in React," '
        '2024. [Online]. Available: https://github.com/pmndrs/zustand. '
        '[Accessed: Jan. 2025].',

        '[15] M. Bierman et al., "axios -- Promise based HTTP client for the browser and '
        'Node.js," 2024. [Online]. Available: https://axios-http.com/. '
        '[Accessed: Jan. 2025].',

        '[16] React-Bootstrap Contributors, "React-Bootstrap -- React components for '
        'Bootstrap 5," 2024. [Online]. Available: https://react-bootstrap.github.io/. '
        '[Accessed: Jan. 2025].',

        '[17] European Pet Food Industry Federation (FEDIAF), "Annual Report 2023," 2023. '
        '[Online]. Available: https://fediaf.org/.',

        '[18] Sejm Rzeczypospolitej Polskiej, "Ustawa z dnia 21 sierpnia 1997 r. o ochronie '
        'zwierzat (Dz.U. 1997 nr 111 poz. 724)," 1997. [Online]. Available: '
        'https://isap.sejm.gov.pl/.',

        '[19] Petfinder, "Petfinder -- Adopt a Pet," 2024. '
        '[Online]. Available: https://www.petfinder.com/. '
        '[Accessed: Jan. 2025].',

        '[20] Adopt-a-Pet, "Adopt-a-Pet.com -- Pet Adoption," 2024. '
        '[Online]. Available: https://www.adoptapet.com/. '
        '[Accessed: Jan. 2025].',

        '[21] A. Clark, "Immer -- Create the next immutable state by mutating the current '
        'one," 2024. [Online]. Available: https://immerjs.github.io/immer/. '
        '[Accessed: Jan. 2025].',

        '[22] M. Erickson, "djangorestframework-simplejwt," 2024. '
        '[Online]. Available: https://github.com/jazzband/djangorestframework-simplejwt. '
        '[Accessed: Jan. 2025].',

        '[23] Django Filter Contributors, "django-filter -- Reusable Django Filter," 2024. '
        '[Online]. Available: https://django-filter.readthedocs.io/. '
        '[Accessed: Jan. 2025].',

        '[24] D. Evans, "WhiteNoise -- Radically simplified static file serving for Python '
        'web apps," 2024. [Online]. Available: https://whitenoise.readthedocs.io/. '
        '[Accessed: Jan. 2025].',

        '[25] A. Clark et al., "Pillow -- The friendly Python Imaging Library fork," 2024. '
        '[Online]. Available: https://pillow.readthedocs.io/. '
        '[Accessed: Jan. 2025].',

        '[26] M. Hamidi, "DOMPurify -- A DOM-only, super-fast, uber-tolerant XSS '
        'sanitiser for HTML," 2024. [Online]. Available: https://github.com/cure53/'
        'DOMPurify. [Accessed: Jan. 2025].',

        '[27] OpenTiny, "@opentiny/fluent-editor -- A rich text editor based on Quill," '
        '2024. [Online]. Available: https://github.com/opentiny/fluent-editor. '
        '[Accessed: Jan. 2025].',

        '[28] Supercluster Contributors, "Supercluster -- A very fast geospatial point '
        'clustering library," 2024. [Online]. Available: https://github.com/mapbox/'
        'supercluster. [Accessed: Jan. 2025].',
    ]

    for ref in refs:
        add_p(doc, ref, first_line_indent=0, space_before=3, space_after=3,
              font_size=10)

    print("  ✓ Phase 6 complete: Appendices + Bibliography")
