"""Phase 1: Front matter — title placeholders, English summary, Polish summary, TOC."""

from thesis_utils import *


def write_front_matter(doc):
    # ── Title page placeholder ──
    add_p(doc, "[TITLE PAGE – TO BE COMPLETED LATER]", font_size=14, bold=True,
          alignment=WD_ALIGN_PARAGRAPH.CENTER, color=(128, 128, 128),
          first_line_indent=0, space_before=100, space_after=100)
    page_break(doc)

    add_p(doc, "[STUDENT INFO / CV PAGE – TO BE COMPLETED LATER]", font_size=14,
          bold=True, alignment=WD_ALIGN_PARAGRAPH.CENTER, color=(128, 128, 128),
          first_line_indent=0, space_before=100, space_after=100)
    page_break(doc)

    # ── SUMMARY (English) ──
    add_p(doc, "SUMMARY", font_size=14, bold=True,
          alignment=WD_ALIGN_PARAGRAPH.CENTER, first_line_indent=0, space_after=16)
    add_p(doc,
        "Thesis title: StrayPet – A Comprehensive Web Platform for Stray Pet Adoption "
        "and Management", bold=True, first_line_indent=0, space_after=12)

    add_p(doc,
        "The StrayPet platform is a full-stack web application designed to address the "
        "growing challenge of stray animal management and adoption in Poland and beyond. "
        "The system provides a comprehensive digital ecosystem connecting animal shelters, "
        "pet owners, individual donors, and potential adopters through an intuitive, "
        "responsive web interface. Unlike existing solutions that focus narrowly on pet "
        "listings, StrayPet integrates multiple interconnected modules into a single "
        "platform: pet adoption with intelligent preference matching, lost-pet tracking "
        "with interactive map-based geolocation, a pet donation workflow with "
        "administrative review, a shelter management system with capacity tracking, a "
        "community blog with rich-text editing and threaded discussions, a holiday-family "
        "certification programme, and a social layer featuring friendships, private "
        "messaging, and a unified notification centre."
    )
    add_p(doc,
        "The server side is implemented using Django 5.1 with Django REST Framework 3.15, "
        "exposing 87 RESTful API endpoints secured by JSON Web Token (JWT) authentication "
        "with CAPTCHA protection. PostgreSQL 16 with the PostGIS extension serves as the "
        "relational database, enabling efficient geographic queries that underpin the map-based "
        "features of the platform. Address geocoding uses a dual-provider strategy: the Mapbox "
        "Geocoding API as the primary service with an automatic fallback to the OpenStreetMap "
        "Nominatim service, plus a 24-hour result cache that minimises external API calls. "
        "Business logic is largely event-driven, implemented through Django signals that "
        "manage the pet-status state machine (draft → available → pending → adopted, and "
        "separately the lost → found workflow), ensuring data consistency regardless of "
        "whether changes originate from the REST API or the Django Admin interface."
    )
    add_p(doc,
        "The client side is built with React 19 and TypeScript, using Vite 7 with the SWC "
        "compiler for fast development builds and optimised production bundles. The user "
        "interface relies on React Bootstrap for responsive layout, Mapbox GL JS for "
        "WebGL-rendered interactive maps with custom markers, and @opentiny/fluent-editor "
        "(a Quill-based WYSIWYG editor) for blog article creation. State management follows "
        "a multi-tier approach: React Context for authentication, Zustand with Immer for "
        "global UI state, URL search parameters for filter/pagination state, and ahooks "
        "useRequest for API data fetching. All routes are code-split via React.lazy() with "
        "a custom error-recovery wrapper, and heavy libraries such as DOMPurify are dynamically "
        "imported only when needed."
    )
    add_p(doc,
        "The entire application is containerised using Docker and Docker Compose, "
        "orchestrating a PostGIS database container, a Django/Gunicorn application container "
        "(based on Python 3.12-slim with GDAL/GEOS/PROJ for GeoDjango), and an Adminer "
        "container for database administration. This thesis documents the complete "
        "development process from requirements analysis and technology evaluation through "
        "system design, implementation, testing, and deployment, demonstrating the effective "
        "application of modern web development practices."
    )

    add_p(doc, "", font_size=4, first_line_indent=0)
    add_p_multi(doc, [
        ("Key words: ", True),
        ("Web Application, Pet Adoption, Django, Django REST Framework, React, TypeScript, "
         "PostgreSQL, PostGIS, Mapbox, JWT Authentication, REST API, Docker, Geolocation, "
         "Responsive Design, Zustand, Vite", False, True)
    ], first_line_indent=0, space_before=8)

    page_break(doc)

    # ── STRESZCZENIE (Polish) ──
    add_p(doc, "STRESZCZENIE", font_size=14, bold=True,
          alignment=WD_ALIGN_PARAGRAPH.CENTER, first_line_indent=0, space_after=16)
    add_p(doc,
        "Tytuł: StrayPet – Kompleksowa platforma internetowa do adopcji "
        "i zarządzania bezdomnymi zwierzętami",
        bold=True, first_line_indent=0, space_after=12)

    add_p(doc,
        "Platforma StrayPet to kompleksowa aplikacja internetowa typu full-stack, "
        "zaprojektowana w celu rozwiązania rosnącego problemu zarządzania bezdomnymi "
        "zwierzętami i ich adopcji w Polsce i poza jej granicami. System zapewnia cyfrowy "
        "ekosystem łączący schroniska dla zwierząt, właścicieli zwierząt, indywidualnych "
        "darczyńców i potencjalnych adoptujących poprzez intuicyjny, responsywny interfejs "
        "internetowy. W przeciwieństwie do istniejących rozwiązań, które koncentrują się "
        "wąsko na listach zwierząt, StrayPet integruje wiele wzajemnie połączonych modułów "
        "w jedną platformę: adopcję zwierząt z inteligentnym dopasowaniem preferencji, "
        "śledzenie zaginionych zwierząt z interaktywną geolokalizacją na mapie, proces "
        "przekazywania zwierząt z przeglądem administracyjnym, system zarządzania "
        "schroniskami ze śledzeniem pojemności, blog społecznościowy z edytorem tekstu "
        "sformatowanego i wątkami dyskusyjnymi, program certyfikacji rodzin wakacyjnych "
        "oraz warstwę społecznościową obejmującą przyjaźnie, prywatne wiadomości "
        "i zunifikowane centrum powiadomień."
    )
    add_p(doc,
        "Strona serwerowa została zaimplementowana przy użyciu Django 5.1 z Django REST "
        "Framework 3.15, udostępniając 87 endpointów RESTful API zabezpieczonych "
        "uwierzytelnianiem JSON Web Token (JWT) z ochroną CAPTCHA. PostgreSQL 16 "
        "z rozszerzeniem PostGIS służy jako relacyjna baza danych, umożliwiając efektywne "
        "zapytania geograficzne stanowiące podstawę funkcji mapowych platformy. "
        "Geokodowanie adresów wykorzystuje strategię dwóch dostawców: API Mapbox Geocoding "
        "jako główną usługę z automatycznym przełączaniem na usługę OpenStreetMap Nominatim, "
        "plus 24-godzinny cache wyników minimalizujący wywołania zewnętrznych API. "
        "Logika biznesowa jest w dużej mierze sterowana zdarzeniami, zaimplementowana "
        "poprzez sygnały Django zarządzające maszyną stanów statusu zwierzęcia."
    )
    add_p(doc,
        "Strona kliencka zbudowana jest w oparciu o React 19 i TypeScript, wykorzystując "
        "Vite 7 z kompilatorem SWC. Interfejs użytkownika bazuje na React Bootstrap dla "
        "responsywnego układu, Mapbox GL JS dla interaktywnych map renderowanych przez "
        "WebGL oraz @opentiny/fluent-editor dla tworzenia artykułów blogowych. Zarządzanie "
        "stanem aplikacji realizowane jest wielowarstwowo: React Context dla uwierzytelniania, "
        "Zustand z Immer dla globalnego stanu UI, parametry URL dla filtrów i paginacji "
        "oraz ahooks useRequest do pobierania danych z API. Całość aplikacji jest "
        "konteneryzowana przy użyciu Docker i Docker Compose."
    )
    add_p(doc,
        "Niniejsza praca dokumentuje kompletny proces tworzenia aplikacji, od analizy "
        "wymagań i ewaluacji technologii, przez projekt systemu, implementację, testowanie "
        "i wdrożenie, demonstrując skuteczne zastosowanie nowoczesnych praktyk "
        "programistycznych.",
    )

    add_p(doc, "", font_size=4, first_line_indent=0)
    add_p_multi(doc, [
        ("Słowa kluczowe: ", True),
        ("Aplikacja internetowa, Adopcja zwierząt, Django, Django REST Framework, React, "
         "TypeScript, PostgreSQL, PostGIS, Mapbox, Uwierzytelnianie JWT, REST API, Docker, "
         "Geolokalizacja, Responsywny design, Zustand, Vite", False, True)
    ], first_line_indent=0, space_before=8)

    page_break(doc)

    # ── TABLE OF CONTENTS placeholder ──
    add_p(doc, "Contents", font_size=14, bold=True, first_line_indent=0, space_after=16)
    add_p(doc,
        "[AUTO-GENERATE TABLE OF CONTENTS IN WORD: References → Table of Contents → "
        "Automatic Table. Update before submission by right-clicking → Update Field.]",
        font_size=10, italic=True, color=(128, 128, 128), first_line_indent=0)
    page_break(doc)

    print("  ✓ Phase 1 complete: front matter")
