"""
Generate FULL thesis content for StrayPet project.
Based on WUT formatting requirements + BSC thesis reference structure.
Focuses on body content (Chapters 1-6 + Appendices), skipping cover/student info pages.
"""

from docx import Document
from docx.shared import Pt, Cm, Mm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml


def set_font(run, font_name="Arial", font_size=11, bold=False, italic=False, color=None):
    """Set font properties on a run."""
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)
    rPr = run._element.get_or_add_rPr()
    rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{font_name}" w:hAnsi="{font_name}" w:eastAsia="{font_name}" w:cs="{font_name}"/>')
    rPr.insert(0, rFonts)


def add_p(doc, text, font_size=11, bold=False, italic=False,
          alignment=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=4,
          font_name="Arial", color=None, first_line_indent=0.5):
    """Add a body paragraph."""
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_font(run, font_name, font_size, bold, italic, color)
    p.alignment = alignment
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if first_line_indent:
        p.paragraph_format.first_line_indent = Cm(first_line_indent)
    return p


def add_p_multi(doc, segments, alignment=WD_ALIGN_PARAGRAPH.JUSTIFY, 
                space_before=0, space_after=4, first_line_indent=0.5):
    """Add a paragraph with multiple styled segments.
    segments: list of (text, bold, italic) or (text, bold) or (text,)
    """
    p = doc.add_paragraph()
    for seg in segments:
        text = seg[0]
        b = seg[1] if len(seg) > 1 else False
        it = seg[2] if len(seg) > 2 else False
        run = p.add_run(text)
        set_font(run, bold=b, italic=it)
    p.alignment = alignment
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if first_line_indent:
        p.paragraph_format.first_line_indent = Cm(first_line_indent)
    return p


def add_heading(doc, text, level=1):
    """Add heading: Level 1=14pt, Level 2=13pt, Level 3=12pt."""
    sizes = {1: 14, 2: 13, 3: 12}
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        set_font(run, font_size=sizes.get(level, 11), bold=True, color=(0, 0, 0))
    h.paragraph_format.line_spacing = 1.15
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(8)
    return h


def add_bullet(doc, text, indent=0):
    """Add a bullet point."""
    p = doc.add_paragraph(style='List Bullet')
    p.clear()
    run = p.add_run("– " + text)
    set_font(run)
    p.paragraph_format.line_spacing = 1.15
    if indent > 0:
        p.paragraph_format.left_indent = Cm(indent * 1.27)
    return p


def add_code_block(doc, code_text, caption=""):
    """Add a formatted code block."""
    if caption:
        add_p(doc, caption, font_size=9, italic=True, first_line_indent=0, space_before=8)
    for line in code_text.split('\n'):
        p = doc.add_paragraph()
        run = p.add_run(line)
        set_font(run, font_name="Consolas", font_size=9)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.left_indent = Cm(1)


def add_table_with_title(doc, title_num, title_text, headers, rows):
    """Add a titled table per formatting requirements."""
    # Table title above table, left-aligned, sans-serif 9pt
    add_p(doc, f"Table {title_num}. {title_text}", font_size=9, bold=False,
          first_line_indent=0, space_before=12, space_after=4)
    
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Table Grid'
    
    # Header row
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ""
        run = cell.paragraphs[0].add_run(header)
        set_font(run, font_size=9, bold=True)
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="D9E2F3"/>')
        cell._tc.get_or_add_tcPr().append(shading)
    
    # Data rows
    for r_idx, row_data in enumerate(rows):
        for c_idx, cell_text in enumerate(row_data):
            cell = table.rows[r_idx + 1].cells[c_idx]
            cell.text = ""
            run = cell.paragraphs[0].add_run(str(cell_text))
            set_font(run, font_size=9)
    
    return table


def add_figure_placeholder(doc, fig_num, caption, instruction=""):
    """Add a figure placeholder with caption."""
    p = add_p(doc, f"[INSERT FIGURE: {instruction or caption}]",
              font_size=10, italic=True, color=(128, 128, 128),
              alignment=WD_ALIGN_PARAGRAPH.CENTER, first_line_indent=0,
              space_before=12, space_after=4)
    # Caption below figure
    add_p(doc, f"Figure {fig_num}. {caption}", font_size=9,
          first_line_indent=0, space_before=2, space_after=8,
          alignment=WD_ALIGN_PARAGRAPH.LEFT)
    return p


def add_source(doc, source_text):
    """Add source attribution below a figure or table."""
    add_p(doc, f"Source: {source_text}", font_size=9, italic=True,
          first_line_indent=0, space_before=0, space_after=8)


def page_break(doc):
    doc.add_page_break()


def setup_document(doc):
    """Configure document-level styles and page setup."""
    # Default style
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)
    style.paragraph_format.line_spacing = 1.15
    rPr = style.element.get_or_add_rPr()
    rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>')
    rPr.insert(0, rFonts)
    
    # Heading styles
    for level, size in [(1, 14), (2, 13), (3, 12)]:
        sn = f'Heading {level}'
        if sn in doc.styles:
            hs = doc.styles[sn]
            hs.font.name = 'Arial'
            hs.font.size = Pt(size)
            hs.font.bold = True
            hs.font.color.rgb = RGBColor(0, 0, 0)
            hs.paragraph_format.line_spacing = 1.15
    
    # Page margins: inner 30mm, outer 20mm, top/bottom 25mm
    section = doc.sections[0]
    section.top_margin = Mm(25)
    section.bottom_margin = Mm(25)
    section.left_margin = Mm(30)
    section.right_margin = Mm(20)
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    
    # Mirror margins
    sectPr = section._sectPr
    mirror = parse_xml(f'<w:mirrorMargins {nsdecls("w")}/>')
    sectPr.append(mirror)
    
    # Page numbers at bottom
    footer = section.footer
    footer.is_linked_to_previous = False
    fp = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run1 = fp.add_run()
    run1._element.append(parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="begin"/>'))
    run2 = fp.add_run()
    run2._element.append(parse_xml(f'<w:instrText {nsdecls("w")} xml:space="preserve"> PAGE </w:instrText>'))
    run3 = fp.add_run()
    run3._element.append(parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="end"/>'))
    for r in [run1, run2, run3]:
        r.font.name = "Arial"
        r.font.size = Pt(9)


# ===========================================================================
# MAIN THESIS CONTENT GENERATION
# ===========================================================================
def generate():
    doc = Document()
    setup_document(doc)
    
    # Title page placeholder
    add_p(doc, "[TITLE PAGE - TO BE COMPLETED LATER]", font_size=14, bold=True,
          alignment=WD_ALIGN_PARAGRAPH.CENTER, color=(128, 128, 128), first_line_indent=0,
          space_before=100, space_after=100)
    page_break(doc)
    
    add_p(doc, "[STUDENT INFO / CV PAGE - TO BE COMPLETED LATER]", font_size=14, bold=True,
          alignment=WD_ALIGN_PARAGRAPH.CENTER, color=(128, 128, 128), first_line_indent=0,
          space_before=100, space_after=100)
    page_break(doc)

    # ===================================================================
    # SUMMARY
    # ===================================================================
    add_p(doc, "SUMMARY", font_size=14, bold=True,
          alignment=WD_ALIGN_PARAGRAPH.CENTER, first_line_indent=0, space_after=16)
    
    add_p(doc, 
        "The StrayPet platform is a full-stack web application designed to address the growing "
        "challenge of stray animal management and adoption in Poland and beyond. The system "
        "provides a comprehensive digital ecosystem connecting shelters, pet owners, and potential "
        "adopters through an intuitive, responsive interface. The platform encompasses multiple "
        "interconnected modules: pet adoption with intelligent preference matching, lost pet "
        "tracking with interactive map-based geolocation, a pet donation workflow with administrative "
        "review, a shelter management system, a community blog with threaded discussions, a holiday "
        "family certification program, and real-time notifications with social features including "
        "friendships and private messaging."
    )
    add_p(doc,
        "The backend is implemented using Django 5.1 with Django REST Framework, providing a "
        "RESTful API secured by JWT authentication. PostgreSQL with the PostGIS extension serves "
        "as the database, enabling efficient geographic queries for map-based features. Address "
        "geocoding is accomplished through a dual-provider strategy using the Mapbox API as the "
        "primary service with OpenStreetMap Nominatim as a fallback. The frontend is built with "
        "React 19 and TypeScript, utilizing Vite 7 as the build tool, Mapbox GL JS for interactive "
        "maps, and React Bootstrap for the user interface components. The entire application is "
        "containerized using Docker and Docker Compose for reproducible deployment."
    )
    add_p(doc,
        "This thesis documents the complete development process of StrayPet, from requirements "
        "analysis and technology evaluation through system design, implementation, and testing. "
        "The project demonstrates the effective application of modern web development practices "
        "including component-based architecture, signal-driven state management, automatic geocoding, "
        "and code-split lazy loading, resulting in a functional and extensible platform."
    )
    add_p(doc, "", font_size=4, first_line_indent=0)
    add_p_multi(doc, [("Key words: ", True), 
        ("Web Application, Pet Adoption, Django, Django REST Framework, React, TypeScript, "
         "PostgreSQL, PostGIS, Mapbox, JWT Authentication, REST API, Docker, Geolocation, "
         "Responsive Design", False, True)],
        first_line_indent=0, space_before=8)
    
    page_break(doc)
    
    # STRESZCZENIE (Polish)
    add_p(doc, "STRESZCZENIE", font_size=14, bold=True,
          alignment=WD_ALIGN_PARAGRAPH.CENTER, first_line_indent=0, space_after=16)
    add_p(doc, "Tytuł: StrayPet – Kompleksowa platforma internetowa do adopcji i zarządzania bezdomnymi zwierzętami",
          bold=True, first_line_indent=0, space_after=12)
    
    add_p(doc,
        "Platforma StrayPet to kompleksowa aplikacja internetowa zaprojektowana w celu "
        "rozwiązania rosnącego problemu zarządzania bezdomnymi zwierzętami i ich adopcji "
        "w Polsce i poza jej granicami. System zapewnia cyfrowy ekosystem łączący schroniska, "
        "właścicieli zwierząt i potencjalnych adoptujących poprzez intuicyjny, responsywny "
        "interfejs. Platforma obejmuje wiele wzajemnie połączonych modułów: adopcję zwierząt "
        "z inteligentnym dopasowaniem preferencji, śledzenie zaginionych zwierząt z interaktywną "
        "geolokalizacją na mapie, proces przekazywania zwierząt z przeglądem administracyjnym, "
        "system zarządzania schroniskami, blog społecznościowy z wątkami dyskusyjnymi, program "
        "certyfikacji rodzin wakacyjnych oraz powiadomienia w czasie rzeczywistym z funkcjami "
        "społecznościowymi, takimi jak przyjaźnie i prywatne wiadomości."
    )
    add_p(doc,
        "Backend został zaimplementowany przy użyciu Django 5.1 z Django REST Framework, "
        "udostępniając RESTful API zabezpieczone uwierzytelnianiem JWT. PostgreSQL z rozszerzeniem "
        "PostGIS służy jako baza danych, umożliwiając efektywne zapytania geograficzne dla funkcji "
        "opartych na mapach. Geokodowanie adresów realizowane jest poprzez strategię dwóch "
        "dostawców, wykorzystując API Mapbox jako główną usługę z OpenStreetMap Nominatim jako "
        "rezerwą. Frontend zbudowany jest w oparciu o React 19 i TypeScript, wykorzystując "
        "Vite 7 jako narzędzie budowania, Mapbox GL JS do interaktywnych map oraz React Bootstrap "
        "do komponentów interfejsu użytkownika. Całość aplikacji jest konteneryzowana przy użyciu "
        "Docker i Docker Compose, co zapewnia powtarzalne wdrożenie."
    )
    add_p(doc, "", font_size=4, first_line_indent=0)
    add_p_multi(doc, [("Słowa kluczowe: ", True),
        ("Aplikacja internetowa, Adopcja zwierząt, Django, Django REST Framework, React, TypeScript, "
         "PostgreSQL, PostGIS, Mapbox, Uwierzytelnianie JWT, REST API, Docker, Geolokalizacja, "
         "Responsywny design", False, True)],
        first_line_indent=0, space_before=8)
    
    page_break(doc)
    
    # TABLE OF CONTENTS PLACEHOLDER
    add_p(doc, "Contents", font_size=14, bold=True, first_line_indent=0, space_after=16)
    add_p(doc, "[AUTO-GENERATE TABLE OF CONTENTS IN WORD: References → Table of Contents → "
          "Automatic Table. Update before submission by right-clicking → Update Field.]",
          font_size=10, italic=True, color=(128,128,128), first_line_indent=0)
    page_break(doc)

    # ===================================================================
    # CHAPTER 1: INTRODUCTION
    # ===================================================================
    add_heading(doc, "1. Introduction", 1)
    
    # 1.1 Preface
    add_heading(doc, "1.1. Preface", 2)
    add_p(doc,
        "This document constitutes the written component of a Bachelor of Science thesis, "
        "submitted in fulfillment of the requirements for the Bachelor's Degree at the Faculty "
        "of Electronics and Information Technology, Warsaw University of Technology. The work "
        "was carried out during the academic year 2025/2026 under the supervision of "
        "[Supervisor Name, Ph.D.] from the Institute of Computer Science."
    )
    add_p(doc,
        "The thesis presents the design and implementation of StrayPet, a comprehensive web "
        "platform for stray pet adoption and management. The document covers all stages of "
        "the development process, from the initial problem analysis and technology evaluation "
        "through the detailed system design, implementation of both the backend and frontend "
        "components, and the testing and deployment strategy."
    )
    add_p(doc,
        "Stray and abandoned animals represent a significant social and ecological challenge "
        "across Europe. According to data from the European Pet Food Industry Federation "
        "(FEDIAF), an estimated 100 million stray cats and dogs live across Europe, with "
        "Poland alone operating over 200 registered animal shelters. The digitalization of "
        "pet adoption services has the potential to dramatically improve adoption rates by "
        "increasing the visibility of animals in need and simplifying the adoption process "
        "for prospective pet owners."
    )
    
    # 1.2 Objectives
    add_heading(doc, "1.2. Objectives of the project", 2)
    add_p(doc,
        "The primary objective of the StrayPet project is to develop a fully functional, "
        "production-ready web platform that streamlines the stray pet adoption workflow. "
        "The following specific objectives were established at the outset of the project:"
    )
    add_bullet(doc, "Design and implement a centralized pet listing system where shelters and individuals can register animals available for adoption, complete with detailed profiles including health status, behavioral traits, photographs, and geographic location.")
    add_bullet(doc, "Develop an adoption application workflow with status tracking (submitted, processing, approved, rejected, closed), enabling transparent communication between applicants and pet owners or shelter administrators.")
    add_bullet(doc, "Create a lost pet tracking module with map-based geolocation, allowing users to report missing animals with their last known location and enabling the public to assist in locating lost pets through an interactive map interface.")
    add_bullet(doc, "Implement an intelligent pet recommendation engine that matches users with suitable pets based on their stated preferences regarding species, size, age range, gender, and personality traits.")
    add_bullet(doc, "Build a community engagement platform including a blog system with rich text editing, threaded comments, article favoriting, and tag-based organization to foster knowledge sharing among pet enthusiasts.")
    add_bullet(doc, "Develop a holiday family certification program enabling users to apply as temporary foster families, with an administrative review workflow including document verification and photo submission.")
    add_bullet(doc, "Implement a comprehensive social system featuring friendships (request, accept, reject), private messaging with rate limiting, and a real-time notification center covering adoption updates, comment replies, friend requests, and administrative decisions.")
    add_bullet(doc, "Ensure the platform provides a responsive user experience across desktop and mobile devices, with accessibility considerations and intuitive navigation.")
    add_bullet(doc, "Deploy the system using containerized infrastructure (Docker) for reproducibility, scalability, and ease of maintenance.")
    
    # 1.3 Scope
    add_heading(doc, "1.3. Scope of the thesis", 2)
    add_p(doc,
        "The scope of this thesis encompasses the design, implementation, and evaluation of "
        "the StrayPet web platform. The project is divided into two main technical components:"
    )
    add_p_multi(doc, [
        ("Backend: ", True),
        ("A Django REST Framework API providing authentication (JWT), CRUD operations for all "
         "entities, geographic data processing (PostGIS, Mapbox geocoding), file upload management, "
         "and automated business logic through Django signals.", False)
    ])
    add_p_multi(doc, [
        ("Frontend: ", True),
        ("A React 19 Single Page Application (SPA) with TypeScript, featuring lazy-loaded routes, "
         "Mapbox GL JS interactive maps, rich text editing, and responsive UI components.", False)
    ])
    add_p(doc,
        "The following aspects are explicitly excluded from the current scope: native mobile "
        "applications (iOS/Android), payment gateway integration for donations, real-time "
        "WebSocket-based chat, integration with external veterinary record systems, and "
        "machine-learning-based pet image recognition. These areas are identified as potential "
        "future extensions in Chapter 6."
    )
    
    # 1.4 Structure of the document
    add_heading(doc, "1.4. Structure of the document", 2)
    add_p(doc,
        "This thesis is organized into six chapters and four appendices:", first_line_indent=0)
    add_bullet(doc, "Chapter 1 – Introduction: Presents the context, objectives, scope, and structure of the thesis.")
    add_bullet(doc, "Chapter 2 – Problem Analysis: Analyzes the methodology of work, system requirements, use cases, similar existing systems, and provides a detailed justification of the selected technologies.")
    add_bullet(doc, "Chapter 3 – System Design: Describes the overall architecture, database model, REST API design, and user interface design decisions.")
    add_bullet(doc, "Chapter 4 – Implementation: Provides a detailed account of the backend and frontend implementation, including code organization, key algorithms, and integration patterns.")
    add_bullet(doc, "Chapter 5 – Testing and Deployment: Covers the testing strategy, Docker-based deployment configuration, and performance considerations.")
    add_bullet(doc, "Chapter 6 – Conclusions: Summarizes the project achievements, evaluates the technology decisions, and proposes future development directions.")
    add_bullet(doc, "Appendix A – Installation Manual: Step-by-step setup instructions for both development and production environments.")
    add_bullet(doc, "Appendix B – User Manual: A visual guide to using the platform's features.")
    add_bullet(doc, "Appendix C – API Reference: Comprehensive listing of all REST API endpoints.")
    add_bullet(doc, "Appendix D – List of Figures and Tables.")
    
    page_break(doc)

    # ===================================================================
    # CHAPTER 2: PROBLEM ANALYSIS
    # ===================================================================
    add_heading(doc, "2. Problem analysis", 1)
    
    # 2.1 Methodology
    add_heading(doc, "2.1. Methodology of work", 2)
    add_p(doc,
        "The development of StrayPet followed an iterative, incremental approach inspired by "
        "Agile principles. Rather than attempting to design the entire system upfront, the "
        "project was organized into development cycles, each delivering a functional subset "
        "of features that could be tested and refined before proceeding to the next iteration."
    )
    add_p(doc,
        "Version control was managed using Git, with a branching strategy based on feature "
        "branches. Each significant feature was developed in its own branch and merged into "
        "the main branch upon completion. The repository is hosted remotely, enabling backup "
        "and access from multiple development environments."
    )
    add_p(doc,
        "The development workflow was further supported by a robust toolchain. The frontend "
        "project employs Husky for Git hooks, lint-staged for running linters on staged files "
        "before committing, Commitlint for enforcing conventional commit message formats, "
        "ESLint with TypeScript-specific rules for code quality, Stylelint for CSS/SCSS linting, "
        "and Prettier for consistent code formatting. These tools collectively ensure a high "
        "standard of code quality and consistency throughout the development process."
    )
    add_p(doc,
        "The development was organized into the following major iterations:"
    )
    add_bullet(doc, "Iteration 1: Project scaffold, database schema design, user authentication (JWT), basic CRUD for pets.")
    add_bullet(doc, "Iteration 2: Adoption workflow, pet filtering and search, responsive frontend layout.")
    add_bullet(doc, "Iteration 3: Lost pet module with map integration (Mapbox GL JS), geocoding service.")
    add_bullet(doc, "Iteration 4: Blog system with rich text editor, comment threading, view statistics.")
    add_bullet(doc, "Iteration 5: Shelter management, donation workflow with admin review, holiday family program.")
    add_bullet(doc, "Iteration 6: Social features (friendships, private messaging), notification system, user preferences and smart matching.")
    add_bullet(doc, "Iteration 7: Testing, bug fixes, performance optimization, Docker deployment, documentation.")
    
    # 2.2 System overview
    add_heading(doc, "2.2. System overview", 2)
    add_p(doc,
        "StrayPet is a client-server web application comprising a RESTful API backend and a "
        "Single Page Application (SPA) frontend. The system is designed to serve three primary "
        "categories of users: anonymous visitors who can browse available pets and read blog "
        "articles; registered users who can submit adoption applications, report lost pets, "
        "donate animals, write blog posts, and interact socially; and administrators who can "
        "manage all system data, review applications, and moderate content."
    )
    
    add_heading(doc, "2.2.1. Requirements analysis", 3)
    add_p(doc,
        "The functional and non-functional requirements for StrayPet were established through "
        "analysis of existing pet adoption platforms, identification of common pain points in "
        "the adoption process, and consideration of the Polish regulatory context for animal "
        "shelters. The requirements are presented below."
    )
    
    add_p(doc, "Functional Requirements", bold=True, first_line_indent=0, space_before=8)
    
    add_table_with_title(doc, "2.1", "Functional requirements of the StrayPet platform",
        ["ID", "Requirement", "Priority"],
        [
            ["FR1", "User registration with email verification code", "High"],
            ["FR2", "User login with CAPTCHA protection and JWT tokens", "High"],
            ["FR3", "User profile management (avatar, preferences, personal info)", "High"],
            ["FR4", "Password reset via email verification code", "High"],
            ["FR5", "Pet listing with photos, traits, health info, and location", "High"],
            ["FR6", "Multi-criteria pet filtering (species, sex, size, age, city, traits)", "High"],
            ["FR7", "Adoption application submission and status tracking", "High"],
            ["FR8", "Pet donation with multi-photo upload and admin review", "Medium"],
            ["FR9", "Lost pet reporting with geographic coordinates", "High"],
            ["FR10", "Interactive map display of lost pets (Mapbox GL JS)", "High"],
            ["FR11", "Shelter registration and management", "Medium"],
            ["FR12", "Pet favoriting (bookmark) for registered users", "Medium"],
            ["FR13", "Intelligent pet matching based on user preferences", "Medium"],
            ["FR14", "Blog article creation with rich text editor (FluentEditor)", "Medium"],
            ["FR15", "Threaded comment system with reply notifications", "Medium"],
            ["FR16", "Article favoriting and view count tracking", "Low"],
            ["FR17", "Holiday family application with document upload", "Medium"],
            ["FR18", "Holiday family admin review (approve/reject with reasons)", "Medium"],
            ["FR19", "Friendship system (request, accept, reject, block)", "Low"],
            ["FR20", "Private messaging with rate limiting (3/day for non-friends)", "Low"],
            ["FR21", "Notification center (replies, friend requests, admin decisions)", "Medium"],
            ["FR22", "Support ticket system (general, pet health, technical, etc.)", "Low"],
            ["FR23", "Blog archive by year/month with aggregated article counts", "Low"],
            ["FR24", "Tag-based article organization with popular tags display", "Low"],
        ]
    )
    
    add_p(doc, "", font_size=4, first_line_indent=0)
    add_p(doc, "Non-Functional Requirements", bold=True, first_line_indent=0, space_before=8)
    
    add_table_with_title(doc, "2.2", "Non-functional requirements of the StrayPet platform",
        ["ID", "Requirement", "Category"],
        [
            ["NFR1", "Responsive design for mobile and desktop browsers", "Usability"],
            ["NFR2", "RESTful API following HTTP method semantics", "Architecture"],
            ["NFR3", "JWT-based stateless authentication", "Security"],
            ["NFR4", "CAPTCHA protection against automated login attempts", "Security"],
            ["NFR5", "HTML sanitization (DOMPurify) to prevent XSS attacks", "Security"],
            ["NFR6", "Containerized deployment with Docker and Docker Compose", "Deployment"],
            ["NFR7", "File-based caching with configurable TTL (300s default)", "Performance"],
            ["NFR8", "Pagination for all list endpoints (configurable page size, max 100)", "Performance"],
            ["NFR9", "Code-split lazy loading for frontend routes", "Performance"],
            ["NFR10", "Automated geocoding with 24-hour result caching", "Performance"],
            ["NFR11", "CORS support for cross-origin frontend-backend communication", "Architecture"],
            ["NFR12", "Database indexing on frequently queried fields", "Performance"],
        ]
    )
    
    add_heading(doc, "2.2.2. Use cases", 3)
    add_p(doc,
        "The system supports three primary actor roles: Anonymous User, Registered User, and "
        "Administrator. The following use case descriptions outline the main interactions each "
        "actor can perform with the system."
    )
    
    add_figure_placeholder(doc, "2.1", "Use case diagram for the StrayPet platform",
        "Draw a UML Use Case diagram showing three actors (Anonymous, Registered, Admin) and their use cases")
    
    add_p(doc, "Anonymous User Use Cases", bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc, "UC1 – Browse Pets: View the list of available pets with filtering by species, sex, size, age, city, and behavioral traits. Each pet card displays a cover photo, name, species, age, and location.")
    add_bullet(doc, "UC2 – View Pet Details: Access detailed information about a pet including all photos, health status (vaccinated, sterilized, microchipped, dewormed), behavioral traits, shelter information, and contact details.")
    add_bullet(doc, "UC3 – View Lost Pets: Browse lost pet reports in list view or interactive map view. The map displays markers for each lost pet with their last known location.")
    add_bullet(doc, "UC4 – Read Blog Articles: Access the community blog to read articles about pet care, adoption guides, and community stories. View comments and article archives.")
    add_bullet(doc, "UC5 – View Shelters: Browse the list of animal shelters with their location on a map, contact information, and capacity statistics.")
    add_bullet(doc, "UC6 – Register: Create a new account by providing username, email, and password, verified through an email verification code.")
    
    add_p(doc, "Registered User Use Cases", bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc, "UC7 – Login/Logout: Authenticate using email/password with CAPTCHA verification. Receive JWT access and refresh tokens.")
    add_bullet(doc, "UC8 – Manage Profile: Update personal information, upload avatar, set pet preferences (species, size, age range, gender, traits), change password, update email.")
    add_bullet(doc, "UC9 – Submit Adoption Application: Apply to adopt a pet by providing a message. Track application status (submitted → processing → approved/rejected/closed).")
    add_bullet(doc, "UC10 – Favorite Pets: Add or remove pets from a personal favorites list for easy access.")
    add_bullet(doc, "UC11 – Report Lost Pet: Submit a lost pet report with photo, last known location (geocoded), physical description, reward amount, and contact information.")
    add_bullet(doc, "UC12 – Donate Pet: Submit a pet for adoption listing, including photos (up to 8), description, health traits, and location. Subject to admin review before publishing.")
    add_bullet(doc, "UC13 – Write Blog Article: Create articles using the FluentEditor rich text editor with image upload support. Tag articles with hashtags.")
    add_bullet(doc, "UC14 – Comment on Articles: Post comments on blog articles and reply to existing comments in a threaded fashion.")
    add_bullet(doc, "UC15 – Apply as Holiday Family: Submit an application with personal information, address, pet care capability details, motivation, ID document, and family photos.")
    add_bullet(doc, "UC16 – Manage Friendships: Send friend requests, accept or reject incoming requests, view friends list.")
    add_bullet(doc, "UC17 – Send Private Messages: Send direct messages to other users. Rate limited to 3 messages per day for non-friends.")
    add_bullet(doc, "UC18 – View Notifications: Access a notification center with unread count badge, covering comment replies, friend requests, and admin decisions on applications.")
    add_bullet(doc, "UC19 – Submit Support Ticket: Report issues or provide feedback through categorized tickets (general, pet health, adoption, lost/found, shelter, technical, feedback).")
    
    add_p(doc, "Administrator Use Cases", bold=True, first_line_indent=0, space_before=8)
    add_bullet(doc, "UC20 – Review Donations: Review pet donation submissions, approve (automatically creates Pet listing from donation data), or reject with notes.")
    add_bullet(doc, "UC21 – Review Adoption Applications: Process adoption applications, change status, approve or reject.")
    add_bullet(doc, "UC22 – Review Holiday Family Applications: Review applications, approve (sets user as certified holiday family) or reject with reason. Notifications sent automatically.")
    add_bullet(doc, "UC23 – Manage Shelters: Create, edit, and deactivate shelter profiles.")
    add_bullet(doc, "UC24 – Manage Users: View user list, access user details, manage administrative privileges.")
    add_bullet(doc, "UC25 – Handle Support Tickets: View, assign, and resolve support tickets.")
    
    # 2.3 Similar systems
    add_heading(doc, "2.3. Similar systems", 2)
    add_p(doc,
        "Prior to the development of StrayPet, an analysis of existing pet adoption platforms "
        "was conducted to identify common features, design patterns, and areas where improvement "
        "is possible. The following subsections examine three categories of existing solutions."
    )
    
    add_heading(doc, "2.3.1. Petfinder (petfinder.com)", 3)
    add_p(doc,
        "Petfinder is one of the largest and most established online pet adoption platforms "
        "globally, operating primarily in the United States and Canada since 1996. The platform "
        "aggregates pet listings from over 11,000 animal shelters and rescue organizations. "
        "Key features include advanced search filters (species, breed, age, size, gender, "
        "coat length, color), location-based search with distance radius, and integration with "
        "shelter management software."
    )
    add_p(doc,
        "Strengths of Petfinder include its massive database of adoptable animals, well-established "
        "brand recognition, and a mature API that enables third-party integrations. However, the "
        "platform lacks certain community features such as blog systems and social networking "
        "capabilities. Its geographic focus is limited to North America, and it does not provide "
        "a lost pet tracking system with map-based visualization."
    )
    
    add_heading(doc, "2.3.2. Adopt-a-Pet (adoptapet.com)", 3)
    add_p(doc,
        "Adopt-a-Pet is another prominent North American pet adoption platform, partnering with "
        "approximately 17,000 shelters. The platform differentiates itself with a clean, modern "
        "user interface and a focus on the user experience. It allows prospective adopters to "
        "create wish lists and receive alerts when matching animals become available."
    )
    add_p(doc,
        "While Adopt-a-Pet offers strong matching features, it similarly lacks community "
        "engagement tools, does not support lost pet tracking, and has no provisions for "
        "holiday/foster family programs. Its adoption workflow is basic, forwarding inquiries "
        "directly to shelters without providing an in-platform application tracking system."
    )
    
    add_heading(doc, "2.3.3. Polish and European platforms", 3)
    add_p(doc,
        "In Poland, pet adoption services are primarily offered through individual shelter "
        "websites and social media pages. Platforms such as adopciaki.pl and przygarnij.org "
        "provide centralized listings but with limited functionality compared to their North "
        "American counterparts. These platforms typically lack advanced filtering, map-based "
        "search, community features, and modern responsive design."
    )
    add_p(doc,
        "European-level platforms such as Puppies.com and EuroPetNet exist but tend to focus "
        "on breeders rather than shelter adoption, or serve as cross-border identification "
        "databases rather than adoption facilitators."
    )
    
    add_heading(doc, "2.3.4. Comparison summary", 3)
    add_p(doc,
        "The following table compares the features offered by the analyzed platforms against "
        "those implemented in StrayPet."
    )
    
    add_table_with_title(doc, "2.3", "Feature comparison of pet adoption platforms",
        ["Feature", "Petfinder", "Adopt-a-Pet", "Polish sites", "StrayPet"],
        [
            ["Pet listings with filtering", "Yes", "Yes", "Basic", "Yes"],
            ["Map-based pet search", "Distance only", "No", "No", "Yes (Mapbox)"],
            ["Adoption application tracking", "No (redirect)", "No (redirect)", "No", "Yes"],
            ["Lost pet tracking with map", "Limited", "No", "No", "Yes"],
            ["Pet donation with review", "No", "No", "No", "Yes"],
            ["Blog/community system", "Articles only", "No", "No", "Yes (rich text)"],
            ["Threaded comments", "No", "No", "No", "Yes"],
            ["Holiday family program", "No", "No", "No", "Yes"],
            ["Social features (friends)", "No", "No", "No", "Yes"],
            ["Private messaging", "No", "No", "No", "Yes"],
            ["Notification center", "Email only", "Email only", "No", "Yes (in-app)"],
            ["Preference matching", "Alerts", "Wish list", "No", "Yes"],
            ["Shelter management", "Via partners", "Via partners", "Per shelter", "Yes"],
            ["Support tickets", "External", "External", "No", "Yes"],
            ["Responsive design", "Yes", "Yes", "Partial", "Yes"],
            ["Geographic focus", "N. America", "N. America", "Poland", "Poland/Global"],
        ]
    )
    add_source(doc, "Own analysis based on publicly available platform features, accessed 2025.")
    
    add_p(doc,
        "As demonstrated in Table 2.3, StrayPet fills several gaps left by existing platforms, "
        "most notably the combination of a lost pet tracking system with interactive map "
        "visualization, a built-in community and social system, and an integrated holiday "
        "family certification program. While the platform's current user base is smaller than "
        "established North American services, its feature set is more comprehensive for the "
        "European market context."
    )
    
    # 2.4 Technology selection
    add_heading(doc, "2.4. Technology selection", 2)
    add_p(doc,
        "The technology selection process for StrayPet was guided by several key criteria: "
        "support for geographic data processing, rapid development capabilities, strong "
        "community support and documentation, TypeScript compatibility for the frontend, "
        "and containerization support for deployment. The following subsections describe "
        "the chosen technologies and justify the selections."
    )
    
    add_heading(doc, "2.4.1. Database Management System", 3)
    add_p(doc,
        "PostgreSQL 16 was selected as the database management system, primarily due to its "
        "industry-leading support for geographic data through the PostGIS extension. The "
        "StrayPet platform relies heavily on geographic features: lost pet locations must be "
        "stored with precise coordinates, shelters need map-based visualization, and pets "
        "should be searchable by city and proximity. PostGIS provides spatial data types "
        "(geometry, geography), spatial indexing (GiST), and spatial functions (distance "
        "calculations, containment tests) that would be significantly more complex to "
        "implement with alternative databases."
    )
    add_p(doc,
        "Alternative database systems were considered during the selection process. MySQL, "
        "while popular and well-supported by Django, offers limited spatial capabilities "
        "compared to PostGIS. MongoDB was considered for its flexible schema, but the "
        "highly relational nature of the StrayPet data model (users, pets, adoptions, "
        "comments, notifications — all with complex foreign key relationships) makes a "
        "relational database the more appropriate choice. SQLite was deemed unsuitable "
        "for production deployment due to its limited concurrency support."
    )

    add_table_with_title(doc, "2.4", "Database management system comparison",
        ["Criterion", "PostgreSQL + PostGIS", "MySQL", "MongoDB"],
        [
            ["Spatial data support", "Excellent (PostGIS)", "Basic", "Good (GeoJSON)"],
            ["Django integration", "Excellent (GeoDjango)", "Good", "Via djongo (limited)"],
            ["Relational integrity", "Excellent", "Good", "Limited (document store)"],
            ["Complex queries", "Excellent", "Good", "Aggregation pipeline"],
            ["JSON support", "Native (jsonb)", "JSON type", "Native"],
            ["Community & docs", "Excellent", "Excellent", "Good"],
            ["Docker image", "postgis/postgis", "mysql", "mongo"],
        ]
    )
    add_source(doc, "Own comparison based on official documentation.")
    
    add_heading(doc, "2.4.2. Server-side framework", 3)
    add_p(doc,
        "Django 5.1, a high-level Python web framework, was selected for the backend "
        "development. Django follows the Model-View-Template (MVT) architectural pattern "
        "and adheres to the \"Don't Repeat Yourself\" (DRY) principle. For the StrayPet "
        "project, Django is used purely as an API backend (without server-side templates), "
        "with Django REST Framework (DRF) 3.15 providing the RESTful API layer."
    )
    add_p(doc,
        "The key advantages of Django + DRF for this project include:"
    )
    add_bullet(doc, "Built-in ORM with automatic migration generation, supporting complex relationships and database indexing.")
    add_bullet(doc, "GeoDjango integration providing native support for PostGIS spatial fields and queries.")
    add_bullet(doc, "Django REST Framework's powerful serialization system, enabling flexible data representation with nested objects, computed fields, and write-only fields for handling multipart form data.")
    add_bullet(doc, "A comprehensive authentication ecosystem through djangorestframework-simplejwt for JWT token management.")
    add_bullet(doc, "Django's signal framework for implementing event-driven business logic (e.g., automatically updating pet status when adoption applications change state).")
    add_bullet(doc, "Django Admin for rapid administrative interface development with custom actions and inline editing.")
    add_bullet(doc, "Mature ecosystem with well-maintained packages: django-filter for query filtering, django-cors-headers for CORS, WhiteNoise for static file serving, django-smart-selects for cascading foreign key selects.")
    
    add_p(doc,
        "Alternatives considered included Flask (too minimal for the complexity of this "
        "project, lacking built-in ORM, admin, and authentication), Express.js with Node.js "
        "(would require assembling individual packages for ORM, authentication, and admin), "
        "and Spring Boot (heavier ecosystem with steeper learning curve for rapid prototyping)."
    )
    
    add_heading(doc, "2.4.3. Client-side technologies", 3)
    add_p(doc,
        "The frontend is built with React 19 and TypeScript, representing the latest "
        "version of the most widely adopted frontend framework. React's component-based "
        "architecture enables the creation of reusable UI elements, while TypeScript adds "
        "static type safety that catches errors during development rather than at runtime."
    )
    add_p(doc,
        "React 19 introduces the use() hook, which is utilized in StrayPet's authentication "
        "context (AuthProvider) for reading context values. This represents a modernization "
        "over the previous useContext() hook approach."
    )
    add_p(doc,
        "Vite 7 serves as the build tool, offering significantly faster development server "
        "startup and hot module replacement (HMR) compared to the traditional Create React App "
        "(CRA) webpack-based setup. The SWC (Speedy Web Compiler) plugin replaces Babel for "
        "JSX transformation, providing even faster compilation. Vite's configuration also "
        "enables manual chunk splitting, separating React core libraries and utility packages "
        "into separate vendor chunks for optimal caching."
    )
    add_p(doc, "The following key frontend libraries were selected:", first_line_indent=0, space_before=8)
    
    add_table_with_title(doc, "2.5", "Key frontend library selections and justifications",
        ["Library", "Version", "Purpose", "Justification"],
        [
            ["React Bootstrap", "2.10", "UI components", "Bootstrap-based, responsive, familiar styling"],
            ["Mapbox GL JS", "3.16", "Interactive maps", "High-performance WebGL rendering, rich API, geocoding"],
            ["@opentiny/fluent-editor", "3.25", "Rich text editor", "Quill-based WYSIWYG with image upload"],
            ["ahooks", "3.9", "React hooks", "useRequest for data fetching with loading/error states"],
            ["Zustand", "5.0", "Global state", "Lightweight, minimal boilerplate, Immer middleware"],
            ["axios", "1.11", "HTTP client", "Interceptors for JWT auto-refresh, request/response transform"],
            ["dayjs", "1.11", "Date handling", "Lightweight alternative to Moment.js"],
            ["DOMPurify", "3.0", "HTML sanitization", "XSS prevention for user-generated content"],
            ["Supercluster", "8.0", "Map clustering", "Efficient geospatial point clustering for markers"],
        ]
    )
    
    add_heading(doc, "2.4.4. Geocoding and map services", 3)
    add_p(doc,
        "Geographic information processing is a core requirement of StrayPet, as both lost "
        "pet tracking and shelter management rely on accurate address-to-coordinate conversion "
        "(geocoding) and interactive map display. A dual-provider geocoding strategy was "
        "implemented to ensure reliability:"
    )
    add_p_multi(doc, [
        ("Primary: Mapbox Geocoding API", True),
        (" – Provides high-accuracy structured geocoding with "
         "relevance scoring. Results are accepted only when the relevance score exceeds 0.7 "
         "and the result type is 'address' or 'point of interest'. The API supports contextual "
         "parameters (country code, city, postal code) for improved accuracy. A specialized "
         "Polish address normalizer reorders number-first addresses (e.g., '12/16 Kopińska' → "
         "'Kopińska 12/16') to match Mapbox's expected format.", False)
    ])
    add_p_multi(doc, [
        ("Fallback: OpenStreetMap Nominatim", True),
        (" – An open-source geocoding service used when "
         "Mapbox returns no results or when the Mapbox API is unavailable. Structured queries "
         "with address components are attempted first, falling back to free-form text queries.", False)
    ])
    add_p(doc,
        "All geocoding results are cached for 24 hours using Django's file-based cache "
        "backend, reducing API calls and improving response times for repeated address lookups."
    )
    
    add_heading(doc, "2.4.5. Authentication strategy", 3)
    add_p(doc,
        "JSON Web Tokens (JWT) were selected as the authentication mechanism, implemented "
        "through the djangorestframework-simplejwt library. JWT provides stateless "
        "authentication, meaning the server does not need to maintain session state. Each "
        "request includes an Authorization header with a Bearer token that the server "
        "validates cryptographically."
    )
    add_p(doc,
        "The JWT flow in StrayPet consists of the following steps: (1) The user submits "
        "credentials with a CAPTCHA solution to the token endpoint. (2) Upon successful "
        "authentication, the server returns an access token (short-lived) and a refresh "
        "token (longer-lived). (3) The frontend stores both tokens in localStorage and "
        "attaches the access token to all subsequent API requests. (4) When the access "
        "token expires, the frontend's Axios interceptor automatically sends the refresh "
        "token to obtain a new access token, transparently retrying the failed request. "
        "(5) If the refresh token is also expired, the user is logged out."
    )
    add_p(doc,
        "The login endpoint is further protected by a server-generated CAPTCHA. The backend "
        "generates a random 4-character alphanumeric string, renders it as a PNG image with "
        "noise lines and dots using PIL (Python Imaging Library), encodes it as a base64 data "
        "URI, and returns it to the frontend along with a unique identifier (UID). The CAPTCHA "
        "code is stored in Django's cache with a 5-minute expiration. This mechanism mitigates "
        "brute-force login attempts."
    )
    
    add_heading(doc, "2.4.6. Deployment tools", 3)
    add_p(doc,
        "Docker and Docker Compose were selected for application containerization and "
        "orchestration. The deployment stack consists of three services defined in "
        "docker-compose.yml:"
    )
    add_bullet(doc, "db: PostGIS 16-3.4 container providing the PostgreSQL database with geographic extensions, persistent data stored in a named volume (pgdata).")
    add_bullet(doc, "web: Python 3.12-slim container running the Django application via Gunicorn WSGI server. The Dockerfile installs GDAL, GEOS, and PROJ libraries required by GeoDjango, runs collectstatic during build, and executes migrations on startup before launching Gunicorn.")
    add_bullet(doc, "adminer: Database administration interface accessible on port 8080 for development and debugging purposes.")
    
    page_break(doc)

    # ===================================================================
    # CHAPTER 3: SYSTEM DESIGN
    # ===================================================================
    add_heading(doc, "3. System design", 1)
    
    add_heading(doc, "3.1. System architecture", 2)
    add_p(doc,
        "StrayPet employs a layered client-server architecture with strict separation between "
        "the presentation layer (React SPA) and the data/business logic layer (Django REST API). "
        "All communication between the two layers occurs exclusively through HTTP requests to "
        "RESTful API endpoints, with data exchanged in JSON format. This decoupled architecture "
        "enables independent development, testing, and deployment of the frontend and backend."
    )
    
    add_figure_placeholder(doc, "3.1", "System architecture diagram of the StrayPet platform",
        "Create a diagram showing: Browser → React SPA (Vite build) → HTTP/JSON → Nginx → Gunicorn (WSGI) → Django+DRF → PostgreSQL+PostGIS, with side connections to Mapbox API and Nominatim for geocoding, and file storage for media/static")
    
    add_p(doc,
        "The architecture can be described in the following layers:"
    )
    add_p_multi(doc, [
        ("Presentation Layer (Frontend): ", True),
        ("The React 19 SPA runs entirely in the browser, built and bundled by Vite 7 "
         "into optimized static assets (JavaScript chunks, CSS, images). Routes are code-split "
         "using React's lazy() function with a custom lazyWithFallback wrapper for error "
         "recovery. The application communicates with the backend exclusively through the "
         "Axios HTTP client, which includes interceptors for automatic JWT token "
         "management.", False)
    ])
    add_p_multi(doc, [
        ("API Layer (Django REST Framework): ", True),
        ("DRF ViewSets and serializers expose RESTful endpoints for all entities. The API "
         "follows standard HTTP method semantics (GET for retrieval, POST for creation, "
         "PATCH for partial updates, DELETE for removal). Authentication is enforced through "
         "JWTAuthentication, with endpoint-specific permission classes controlling access. "
         "Django-filter provides declarative query parameter filtering.", False)
    ])
    add_p_multi(doc, [
        ("Business Logic Layer (Django Models + Signals): ", True),
        ("Core business rules are implemented through Django model methods and the signal "
         "framework. For example, when an Adoption record transitions to 'approved' status, "
         "a pre_save signal automatically updates the associated Pet's status to 'adopted' "
         "and closes all competing adoption applications. This ensures data consistency "
         "regardless of whether changes originate from the API or the Django Admin.", False)
    ])
    add_p_multi(doc, [
        ("Data Layer (PostgreSQL + PostGIS): ", True),
        ("The relational database stores all persistent data, with PostGIS providing spatial "
         "data types and indexed spatial queries. Django's ORM generates optimized SQL queries "
         "and manages schema migrations automatically.", False)
    ])
    add_p_multi(doc, [
        ("External Services: ", True),
        ("Mapbox API (geocoding and map tiles) and OpenStreetMap Nominatim (fallback geocoding) "
         "provide geographic data processing. Email sending is configured through SMTP "
         "(console backend in development).", False)
    ])
    
    add_heading(doc, "3.2. Database model", 2)
    add_p(doc,
        "The StrayPet database consists of 22 primary tables organized into five Django "
        "applications: pet, user, blog, comment, and holiday_family. The design follows "
        "Django's convention of defining models as Python classes that map to database tables, "
        "with the ORM handling schema generation and migration."
    )
    
    add_figure_placeholder(doc, "3.2", "Entity-Relationship diagram of the StrayPet database",
        "Create an ER diagram showing all models and their relationships. Group by Django app (pet, user, blog, comment, holiday_family)")
    
    add_heading(doc, "3.2.1. Pet application models", 3)
    add_p(doc,
        "The pet application is the largest module, containing 12 models that cover pet "
        "management, adoption workflow, lost pets, shelters, and geographic addressing."
    )
    add_p(doc,
        "The central entity is the Pet model, which contains 26 fields covering identification "
        "(name, species, breed), demographics (sex, age in years and months, size), health and "
        "behavioral traits (12 boolean fields: dewormed, vaccinated, microchipped, child_friendly, "
        "trained, loves_play, loves_walks, good_with_dogs, good_with_cats, affectionate, "
        "needs_attention, sterilized), contact information, geographic location (via foreign key "
        "to Address), shelter association, cover image, publication status (draft, available, "
        "pending, adopted, archived, lost), and audit fields. The model defines database indexes "
        "on status, (species, breed), and created_by for query optimization."
    )
    add_p(doc,
        "The Adoption model represents the adoption application workflow, linking a Pet to "
        "an applicant User with a status field tracking the application lifecycle (submitted, "
        "processing, approved, rejected, closed). A clean() validator prevents adoption "
        "applications for pets with LOST status. Database indexes on (pet, status) and "
        "(applicant, status) optimize the common lookup patterns."
    )
    add_p(doc,
        "The Donation model mirrors the Pet model's structure but adds donor-specific fields "
        "(is_stray, review status, reviewer, review_note) and a one-to-one link to the Pet "
        "record created upon approval. The approve() method is implemented as an atomic "
        "database transaction that creates a new Pet record from the donation data, copies "
        "all associated DonationPhoto records to PetPhoto records (including setting the first "
        "photo as the cover image), and updates the donation status."
    )
    add_p(doc,
        "The Address model implements a hierarchical geographic system with four levels: "
        "Country (country code + name), Region (linked to Country), City (linked to Region), "
        "and Address (street, building number, postal code, latitude/longitude coordinates, "
        "and a GeoJSON location JSONField). The ChainedForeignKey from django-smart-selects "
        "enables cascading selection in the admin interface, where selecting a country filters "
        "the available regions, and selecting a region filters the available cities."
    )
    add_p(doc,
        "The Lost model stores lost pet reports with 17 fields including physical description "
        "(name, species, breed, color, sex, size), geographic information (address with "
        "coordinates), temporal information (lost_time), status (open, found, closed), reporter "
        "information, and reward details. A Django signal (sync_pet_with_lost) automatically "
        "creates or updates a corresponding Pet record with LOST status when a lost report "
        "is created or updated."
    )
    add_p(doc,
        "The Shelter model represents animal shelters with 18 fields covering identification "
        "(name, description), contact information (email, phone, website), geographic location "
        "(Address foreign key), visual assets (logo, cover image), capacity metrics (capacity, "
        "current_animals), social media URLs, and verification status. Computed properties "
        "available_capacity and occupancy_rate provide real-time shelter statistics."
    )
    add_p(doc,
        "Additional models include PetPhoto (ordered multi-photo support per pet), "
        "DonationPhoto (with HTML preview method for admin), PetFavorite (unique per "
        "user-pet pair), Ticket (categorized support tickets with priority and assignment), "
        "and HolidayFamily (basic holiday family application form)."
    )
    
    add_heading(doc, "3.2.2. User application models", 3)
    add_p(doc,
        "The user application extends Django's built-in User model with five additional models:"
    )
    add_p(doc,
        "UserProfile is a one-to-one extension of User, containing 22 fields for phone number "
        "(with regex validation: ^\\+?[0-9\\- ]{6,20}$), avatar image, holiday family "
        "certification status, and 15 preference fields for pet matching (preferred species, "
        "size, age range, gender, living situation, and 11 boolean trait preferences). The "
        "profile is automatically created via a post_save signal when a new User is registered, "
        "which also generates a default avatar image with the user's initials."
    )
    add_p(doc,
        "ViewStatistics provides a generic view counter using Django's ContentType framework "
        "(GenericForeignKey), allowing view counts to be tracked for any model. The increase() "
        "class method implements 24-hour deduplication per visitor using a UID cookie managed "
        "by the custom UserUidMiddleware. This ensures that repeated visits from the same "
        "browser within 24 hours count as a single view."
    )
    add_p(doc,
        "Notification supports seven notification types (reply, mention, friend_request, system, "
        "holiday_family_apply, approve, reject) with optional foreign keys to related objects "
        "(Comment, HolidayFamilyApplication, Friendship). The model enables a unified "
        "notification feed that can link to the specific context of each notification."
    )
    add_p(doc,
        "Friendship implements a bidirectional relationship between users with status tracking "
        "(pending, accepted, blocked). A unique_together constraint on (from_user, to_user) "
        "prevents duplicate friendship records. A post_save signal automatically creates a "
        "notification for the target user when a friend request is created."
    )
    add_p(doc,
        "PrivateMessage stores direct messages between users with read status tracking "
        "(is_read, read_at) and a system message flag for automated notifications."
    )
    
    add_heading(doc, "3.2.3. Blog and Comment models", 3)
    add_p(doc,
        "The blog application contains four models: Category (supporting hierarchical "
        "categorization via a self-referencing foreign key), Article (with title, HTML content, "
        "auto-generated description stripped from HTML, author, category, many-to-many tags, "
        "and generic relations to ViewStatistics and Comments), Tag (simple name field with "
        "article_count annotation), and FavoriteArticle (unique per user-article pair)."
    )
    add_p(doc,
        "The Article model's save() method automatically generates a plain-text description "
        "from the HTML content by stripping tags and truncating to 200 characters. The "
        "get_markdown() and get_toc() methods provide Markdown rendering with table of "
        "contents extraction for frontend display."
    )
    add_p(doc,
        "The Comment model uses Django's ContentType framework (GenericForeignKey) to enable "
        "comments on any model, currently utilized for Article comments. A self-referencing "
        "parent foreign key enables threaded reply chains. A post_save signal creates "
        "Notification records for the parent comment's author when a reply is posted."
    )
    
    add_heading(doc, "3.2.4. Holiday Family application models", 3)
    add_p(doc,
        "The holiday_family application provides a detailed application system with "
        "HolidayFamilyApplication (20 fields including personal information, address details, "
        "pet care capabilities with boolean fields per species, motivation text, introduction, "
        "ID document upload with file type validation for PDF/JPG/PNG, terms agreement, and "
        "review status) and HolidayFamilyPhoto (multiple family photos per application)."
    )
    
    add_heading(doc, "3.3. REST API design", 2)
    add_p(doc,
        "The StrayPet API follows RESTful conventions with resource-oriented URL design, "
        "standard HTTP method semantics, and consistent JSON response formats. The API is "
        "organized into four URL namespaces corresponding to the application modules."
    )
    
    add_table_with_title(doc, "3.1", "API namespace structure",
        ["Path prefix", "Module", "Number of endpoints"],
        [
            ["/user/", "Authentication, profiles, friends, messages, notifications", "35"],
            ["/pet/", "Pets, adoptions, lost, donations, shelters, tickets", "28"],
            ["/blog/", "Articles, categories, tags, comments", "16"],
            ["/holiday-family/", "Holiday family applications, review", "8"],
        ]
    )
    
    add_p(doc,
        "In total, the API exposes 87 endpoints across the four namespaces. Each endpoint "
        "follows a consistent pattern: resource collections are accessed at the base URL "
        "(e.g., /pet/ for listing and creation), individual resources at /pet/<id>/ for "
        "retrieval, update, and deletion, and custom actions at /pet/<id>/action_name/ for "
        "non-CRUD operations (e.g., /pet/<id>/favorite/ for favoriting a pet)."
    )
    
    add_heading(doc, "3.3.1. Serialization patterns", 3)
    add_p(doc,
        "The API employs a Dual Serializer Pattern throughout most ViewSets, using separate "
        "serializers for read and write operations. Read serializers (list/retrieve) produce "
        "rich, denormalized JSON responses with nested objects, computed fields, and absolute "
        "URLs. Write serializers (create/update) accept minimal input, often handling multipart "
        "form data with special normalization logic."
    )
    add_p(doc,
        "For example, the PetViewSet uses PetListSerializer for GET requests, which returns "
        "over 40 fields including computed properties (age_display, address_display, city, "
        "shelter details, favorites_count, is_favorited, photo URLs). For POST/PATCH requests, "
        "PetCreateUpdateSerializer accepts a flat set of fields plus a write-only address_data "
        "JSON object, with to_internal_value() overridden to handle FormData normalization "
        "(converting string 'true'/'false' to Python booleans, extracting list values from "
        "multipart encoding)."
    )
    add_p(doc,
        "A DynamicFieldsModelSerializer base class enables runtime field selection on the "
        "user detail endpoint, allowing clients to specify which fields to include or exclude "
        "via constructor parameters. This reduces payload size for partial profile updates."
    )
    
    add_heading(doc, "3.3.2. Authentication and permissions", 3)
    add_p(doc,
        "The API's permission model is configured with AllowAny as the default global "
        "permission class, with endpoint-specific overrides applied at the ViewSet level. "
        "Three custom permission classes are defined:"
    )
    add_bullet(doc, "IsOwnerOrAdmin: Allows any authenticated user to read, but restricts write operations to the object's creator (created_by) or staff users.")
    add_bullet(doc, "IsAdopterOrOwnerOrAdmin: Specialized for adoptions — the applicant can view and close their own application, the pet owner can view and manage applications for their pets, and administrators have full access.")
    add_bullet(doc, "IsOwnerOrReadOnly: Applied to lost pet reports, allowing the reporter to edit or delete their own reports while permitting read-only access for everyone.")
    add_p(doc,
        "The JWT tokens are generated by a customized TokenObtainPairView that requires "
        "CAPTCHA validation in addition to standard credentials. The custom LoginSerializer "
        "extends both CaptchaSerializer and TokenObtainPairSerializer, validating the CAPTCHA "
        "code against the cache before proceeding with Django's authentication backend."
    )
    
    add_heading(doc, "3.3.3. Filtering and search", 3)
    add_p(doc,
        "Two comprehensive filter classes are implemented using django-filter:"
    )
    add_p(doc,
        "PetFilter provides 16 filter parameters: text search on name, species, and breed "
        "(case-insensitive contains); exact match on status, sex, and size; a custom city "
        "filter that searches both the pet's direct address and the associated shelter's "
        "address; age range filtering using age_min/age_max parameters that convert total "
        "months to composite year+month queries using Django Q objects; and 11 boolean "
        "filters for individual traits."
    )
    add_p(doc,
        "LostFilter provides a comprehensive search across lost pet attributes: a general "
        "search parameter (q) that queries pet name, address hierarchy (city, region, country), "
        "description, color, and breed simultaneously; text filters for pet name and city; "
        "date range filters for creation and loss dates; address hierarchy filters (country, "
        "region by ID, city by name); and exact filters for species, breed, color, sex, size, "
        "and status."
    )
    
    add_heading(doc, "3.4. User interface design", 2)
    add_p(doc,
        "The user interface follows a consistent layout with a global navigation bar at the "
        "top (TopNavbar) providing links to all major sections: Home, Adopt, Lost Pet, "
        "Found/Stray, Shelters, Blog, and Holiday Family. The navbar also hosts the "
        "NotificationBell component (with unread count badge and 30-second polling) and "
        "the SignInWidget (avatar dropdown with profile and logout options)."
    )
    add_p(doc,
        "The design employs a neutral, pet-friendly color palette with React Bootstrap "
        "providing the responsive grid system. All listing pages implement a consistent "
        "pattern: filter controls at the top, results in a card grid layout, and pagination "
        "at the bottom. Detail pages use a full-width layout with larger images and "
        "comprehensive information sections."
    )
    add_p(doc,
        "Interactive maps are implemented using Mapbox GL JS with WebGL rendering, providing "
        "smooth panning and zooming with custom pet markers. The Poland-centered configuration "
        "(defined in polandMapConfig.ts) constrains the initial view and provides coordinate "
        "validation functions. A static image fallback is provided for browsers without WebGL "
        "support or when the Mapbox token is unavailable."
    )
    
    add_figure_placeholder(doc, "3.3", "Navigation structure of the StrayPet platform",
        "Create a sitemap/navigation diagram showing all pages and their relationships")
    
    add_figure_placeholder(doc, "3.4", "Responsive layout comparison: desktop (left) vs mobile (right)",
        "Screenshots of the pet listing page on desktop and mobile viewports")
    
    page_break(doc)

    # ===================================================================
    # CHAPTER 4: IMPLEMENTATION
    # ===================================================================
    add_heading(doc, "4. Implementation", 1)
    add_p(doc,
        "This chapter provides detailed descriptions of the key implementation aspects of "
        "both the backend and frontend components. Code snippets are provided for the most "
        "significant patterns and algorithms."
    )
    
    # 4.1 Backend
    add_heading(doc, "4.1. Backend implementation", 2)
    
    add_heading(doc, "4.1.1. Project structure", 3)
    add_p(doc,
        "The Django backend is organized into a standard project structure with five "
        "applications (apps), a shared common module, a central API routing module, and "
        "the server configuration:"
    )
    
    add_code_block(doc, """backend/
├── server/              # Project configuration
│   ├── settings.py      # Django settings (DB, auth, REST, cache, etc.)
│   ├── urls.py          # Root URL configuration
│   ├── wsgi.py          # WSGI entry point (Gunicorn)
│   └── asgi.py          # ASGI entry point
├── api/                 # Central API module
│   ├── urls.py          # API root routing
│   ├── serializers.py   # Base serializer (mostly unused)
│   └── views.py         # API root view
├── apps/
│   ├── pet/             # Pet management (models, views, serializers,
│   │                    #   signals, filters, permissions, admin)
│   ├── user/            # User management (models, views, serializers,
│   │                    #   signals, middleware, admin)
│   ├── blog/            # Blog system (models, views, serializers, admin)
│   ├── comment/         # Generic comment system
│   └── holiday_family/  # Holiday family program
├── common/
│   ├── pagination.py    # Custom PageNumberPagination
│   └── utils.py         # Shared utilities (captcha, geocoding)
├── manage.py
├── requirements.txt
├── Dockerfile
└── docker-compose.yml""", "Listing 4.1: Backend directory structure")
    
    add_heading(doc, "4.1.2. Signal-driven business logic", 3)
    add_p(doc,
        "One of the most significant architectural decisions in the StrayPet backend is the "
        "use of Django signals for implementing business logic that spans multiple models. "
        "This approach ensures that critical state transitions are enforced consistently, "
        "regardless of whether data changes originate from the REST API, the Django Admin, "
        "or management commands."
    )
    add_p(doc,
        "Three signal handlers in the pet application manage the adoption lifecycle:"
    )
    add_p_multi(doc, [
        ("set_pet_pending_on_create ", True),
        ("(post_save on Adoption): When a new adoption application is created and the "
         "associated pet's status is 'available', the signal automatically transitions "
         "the pet's status to 'pending', indicating that at least one application is "
         "under consideration.", False)
    ])
    add_p_multi(doc, [
        ("handle_status_transitions ", True),
        ("(pre_save on Adoption): This signal monitors status changes on adoption "
         "applications. When an application is approved, the pet's status transitions to "
         "'adopted' and all other open applications for the same pet are automatically "
         "closed. When an application is closed or rejected, the signal checks whether "
         "any open applications remain; if none do, the pet reverts to 'available' status.", False)
    ])
    add_p_multi(doc, [
        ("sync_pet_with_lost ", True),
        ("(post_save on Lost): When a lost pet report is created, this signal automatically "
         "creates a corresponding Pet record with LOST status, ensuring lost pets are visible "
         "in the main pet listing. When a lost report transitions to 'found' or 'closed', "
         "the associated pet is reverted to 'available' status.", False)
    ])
    
    add_figure_placeholder(doc, "4.1", "State diagram for Pet status transitions driven by signals",
        "Draw a state diagram: draft → available → pending → adopted, available → lost → available, pending → available (if all apps rejected)")
    
    add_heading(doc, "4.1.3. Address resolution and geocoding", 3)
    add_p(doc,
        "Address handling in StrayPet involves a multi-step resolution process implemented "
        "in the _create_or_resolve_address() helper function. When the API receives address "
        "data (typically as a JSON object within a multipart form submission), the following "
        "steps are executed:"
    )
    add_bullet(doc, "Step 1 – Entity Resolution: Country, Region, and City are resolved by ID (if numeric) or created by name (if string). This dual-mode resolution allows both the admin interface (which uses foreign key IDs) and the frontend (which submits text names) to share the same address creation logic.")
    add_bullet(doc, "Step 2 – Address Record Creation: An Address record is created with the resolved geographic hierarchy, street address, building number, and postal code.")
    add_bullet(doc, "Step 3 – Geocoding: If latitude and longitude are not provided in the request, the geocode_address() utility function is invoked. This function first attempts Mapbox geocoding with structured context (street, city, country code, postal code), then falls back to Nominatim. Polish address formats are normalized by reordering components (e.g., '12/16 Kopińska' → 'Kopińska 12/16').")
    add_bullet(doc, "Step 4 – GeoJSON Construction: The resolved coordinates are stored both as decimal fields (latitude, longitude) and as a GeoJSON Point object in the location JSONField for spatial query support.")
    
    add_heading(doc, "4.1.4. CAPTCHA system", 3)
    add_p(doc,
        "The login endpoint is protected by a server-generated CAPTCHA system to mitigate "
        "automated brute-force attacks. The implementation spans three components:"
    )
    add_p_multi(doc, [
        ("Image Generation (common/utils.py): ", True),
        ("The generate_captcha_image() function creates a 120×50 pixel PNG image containing "
         "a random 4-character alphanumeric code. The image includes visual noise (5 random "
         "lines and 60 random dots of varying colors) to resist optical character recognition. "
         "The text is rendered using a 36-point DejaVu Sans font with a slight vertical "
         "offset for each character.", False)
    ])
    add_p_multi(doc, [
        ("API Endpoint (user/views.py): ", True),
        ("The CaptchaGenericAPIView generates a captcha, stores the code in Django's file-based "
         "cache with a 5-minute TTL keyed by a UUID identifier, converts the image to a base64 "
         "data URI, and returns both the data URI and the UUID to the client.", False)
    ])
    add_p_multi(doc, [
        ("Validation (user/serializer.py): ", True),
        ("The CaptchaSerializer validates incoming captcha+uid pairs against the cache, performing "
         "case-insensitive comparison. The LoginSerializer extends both CaptchaSerializer and "
         "TokenObtainPairSerializer, ensuring the captcha is validated before Django's "
         "authentication backend processes the credentials.", False)
    ])
    
    add_heading(doc, "4.1.5. Donation approval workflow", 3)
    add_p(doc,
        "The donation approval process demonstrates the use of atomic database transactions "
        "and cross-model data transfer. When an administrator approves a donation, the "
        "Donation.approve() method executes within a transaction.atomic() block:"
    )
    add_bullet(doc, "A new Pet record is created, copying all relevant fields from the Donation (name, species, breed, sex, age, size, description, all 12 trait booleans, contact info, address, shelter).")
    add_bullet(doc, "The pet status is set to AVAILABLE and created_by is set to the donor user.")
    add_bullet(doc, "All DonationPhoto records are duplicated as PetPhoto records associated with the new pet, preserving photo order.")
    add_bullet(doc, "The first photo is additionally set as the pet's cover image.")
    add_bullet(doc, "The donation status is updated to APPROVED, the reviewer and review_note are recorded, and the created_pet foreign key links the donation to the new pet.")
    add_p(doc,
        "This atomic approach ensures that either all steps succeed or the entire operation "
        "is rolled back, preventing orphaned records or inconsistent state."
    )
    
    add_heading(doc, "4.1.6. View statistics with deduplication", 3)
    add_p(doc,
        "The view counting mechanism implements per-visitor, per-day deduplication using a "
        "combination of custom middleware and cache-based tracking. The UserUidMiddleware "
        "assigns a unique UUID4 identifier to each browser session via a cookie with a 24-hour "
        "max_age. When ViewStatistics.increase() is called (on article retrieval), it constructs "
        "a cache key from the model type, object ID, and visitor UID. If this key exists in "
        "the cache, the view is considered a duplicate and is not counted. Otherwise, a "
        "ViewStatistics record for the current date is incremented, and the cache key is set "
        "with a 24-hour TTL."
    )
    
    add_heading(doc, "4.1.7. Notification system", 3)
    add_p(doc,
        "The notification system aggregates events from multiple sources into a unified "
        "Notification model. Notifications are created automatically through Django signals "
        "and explicit creation in view methods:"
    )
    add_bullet(doc, "Comment replies: A post_save signal on Comment creates a notification for the parent comment's author when a reply is posted.")
    add_bullet(doc, "Friend requests: A post_save signal on Friendship creates a notification for the target user when a pending friendship record is created.")
    add_bullet(doc, "Holiday family decisions: The approve() and reject() view actions explicitly create notifications for the applicant, including the decision and any rejection reason.")
    add_bullet(doc, "Holiday family submissions: The apply() action creates notifications for all admin users (is_staff=True) when a new application is received.")
    add_p(doc,
        "The frontend polls for unread notifications every 30 seconds via the "
        "NotificationBell component, displaying an unread count badge and a dropdown "
        "list with mark-as-read functionality."
    )
    
    # 4.2 Frontend
    add_heading(doc, "4.2. Frontend implementation", 2)
    
    add_heading(doc, "4.2.1. Project structure and build configuration", 3)
    add_p(doc,
        "The frontend is organized as a standard Vite-based React project with clear "
        "separation of concerns:"
    )
    
    add_code_block(doc, """frontend/src/
├── main.tsx           # Entry: AuthProvider → App
├── app.tsx            # RouterProvider + Loading overlay
├── components/        # 15 shared/reusable components
├── hooks/             # Custom hooks (useAuth, useRouter, etc.)
├── layouts/           # RootLayout (Navbar + Outlet)
├── router/            # Route definitions + lazy loading
├── services/          # 11 API service modules + HTTP client
├── store/             # Zustand stores (loading, user)
├── styles/            # Global SCSS variables and utilities
├── types/             # TypeScript declarations
├── utils/             # Date, file, map, tool utilities
└── views/             # 12 feature modules (pages)""",
        "Listing 4.2: Frontend source directory structure")
    
    add_p(doc,
        "The Vite configuration provides several optimizations: a path alias (@ → src/) "
        "for clean imports, automatic SCSS variable injection into all SCSS files, React "
        "singleton aliasing to prevent duplicate React instances, and manual chunk splitting "
        "that separates the React core (react, react-dom, react-router) and utility libraries "
        "(axios, dayjs, zustand, ahooks, classnames, es-toolkit) into separate vendor chunks "
        "for optimal browser caching."
    )
    add_p(doc,
        "Development tooling includes the react-dev-inspector plugin (Ctrl+Alt+Q opens the "
        "corresponding source file in the IDE) and vite-plugin-checker that displays TypeScript "
        "and ESLint errors directly in the browser overlay, providing immediate feedback during "
        "development."
    )
    
    add_heading(doc, "4.2.2. Routing and code splitting", 3)
    add_p(doc,
        "The application defines 30 routes using React Router v7's createBrowserRouter, "
        "all nested under a RootLayout component that renders the TopNavbar and an Outlet "
        "for the current route's content. Routes are code-split using a custom lazyWithFallback "
        "utility that wraps React.lazy() with an error recovery mechanism: if a chunk fails to "
        "load (e.g., due to a network error or stale deployment), it catches the error and "
        "retries the import."
    )
    add_p(doc,
        "The routing structure is organized by feature:"
    )
    
    add_table_with_title(doc, "4.1", "Frontend route structure organized by feature module",
        ["Module", "Routes", "Key Components"],
        [
            ["Home", "/home", "Landing page with hero banner"],
            ["Auth", "/auth/login, /register, /forget, /reset", "Login (captcha), Register (email code), Password reset"],
            ["Adoption", "/adopt, /adopt/add, /adopt/:id, /adopt/:id/apply", "Pet listing, Add pet, Detail, Apply"],
            ["Lost", "/lost, /lost/post, /lost/:id", "List+Map, Report lost pet, Detail"],
            ["Found", "/found", "Found pet guide + shelter contacts"],
            ["Shelters", "/shelters, /shelters/:id", "Shelter list + map, Detail"],
            ["Blog", "/blog, /blog/create, /blog/:id, /blog/:id/edit, /blog/archive/:y/:m", "Article list, Editor, Detail+Comments, Archive"],
            ["Holiday Family", "/holiday-family, /apply, /list, /detail/:id, /certified/:userId", "Landing, Application, Admin list, Review, Public profile"],
            ["Messages", "/messages", "Direct messaging interface"],
            ["User", "/user/profile, /user/profile/:userId", "Own profile (tabbed), Other user's profile"],
        ]
    )
    
    add_heading(doc, "4.2.3. Authentication flow", 3)
    add_p(doc,
        "Authentication is managed through a React Context provider (AuthProvider) that "
        "leverages React 19's use() hook for context consumption. The authentication flow "
        "involves several coordinated components:"
    )
    add_p_multi(doc, [
        ("Token Storage: ", True),
        ("Access and refresh tokens are stored in localStorage upon successful login. The "
         "user object (fetched from /user/me/) is also cached in localStorage for immediate "
         "display on subsequent page loads.", False)
    ])
    add_p_multi(doc, [
        ("Axios Interceptors (services/http.ts): ", True),
        ("The request interceptor attaches the Bearer token to all outgoing requests. The "
         "response interceptor catches 401 errors and attempts to refresh the access token "
         "using the stored refresh token. A deduplication mechanism ensures that only one "
         "refresh request is in-flight at any time — concurrent 401 errors queue their "
         "retry promises behind the single refresh operation.", False)
    ])
    add_p_multi(doc, [
        ("Cross-Component Sync: ", True),
        ("After login or token refresh, the code dispatches a custom window event "
         "(auth:updated) that the AuthProvider listens for, triggering a re-render of all "
         "components that depend on authentication state.", False)
    ])
    
    add_heading(doc, "4.2.4. Map integration", 3)
    add_p(doc,
        "Map functionality is a cornerstone of the StrayPet user experience, implemented "
        "using Mapbox GL JS for WebGL-based interactive maps. The integration consists of "
        "three main components:"
    )
    add_p_multi(doc, [
        ("MapboxMap (shared component): ", True),
        ("A reusable map component that accepts either a direct coordinate pair (longitude, "
         "latitude) or a text address. When an address is provided, the component performs "
         "client-side geocoding via the Mapbox Geocoding API. The component includes WebGL "
         "capability detection with an automatic fallback to a static Mapbox image when WebGL "
         "is unavailable.", False)
    ])
    add_p_multi(doc, [
        ("LostPetsMap: ", True),
        ("A specialized map view for the lost pets page that displays all open lost pet "
         "reports as interactive markers on a Poland-centered map. The polandMapConfig utility "
         "defines geographic bounds, major city coordinates, and coordinate validation/clamping "
         "functions to ensure all markers fall within the expected region. Clicking a marker "
         "navigates to the lost pet's detail page.", False)
    ])
    add_p_multi(doc, [
        ("ShelterMapPreview: ", True),
        ("An interactive map preview embedded in each shelter card, showing the shelter's "
         "location with a marker. Supports click-to-open in Google Maps for directions.", False)
    ])
    
    add_heading(doc, "4.2.5. Rich text editing", 3)
    add_p(doc,
        "Blog article creation and editing uses @opentiny/fluent-editor, a Quill-based "
        "WYSIWYG editor with a comprehensive toolbar supporting bold, italic, heading levels, "
        "bullet and numbered lists, text colors, links, image embedding, video embedding, "
        "and emoji insertion. Images are uploaded to the backend via a dedicated upload "
        "endpoint (/blog/upload-image/) and inserted into the content as absolute URLs."
    )
    add_p(doc,
        "Article content is stored as HTML in the database. When displayed to readers, the "
        "SafeHtml component applies DOMPurify sanitization (removing potential XSS vectors "
        "such as script tags, event handlers, and javascript: URLs) before passing the HTML "
        "to html-react-parser for rendering as React components. This two-stage approach "
        "ensures both content fidelity and security."
    )
    
    add_heading(doc, "4.2.6. State management architecture", 3)
    add_p(doc,
        "The frontend employs a multi-tier state management strategy, selecting the "
        "appropriate mechanism based on the state's scope and persistence requirements:"
    )
    add_bullet(doc, "Global Authentication State (React Context + use()): User identity, tokens, and auth actions. Used by almost every page to determine rendering behavior and API authorization.")
    add_bullet(doc, "Global UI State (Zustand + Immer): The loading store manages a concurrent-request-aware counter — showLoading() increments and hideLoading() decrements, with the spinner visible while the counter is above zero. Immer middleware enables direct state mutation syntax.")
    add_bullet(doc, "URL State (React Router searchParams): Filter parameters, pagination, and sorting on listing pages are stored in the URL search string, enabling shareable and bookmarkable filtered views.")
    add_bullet(doc, "Server State (ahooks useRequest): API data fetching is handled by useRequest(), which provides automatic loading states, error handling, and refresh/reload capabilities without manual useState+useEffect boilerplate.")
    add_bullet(doc, "Local Component State (useState): Form inputs, UI toggles, and ephemeral state that does not need to persist across navigations.")
    
    add_heading(doc, "4.2.7. Responsive design implementation", 3)
    add_p(doc,
        "The application achieves responsive behavior through React Bootstrap's grid system "
        "(Container, Row, Col components with breakpoint-specific props), SCSS media queries "
        "for custom components, and the Mapbox map's ResizeObserver integration for automatic "
        "canvas resizing. The navigation bar collapses into a hamburger menu on mobile "
        "viewports, pet listing cards switch from a multi-column grid to a single-column "
        "layout, and map views adapt their zoom level to the viewport size."
    )
    
    add_figure_placeholder(doc, "4.2", "Pet listing page: desktop layout (left) vs mobile layout (right)",
        "Side-by-side screenshots of the adopt page on desktop and a narrow mobile viewport")
    
    add_heading(doc, "4.2.8. Social features implementation", 3)
    add_p(doc,
        "The social layer encompasses three interconnected features:"
    )
    add_p_multi(doc, [
        ("Friendship System: ", True),
        ("Users can send friend requests from other users' profiles. The FriendshipViewSet "
         "manages the lifecycle (add_friend → accept/reject), with list_friends providing "
         "a paginated friends list. The frontend's FriendsList component (within the profile "
         "page) displays friends with their avatars and certification badges. A check_friendship "
         "endpoint allows the frontend to determine the current relationship status between "
         "two users for conditional UI rendering.", False)
    ])
    add_p_multi(doc, [
        ("Private Messaging: ", True),
        ("The messaging system supports direct text communication between users. A rate limit "
         "of 3 messages per day applies to non-friends, implemented in the create() method "
         "via database count queries on the current day's messages. The Messages page displays "
         "conversations in a two-pane layout (contact list + message thread), with EmojiPicker "
         "integration for expressive communication.", False)
    ])
    add_p_multi(doc, [
        ("Notification Center: ", True),
        ("The NotificationBell component in the navbar polls the API every 30 seconds for "
         "unread notification counts. The dropdown displays notification items with type-specific "
         "icons and messages, linking to the relevant context (e.g., clicking a reply notification "
         "navigates to the article and comment). Friend request notifications include inline "
         "accept/reject buttons for immediate action without leaving the current page.", False)
    ])
    
    page_break(doc)

    # ===================================================================
    # CHAPTER 5: TESTING AND DEPLOYMENT
    # ===================================================================
    add_heading(doc, "5. Testing and deployment", 1)
    
    add_heading(doc, "5.1. Testing strategy", 2)
    add_p(doc,
        "The StrayPet project employs a multi-level testing approach combining automated "
        "serializer tests, manual API testing through the DRF Browsable API, and systematic "
        "manual testing of the frontend user interface."
    )
    
    add_heading(doc, "5.1.1. Backend testing", 3)
    add_p(doc,
        "Serializer tests verify that the serialization and deserialization logic correctly "
        "handles the various data formats encountered in production, including multipart "
        "form data normalization, boolean string conversion, nested JSON parsing, and "
        "address resolution. The test_serializer.py module focuses on the PetCreateUpdateSerializer "
        "and LostSerializer, the two most complex serializers that handle FormData with "
        "embedded JSON objects."
    )
    add_p(doc,
        "The Django REST Framework's Browsable API (enabled via BrowsableAPIRenderer in "
        "settings) served as a primary tool for interactive API testing during development. "
        "Each endpoint can be accessed through a web browser, allowing direct inspection of "
        "request/response data, testing with different parameters, and verifying permission "
        "enforcement."
    )
    add_p(doc,
        "The backend test/ directory contains over 50 utility scripts used during development "
        "for data population, verification, and debugging. These scripts cover activities "
        "such as: adding sample pets with realistic data, populating Polish shelter addresses, "
        "assigning geographic coordinates to existing records, analyzing pet age distributions, "
        "checking API response formats, diagnosing geocoding issues, and updating notification "
        "structures."
    )
    
    add_heading(doc, "5.1.2. Frontend testing", 3)
    add_p(doc,
        "Frontend testing was primarily conducted through manual testing in the browser during "
        "development, aided by the vite-plugin-checker that provides immediate TypeScript "
        "type error and ESLint violation feedback in the browser overlay. The DevErrorOverlay "
        "component catches unhandled errors and promise rejections in development mode, "
        "displaying them in an expandable floating panel."
    )
    add_p(doc,
        "The test/ route module provides dedicated testing pages (counter, create, auth-test, "
        "error-test) used during development to verify specific behaviors such as state "
        "updates, form submission, authentication flow, and error boundary recovery."
    )
    add_p(doc,
        "ESLint with TypeScript-specific rules (@typescript-eslint, eslint-plugin-react-hooks, "
        "@eslint-react/eslint-plugin) performs static analysis to catch common errors such as "
        "missing hook dependencies, unused variables, and incorrect React patterns. The "
        "lint-staged configuration ensures that all committed code passes both ESLint and "
        "Stylelint checks."
    )
    
    add_heading(doc, "5.1.3. Testing scenarios", 3)
    add_p(doc,
        "The following table summarizes the key manual testing scenarios that were systematically "
        "verified during the development process."
    )
    
    add_table_with_title(doc, "5.1", "Key manual testing scenarios",
        ["Category", "Scenario", "Expected Result", "Status"],
        [
            ["Auth", "Register with invalid email code", "Error message: Invalid code", "Pass"],
            ["Auth", "Login with incorrect CAPTCHA", "Error message: Invalid captcha", "Pass"],
            ["Auth", "Access protected endpoint without token", "HTTP 401 Unauthorized", "Pass"],
            ["Auth", "Auto-refresh expired access token", "Transparent retry, no user disruption", "Pass"],
            ["Pet", "Create pet with all trait checkboxes", "All traits stored correctly", "Pass"],
            ["Pet", "Filter by city, species, and size combined", "Correct filtered results", "Pass"],
            ["Pet", "Submit adoption for LOST pet", "Validation error", "Pass"],
            ["Pet", "Approve adoption → pet becomes adopted", "Pet status = adopted, other apps closed", "Pass"],
            ["Lost", "Report lost pet with address (no coords)", "Automatic geocoding, map marker", "Pass"],
            ["Lost", "View lost pets on map", "All open reports shown as markers", "Pass"],
            ["Donation", "Submit donation with 8 photos", "All photos uploaded, review pending", "Pass"],
            ["Donation", "Admin approves donation", "New pet created, photos copied", "Pass"],
            ["Blog", "Create article with images via FluentEditor", "Article saved with embedded images", "Pass"],
            ["Blog", "Reply to comment", "Reply visible, author notified", "Pass"],
            ["Social", "Send friend request → accept", "Friendship established", "Pass"],
            ["Social", "Send message to non-friend (4th/day)", "Rate limit error", "Pass"],
            ["Holiday", "Submit application with ID document", "Application in pending status", "Pass"],
            ["Holiday", "Admin rejects with reason", "Applicant notified with reason", "Pass"],
            ["Responsive", "Navigate all pages on 375px width", "No layout overflow, usable UI", "Pass"],
        ]
    )
    
    add_heading(doc, "5.2. Deployment configuration", 2)
    add_p(doc,
        "The production deployment uses Docker and Docker Compose to orchestrate three "
        "services in an isolated network."
    )
    
    add_heading(doc, "5.2.1. Docker configuration", 3)
    add_p(doc,
        "The backend Dockerfile is based on the python:3.12-slim image with the following "
        "key build steps:"
    )
    add_bullet(doc, "System dependencies: GDAL 3.x, GEOS, PROJ, and PostgreSQL client libraries are installed for GeoDjango support. The DejaVu Sans font is installed for captcha image generation.")
    add_bullet(doc, "Python dependencies: Installed from requirements.txt using pip with --no-cache-dir for minimal image size.")
    add_bullet(doc, "Static files: collectstatic is run during the Docker build phase, ensuring static files are ready without runtime overhead.")
    add_bullet(doc, "Entrypoint: The container runs database migrations (python manage.py migrate) on startup, then launches Gunicorn with 3 workers, listening on port 8000 with a 120-second timeout.")
    
    add_p(doc,
        "The docker-compose.yml defines the three services:"
    )
    
    add_table_with_title(doc, "5.2", "Docker Compose service configuration",
        ["Service", "Image", "Port", "Persistence", "Purpose"],
        [
            ["db", "postgis/postgis:16-3.4", "5432", "pgdata volume", "PostgreSQL + PostGIS database"],
            ["web", "Custom (Dockerfile)", "8000", "media/ bind mount", "Django API via Gunicorn"],
            ["adminer", "adminer:latest", "8080", "None", "Database admin UI"],
        ]
    )
    
    add_p(doc,
        "The web service includes a health check that waits for PostgreSQL readiness using "
        "pg_isready before starting the Django application, preventing connection errors "
        "during container startup ordering."
    )
    
    add_heading(doc, "5.2.2. Environment configuration", 3)
    add_p(doc,
        "Sensitive configuration values are managed through environment variables, injected "
        "into Docker containers via the docker-compose.yml environment section or .env files. "
        "Key configurable parameters include:"
    )
    add_bullet(doc, "POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD: Database credentials")
    add_bullet(doc, "POSTGRES_HOST: Database hostname (defaults to 'db' Docker service name)")
    add_bullet(doc, "SECRET_KEY: Django's cryptographic signing key")
    add_bullet(doc, "MAPBOX_TOKEN: Mapbox API access token for geocoding and map tiles")
    add_bullet(doc, "DEBUG: Django debug mode toggle")
    add_bullet(doc, "ALLOWED_HOSTS: Permitted hostnames for request validation")
    
    add_heading(doc, "5.3. Performance considerations", 2)
    add_p(doc,
        "Several performance optimizations are implemented throughout the stack:"
    )
    
    add_heading(doc, "5.3.1. Backend performance", 3)
    add_p_multi(doc, [
        ("Database Indexing: ", True),
        ("Critical query fields are indexed: Pet.status, (Pet.species, Pet.breed), "
         "Pet.created_by, (Adoption.pet, Adoption.status), (Adoption.applicant, Adoption.status), "
         "Ticket.title. These indexes optimize the most frequent query patterns in the "
         "filtering and listing endpoints.", False)
    ])
    add_p_multi(doc, [
        ("File-Based Caching: ", True),
        ("Django's FileBasedCache backend stores computed results in the django_cache/ "
         "directory with a default TTL of 300 seconds. Geocoding results are cached for "
         "24 hours, significantly reducing external API calls. CAPTCHA codes are cached "
         "for 5 minutes during the verification window.", False)
    ])
    add_p_multi(doc, [
        ("Configurable Pagination: ", True),
        ("All list endpoints return paginated results with a default page size of 10 and "
         "a maximum of 100. Clients can request specific page sizes through the page_size "
         "query parameter, allowing the frontend to optimize data transfer based on the "
         "viewport and use case.", False)
    ])
    add_p_multi(doc, [
        ("Query Optimization: ", True),
        ("The PetListSerializer uses select_related and prefetch_related through DRF's "
         "queryset chaining to minimize database queries. The article view count is "
         "aggregated through a database annotation (Sum of ViewStatistics) rather than "
         "Python-level computation.", False)
    ])
    
    add_heading(doc, "5.3.2. Frontend performance", 3)
    add_p_multi(doc, [
        ("Code Splitting: ", True),
        ("Every route is lazily loaded, generating separate JavaScript chunks that are "
         "fetched on demand. Combined with the manual vendor chunk configuration (vendor-react "
         "and vendor-utils), this results in a small initial bundle size with long-term "
         "browser cache efficiency.", False)
    ])
    add_p_multi(doc, [
        ("Concurrent Loading Management: ", True),
        ("The Zustand loading store implements a concurrent-request-aware counter that "
         "prevents the global spinner from disappearing while parallel API requests are "
         "still in flight. This avoids the flickering that would occur if each request "
         "independently toggled the loading state.", False)
    ])
    add_p_multi(doc, [
        ("Map Optimization: ", True),
        ("Mapbox GL JS renders maps using WebGL for smooth performance even with hundreds "
         "of markers. The Supercluster library clusters nearby points at lower zoom levels, "
         "reducing rendering overhead. Static image fallback ensures functionality on devices "
         "without WebGL support.", False)
    ])
    add_p_multi(doc, [
        ("Dynamic Imports: ", True),
        ("Heavy libraries (DOMPurify, html-react-parser) are loaded via dynamic import() "
         "in the SafeHtml component, ensuring they are only fetched when article content "
         "needs to be rendered, not during the initial page load.", False)
    ])
    
    page_break(doc)

    # ===================================================================
    # CHAPTER 6: CONCLUSIONS
    # ===================================================================
    add_heading(doc, "6. Conclusions", 1)
    
    add_heading(doc, "6.1. General conclusions", 2)
    add_p(doc,
        "The StrayPet project has successfully achieved its primary objective of creating "
        "a comprehensive web platform for stray pet adoption and management. All nine core "
        "objectives outlined in Section 1.2 have been implemented:"
    )
    add_bullet(doc, "A centralized pet listing system with 26-field profiles, multi-photo support, and 12 behavioral trait indicators.")
    add_bullet(doc, "A complete adoption workflow with status tracking across five stages (submitted, processing, approved, rejected, closed), enforced by signal-driven state machines.")
    add_bullet(doc, "A lost pet tracking module with form-based reporting and interactive Mapbox GL JS map visualization, supported by dual-provider geocoding (Mapbox + Nominatim).")
    add_bullet(doc, "An intelligent preference matching system using 15 user preference fields to recommend suitable pets.")
    add_bullet(doc, "A community blog with FluentEditor rich text editing, threaded comments, article favoriting, tag organization, and monthly archives.")
    add_bullet(doc, "A holiday family program with detailed application forms, document uploads, photo galleries, and admin review workflow with notification-based communication.")
    add_bullet(doc, "A social system with friendships, rate-limited private messaging, and a unified notification center.")
    add_bullet(doc, "Responsive design through React Bootstrap's grid system and adaptive map components.")
    add_bullet(doc, "Containerized deployment with Docker Compose orchestrating PostgreSQL/PostGIS, Django/Gunicorn, and Adminer services.")
    
    add_p(doc,
        "The development process validated the effectiveness of the iterative methodology. "
        "Each iteration delivered a testable subset of features, allowing early detection of "
        "design issues and continuous refinement. The signal-driven business logic approach "
        "proved particularly valuable, ensuring consistent state transitions across all "
        "interaction points (API, admin interface) without code duplication."
    )
    add_p(doc,
        "Key challenges encountered during development included: FormData handling for "
        "multipart requests with embedded JSON (requiring custom to_internal_value() "
        "overrides in serializers), Polish address format normalization for accurate "
        "geocoding, and managing the complexity of cross-model state transitions "
        "(adoption → pet status, lost report → pet creation) without introducing race conditions."
    )
    
    add_heading(doc, "6.2. Conclusions on technology selection", 2)
    add_p(doc,
        "The technology selections made during the planning phase (Section 2.4) proved to "
        "be well-suited for the project requirements:"
    )
    add_p_multi(doc, [
        ("Django + Django REST Framework: ", True),
        ("The combination provided an exceptionally productive development environment. "
         "Django's ORM eliminated manual SQL writing, the automatic migration system handled "
         "frequent schema changes during the iterative development process, and DRF's "
         "serializer framework enabled flexible data transformation for the dual serializer "
         "pattern. The signal framework proved indispensable for implementing cross-model "
         "business logic. The Django Admin provided a functional administrative interface "
         "with minimal custom code.", False)
    ])
    add_p_multi(doc, [
        ("PostgreSQL + PostGIS: ", True),
        ("The spatial database capabilities justified the additional complexity of the "
         "PostGIS setup. Geographic queries (address storage, coordinate-based operations) "
         "worked seamlessly through GeoDjango's integration. The JSONField support enabled "
         "efficient GeoJSON storage alongside traditional decimal coordinate fields.", False)
    ])
    add_p_multi(doc, [
        ("React 19 + TypeScript: ", True),
        ("The component-based architecture and TypeScript's static typing significantly "
         "reduced runtime errors and improved development confidence during refactoring. "
         "React 19's use() hook simplified context consumption. The Vite build tool provided "
         "near-instant hot module replacement during development.", False)
    ])
    add_p_multi(doc, [
        ("Mapbox GL JS: ", True),
        ("The WebGL-based rendering library delivered smooth map interactions even with "
         "numerous markers. The integrated Geocoding API simplified address-to-coordinate "
         "conversion, and the static image API provided a reliable fallback.", False)
    ])
    add_p(doc,
        "A minor limitation observed was that the default AllowAny permission configuration, "
        "while convenient during development, required careful endpoint-by-endpoint overrides "
        "to ensure proper access control in production. A stricter default (IsAuthenticated) "
        "with explicit AllowAny exceptions might have been a safer approach."
    )
    
    add_heading(doc, "6.3. Future work", 2)
    add_p(doc,
        "Several directions for future development have been identified based on the "
        "current system's capabilities and observed limitations:"
    )
    add_bullet(doc, "Real-time communication: Replace the current 30-second polling-based notification system and point-to-point messaging with WebSocket connections (using Django Channels), enabling instant notification delivery and live chat functionality.")
    add_bullet(doc, "Native mobile application: Develop a React Native mobile client leveraging the existing REST API, providing push notifications, camera integration for pet photos, and GPS-based local pet discovery.")
    add_bullet(doc, "AI-based pet matching: Integrate machine learning models for image-based breed recognition (using pre-trained CNNs such as ResNet or EfficientNet) and behavioral profile prediction from descriptions, improving the recommendation accuracy beyond simple preference matching.")
    add_bullet(doc, "Payment integration: Implement donation payment processing through Stripe or PayPal to enable financial contributions to shelters directly through the platform.")
    add_bullet(doc, "Internationalization (i18n): Extend the platform to support multiple languages (currently the UI is in English with some Polish content), implementing Django's i18n framework on the backend and react-intl on the frontend.")
    add_bullet(doc, "Veterinary integration: Develop APIs for connecting with veterinary record systems, enabling shelters to share health records and vaccination certificates digitally.")
    add_bullet(doc, "Advanced analytics: Build an administrative dashboard with shelter occupancy trends, adoption rate statistics, geographic heat maps of lost pet reports, and user engagement metrics.")
    add_bullet(doc, "Performance testing: Conduct systematic load testing using tools like Locust or k6 to identify bottlenecks and establish scaling strategies for production traffic.")
    
    page_break(doc)

    # ===================================================================
    # BIBLIOGRAPHY
    # ===================================================================
    add_heading(doc, "Bibliography", 1)
    
    refs = [
        '[1] Django Software Foundation, "Django documentation," 2024. [Online]. Available: https://docs.djangoproject.com/en/5.1/',
        '[2] T. Christie, "Django REST Framework," 2024. [Online]. Available: https://www.django-rest-framework.org/',
        '[3] S. Vitorovic, S. Davtyan, "djangorestframework-simplejwt documentation," 2024. [Online]. Available: https://django-rest-framework-simplejwt.readthedocs.io/',
        '[4] Meta Platforms, "React documentation," 2024. [Online]. Available: https://react.dev/',
        '[5] Microsoft, "TypeScript documentation," 2024. [Online]. Available: https://www.typescriptlang.org/docs/',
        '[6] E. You, "Vite – Next Generation Frontend Tooling," 2024. [Online]. Available: https://vitejs.dev/',
        '[7] The PostgreSQL Global Development Group, "PostgreSQL 16 documentation," 2024. [Online]. Available: https://www.postgresql.org/docs/16/',
        '[8] PostGIS Project, "PostGIS documentation," 2024. [Online]. Available: https://postgis.net/documentation/',
        '[9] Mapbox, "Mapbox GL JS documentation," 2024. [Online]. Available: https://docs.mapbox.com/mapbox-gl-js/',
        '[10] Mapbox, "Mapbox Geocoding API documentation," 2024. [Online]. Available: https://docs.mapbox.com/api/search/geocoding/',
        '[11] OpenStreetMap Foundation, "Nominatim API documentation," 2024. [Online]. Available: https://nominatim.org/release-docs/develop/api/',
        '[12] M. Otto, J. Thornton, "Bootstrap documentation," 2024. [Online]. Available: https://getbootstrap.com/docs/5.3/',
        '[13] R. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Doctoral Dissertation, University of California, Irvine, 2000.',
        '[14] M. Jones, J. Bradley, N. Sakimura, "JSON Web Token (JWT)," RFC 7519, IETF, 2015.',
        '[15] Docker Inc., "Docker documentation," 2024. [Online]. Available: https://docs.docker.com/',
        '[16] OpenJS Foundation, "Node.js documentation," 2024. [Online]. Available: https://nodejs.org/docs/',
        '[17] M. Cure, "DOMPurify – A DOM-only XSS sanitizer," 2024. [Online]. Available: https://github.com/cure53/DOMPurify',
        '[18] ahooks Contributors, "ahooks – React Hooks Library," 2024. [Online]. Available: https://ahooks.js.org/',
        '[19] D. Abramov, "Zustand – A small, fast and scalable bearbones state-management solution," 2024. [Online]. Available: https://zustand-demo.pmnd.rs/',
        '[20] Gunicorn Contributors, "Gunicorn – Python WSGI HTTP Server for UNIX," 2024. [Online]. Available: https://gunicorn.org/',
        '[21] FEDIAF, "European Facts & Figures 2023," European Pet Food Industry Federation, Brussels, 2023.',
        '[22] WhiteNoise Contributors, "WhiteNoise – Radically simplified static file serving for Python web apps," 2024. [Online]. Available: http://whitenoise.evans.io/',
        '[23] C. Chugunov, "Django Smart Selects," 2024. [Online]. Available: https://github.com/jazzband/django-smart-selects',
        '[24] OpenTiny, "FluentEditor – Rich Text Editor," 2024. [Online]. Available: https://github.com/opentiny/fluent-editor',
    ]
    
    for ref in refs:
        add_p(doc, ref, font_size=11, first_line_indent=0, space_before=2, space_after=6)
    
    page_break(doc)

    # ===================================================================
    # APPENDIX A: INSTALLATION MANUAL
    # ===================================================================
    add_heading(doc, "Appendix A. Installation manual", 1)
    
    add_heading(doc, "A.1. Prerequisites", 2)
    add_table_with_title(doc, "A.1", "Software prerequisites",
        ["Software", "Minimum Version", "Purpose"],
        [
            ["Python", "3.10+", "Backend runtime"],
            ["Node.js", "18+", "Frontend runtime"],
            ["pnpm", "9+", "Frontend package manager"],
            ["PostgreSQL", "14+", "Database server"],
            ["PostGIS", "3.4+", "PostgreSQL geographic extension"],
            ["Docker", "20+", "Container runtime (optional)"],
            ["Docker Compose", "2.0+", "Container orchestration (optional)"],
            ["Git", "2.0+", "Version control"],
        ]
    )
    
    add_heading(doc, "A.2. Backend setup (Docker)", 2)
    add_code_block(doc, """# Clone repository
git clone <repository-url>
cd StrayPet/backend

# Create .env file
cp .env.example .env
# Edit .env with database credentials and Mapbox token

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Create superuser (first time only)
docker-compose exec web python manage.py createsuperuser

# Access the API at http://localhost:8000
# Access the admin at http://localhost:8000/admin/
# Access Adminer at http://localhost:8080""", "Listing A.1: Backend Docker setup")
    
    add_heading(doc, "A.3. Backend setup (manual)", 2)
    add_code_block(doc, """cd StrayPet/backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\\Scripts\\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure database in server/settings.py
# (or set POSTGRES_* environment variables)

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Start development server
python manage.py runserver""", "Listing A.2: Backend manual setup")
    
    add_heading(doc, "A.4. Frontend setup", 2)
    add_code_block(doc, """cd StrayPet/frontend

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env
# Edit .env with API base URL and Mapbox token

# Start development server
pnpm dev
# Access at http://localhost:5173

# Build for production
pnpm build
# Output in dist/ directory""", "Listing A.3: Frontend setup")
    
    page_break(doc)

    # ===================================================================
    # APPENDIX B: USER MANUAL
    # ===================================================================
    add_heading(doc, "Appendix B. User manual", 1)
    
    add_heading(doc, "B.1. Registration and login", 2)
    add_p(doc,
        "To create a new account, navigate to /auth/register and provide a username, email "
        "address, and password. Click 'Send Code' to receive a 4-digit verification code at "
        "the provided email address. Enter the code and submit the form. Upon successful "
        "registration, you will be automatically logged in and redirected to the home page."
    )
    add_figure_placeholder(doc, "B.1", "Registration page with email verification",
        "Screenshot of the registration form")
    
    add_p(doc,
        "To log in, navigate to /auth/login. Enter your email and password, then solve the "
        "CAPTCHA challenge by typing the characters displayed in the image. If the CAPTCHA "
        "is difficult to read, click the image to generate a new one."
    )
    add_figure_placeholder(doc, "B.2", "Login page with CAPTCHA verification",
        "Screenshot of the login form with captcha image")
    
    add_heading(doc, "B.2. Browsing and adopting pets", 2)
    add_p(doc,
        "The pet adoption page (/adopt) displays available pets in a card grid layout. "
        "Use the filter controls to narrow results by city, species, sex, size, pet name, "
        "and behavioral traits (sterilized, vaccinated, child-friendly, etc.). Click on a "
        "pet card to view its detailed profile including all photos, health information, "
        "and shelter details."
    )
    add_figure_placeholder(doc, "B.3", "Pet listing page with active filters",
        "Screenshot of the adopt page showing filter panel and pet cards")
    
    add_p(doc,
        "To apply for adoption, click the 'Apply to Adopt' button on the pet detail page. "
        "Enter a personal message explaining why you would be a good match for the pet, "
        "then submit the application. You can track the status of your applications in your "
        "profile under 'My Pets'."
    )
    add_figure_placeholder(doc, "B.4", "Pet detail page showing health traits and adoption button",
        "Screenshot of a pet detail page")
    
    add_heading(doc, "B.3. Lost pet tracking", 2)
    add_p(doc,
        "The lost pets page (/lost) provides two views: a list view with filtering and an "
        "interactive map view showing the last known locations of lost pets. Toggle between "
        "views using the tabs at the top of the page."
    )
    add_figure_placeholder(doc, "B.5", "Lost pets map view with location markers",
        "Screenshot of the lost pets page in map mode")
    
    add_p(doc,
        "To report a lost pet, click 'Report Lost Pet' and fill in the form with the pet's "
        "physical description, last known address, loss time, your contact information, "
        "and an optional reward amount. Upload a photo of the pet to help others identify it."
    )
    
    add_heading(doc, "B.4. Blog and community", 2)
    add_p(doc,
        "The blog section (/blog) displays community articles with view counts, comments, "
        "and tags. Click an article to read it and engage through the comment section. "
        "To create a new article, click 'Write Article' and use the rich text editor to "
        "compose your content with formatted text, images, and embedded media."
    )
    add_figure_placeholder(doc, "B.6", "Blog article creation with FluentEditor",
        "Screenshot of the article editor page")
    
    add_heading(doc, "B.5. Holiday family program", 2)
    add_p(doc,
        "The holiday family program (/holiday-family) allows users to apply as temporary "
        "foster families for shelter animals. The application requires personal information, "
        "a description of your living situation, pet care experience, motivation, an ID "
        "document, and family photos. Applications are reviewed by administrators, and "
        "approved users receive a certified holiday family badge on their profile."
    )
    add_figure_placeholder(doc, "B.7", "Holiday family application form",
        "Screenshot of the holiday family application page")
    
    add_heading(doc, "B.6. User profile", 2)
    add_p(doc,
        "The profile page (/user/profile) provides tabbed access to: Personal Info "
        "(avatar, contact details, pet preferences), Favorite Pets, Favorite Articles, "
        "My Articles, My Pets (owned pets and adoption applications), Message Center "
        "(private messages, replies, notifications), and Friends list."
    )
    add_figure_placeholder(doc, "B.8", "User profile page with preference settings",
        "Screenshot of the profile page showing the personal info tab")
    
    page_break(doc)

    # ===================================================================
    # APPENDIX C: API REFERENCE
    # ===================================================================
    add_heading(doc, "Appendix C. API endpoint reference", 1)
    
    add_p(doc,
        "The following tables list all API endpoints exposed by the StrayPet backend, "
        "organized by module."
    )
    
    add_table_with_title(doc, "C.1", "User authentication and profile endpoints",
        ["Method", "Endpoint", "Description", "Auth"],
        [
            ["POST", "/user/token/", "Login (JWT + CAPTCHA)", "No"],
            ["POST", "/user/token/refresh/", "Refresh access token", "No"],
            ["POST", "/user/token/verify/", "Verify token validity", "No"],
            ["POST", "/user/register/", "Register new user", "No"],
            ["GET", "/user/captcha/", "Generate CAPTCHA image", "No"],
            ["POST", "/user/send_email_code/", "Send email verification code", "No"],
            ["POST", "/user/verify_email_code/", "Verify email code", "No"],
            ["GET/PATCH", "/user/me/", "Current user profile", "Yes"],
            ["POST", "/user/password/reset/request/", "Request password reset", "No"],
            ["POST", "/user/password/reset/confirm/", "Confirm password reset", "No"],
            ["POST", "/user/avatars/upload/", "Upload avatar", "Yes"],
            ["POST", "/user/avatars/delete/", "Delete avatar", "Yes"],
            ["GET", "/user/avatars/reset/", "Reset to default avatar", "Yes"],
        ]
    )
    
    add_table_with_title(doc, "C.2", "Pet management endpoints",
        ["Method", "Endpoint", "Description", "Auth"],
        [
            ["GET", "/pet/", "List available pets (filtered)", "No"],
            ["POST", "/pet/", "Create pet listing", "Yes"],
            ["GET", "/pet/<id>/", "Pet detail", "No"],
            ["PATCH", "/pet/<id>/", "Update pet", "Yes (owner)"],
            ["DELETE", "/pet/<id>/", "Delete pet", "Yes (owner)"],
            ["POST", "/pet/<id>/apply/", "Submit adoption application", "Yes"],
            ["POST", "/pet/<id>/favorite/", "Favorite a pet", "Yes"],
            ["DELETE", "/pet/<id>/unfavorite/", "Unfavorite a pet", "Yes"],
            ["GET", "/pet/favorites/", "List favorited pets", "Yes"],
            ["GET", "/pet/my_pets/", "List user's pets", "Yes"],
            ["POST", "/pet/<id>/set_status/", "Change pet status", "Yes (owner)"],
            ["POST", "/pet/<id>/mark_lost/", "Mark pet as lost", "Yes (owner)"],
        ]
    )
    
    add_table_with_title(doc, "C.3", "Adoption, donation, and lost pet endpoints",
        ["Method", "Endpoint", "Description", "Auth"],
        [
            ["GET/POST", "/pet/adoption/", "List/create adoption applications", "Yes"],
            ["GET/PATCH", "/pet/adoption/<id>/", "View/update application", "Yes"],
            ["POST", "/pet/adoption/<id>/approve/", "Admin approve", "Admin"],
            ["GET/POST", "/pet/donation/", "List/create donations", "Mixed"],
            ["GET/PATCH/DEL", "/pet/donation/<id>/", "Donation detail/update/delete", "Yes"],
            ["GET/POST", "/pet/lost/", "List/report lost pets", "Mixed"],
            ["GET/PATCH/DEL", "/pet/lost/<id>/", "Lost pet detail/update/delete", "Mixed"],
            ["GET", "/pet/lost_geo/", "Lost pets GeoJSON", "No"],
            ["GET/POST", "/pet/shelter/", "List/create shelters", "Mixed"],
            ["GET/PUT/DEL", "/pet/shelter/<id>/", "Shelter detail/update/delete", "Mixed"],
        ]
    )
    
    add_table_with_title(doc, "C.4", "Blog and social endpoints",
        ["Method", "Endpoint", "Description", "Auth"],
        [
            ["GET/POST", "/blog/article/", "List/create articles", "Mixed"],
            ["GET/PATCH", "/blog/article/<id>/", "Article detail/update", "Mixed"],
            ["POST", "/blog/article/<id>/add_comment/", "Add comment", "Yes"],
            ["GET", "/blog/article/<id>/comments/", "List comments", "No"],
            ["GET", "/blog/tag/popular/", "Popular tags", "No"],
            ["GET", "/blog/article/archive/", "Archive summary", "No"],
            ["POST", "/user/friendships/add_friend/", "Send friend request", "Yes"],
            ["POST", "/user/friendships/<id>/accept/", "Accept friend request", "Yes"],
            ["GET", "/user/friendships/list_friends/", "List friends", "Yes"],
            ["GET/POST", "/user/messages/", "List/send messages", "Yes"],
            ["GET", "/user/notifications/", "List notifications", "Yes"],
            ["GET", "/user/notifications/unread_count/", "Unread count", "Yes"],
            ["POST", "/user/notifications/mark_all_as_read/", "Mark all read", "Yes"],
        ]
    )
    
    page_break(doc)

    # ===================================================================
    # APPENDIX D: LIST OF FIGURES AND TABLES
    # ===================================================================
    add_heading(doc, "Appendix D. List of figures", 1)
    add_p(doc, "[AUTO-GENERATE: References → Insert Table of Figures → Select 'Figure' label]",
          font_size=10, italic=True, color=(128,128,128), first_line_indent=0)
    
    add_p(doc, "", font_size=30, first_line_indent=0)
    
    add_heading(doc, "Appendix E. List of tables", 1)
    add_p(doc, "[AUTO-GENERATE: References → Insert Table of Figures → Select 'Table' label]",
          font_size=10, italic=True, color=(128,128,128), first_line_indent=0)

    # ===================================================================
    # SAVE
    # ===================================================================
    output = r"c:\Users\alf13\repo\StrayPet\thesis\StrayPet_Thesis.docx"
    doc.save(output)
    print(f"Thesis saved to: {output}")
    
    # Count approximate pages (rough estimate: ~40 lines per page at 11pt)
    total_paragraphs = len(doc.paragraphs)
    print(f"Total paragraphs: {total_paragraphs}")
    print(f"Estimated pages: ~{total_paragraphs // 25}+ pages (including tables and spacing)")


if __name__ == "__main__":
    generate()
