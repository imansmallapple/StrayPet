"""
Generate thesis template for StrayPet project
Based on Warsaw University of Technology formatting requirements
"""

from docx import Document
from docx.shared import Pt, Cm, Mm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml
import copy


def set_cell_shading(cell, color):
    """Set cell background color."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)


def add_page_break(doc):
    """Add a page break."""
    doc.add_page_break()


def set_paragraph_font(paragraph, font_name="Arial", font_size=11, bold=False, italic=False, color=None):
    """Set font properties for all runs in a paragraph."""
    for run in paragraph.runs:
        run.font.name = font_name
        run.font.size = Pt(font_size)
        run.font.bold = bold
        run.font.italic = italic
        if color:
            run.font.color.rgb = RGBColor(*color)
        # Ensure Arial works for non-Latin characters too
        rPr = run._element.get_or_add_rPr()
        rFonts = rPr.find(qn('w:rFonts'))
        if rFonts is None:
            rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{font_name}" w:hAnsi="{font_name}" w:eastAsia="{font_name}" w:cs="{font_name}"/>')
            rPr.insert(0, rFonts)
        else:
            rFonts.set(qn('w:ascii'), font_name)
            rFonts.set(qn('w:hAnsi'), font_name)
            rFonts.set(qn('w:eastAsia'), font_name)
            rFonts.set(qn('w:cs'), font_name)


def add_styled_paragraph(doc, text, font_size=11, bold=False, italic=False, 
                          alignment=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, 
                          space_after=0, font_name="Arial", color=None,
                          first_line_indent=None):
    """Add a paragraph with specific styling."""
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)
    
    # Set font for all character sets
    rPr = run._element.get_or_add_rPr()
    rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{font_name}" w:hAnsi="{font_name}" w:eastAsia="{font_name}" w:cs="{font_name}"/>')
    rPr.insert(0, rFonts)
    
    p.alignment = alignment
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    
    if first_line_indent:
        p.paragraph_format.first_line_indent = Cm(first_line_indent)
    
    return p


def add_heading_styled(doc, text, level=1):
    """Add a heading with proper formatting per requirements.
    Level 1: bold sans-serif 14pt
    Level 2: bold sans-serif 13pt
    Level 3: bold sans-serif 12pt
    """
    sizes = {1: 14, 2: 13, 3: 12}
    font_size = sizes.get(level, 11)
    
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.name = "Arial"
        run.font.size = Pt(font_size)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)
        rPr = run._element.get_or_add_rPr()
        rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>')
        rPr.insert(0, rFonts)
    
    h.paragraph_format.line_spacing = 1.15
    
    return h


def add_placeholder(doc, instruction_text, font_size=11):
    """Add a placeholder instruction in gray italic."""
    p = add_styled_paragraph(
        doc, f"[{instruction_text}]",
        font_size=font_size, italic=True, color=(128, 128, 128),
        space_before=4, space_after=4
    )
    return p


def add_body_text(doc, text):
    """Add normal body text with standard formatting."""
    return add_styled_paragraph(
        doc, text, font_size=11, space_before=4, space_after=4,
        first_line_indent=0.5
    )


def add_figure_caption(doc, number, text):
    """Add figure caption below figure - left-aligned, sans-serif size 9."""
    return add_styled_paragraph(
        doc, f"Figure {number}. {text}",
        font_size=9, space_before=4, space_after=8
    )


def add_table_title(doc, number, text):
    """Add table title above table - left-aligned, sans-serif size 9."""
    return add_styled_paragraph(
        doc, f"Table {number}. {text}",
        font_size=9, space_before=8, space_after=4
    )


def add_source_caption(doc, text):
    """Add source caption below figure/table - sans-serif size 9."""
    return add_styled_paragraph(
        doc, f"Source: {text}",
        font_size=9, italic=True, space_before=2, space_after=8
    )


def add_bullet(doc, text, indent_level=0):
    """Add a bullet point."""
    p = doc.add_paragraph(style='List Bullet')
    p.clear()
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(11)
    rPr = run._element.get_or_add_rPr()
    rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>')
    rPr.insert(0, rFonts)
    p.paragraph_format.line_spacing = 1.15
    if indent_level > 0:
        p.paragraph_format.left_indent = Cm(indent_level * 1.27)
    return p


def setup_page_margins(section):
    """Set up page margins per requirements:
    inner 30mm, outer 20mm, top/bottom 25mm
    Mirror margins for double-sided printing
    """
    section.top_margin = Mm(25)
    section.bottom_margin = Mm(25)
    section.left_margin = Mm(30)  # inner margin
    section.right_margin = Mm(20)  # outer margin
    section.page_width = Mm(210)  # A4
    section.page_height = Mm(297)  # A4
    
    # Enable mirror margins for double-sided printing
    sectPr = section._sectPr
    # Remove existing mirrorMargins if any
    for child in sectPr.findall(qn('w:mirrorMargins')):
        sectPr.remove(child)
    mirror = parse_xml(f'<w:mirrorMargins {nsdecls("w")}/>')
    sectPr.append(mirror)


def setup_page_numbers(section):
    """Add page numbers at the bottom outer side."""
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    
    # Add page number field
    run = p.add_run()
    fldChar1 = parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="begin"/>')
    run._element.append(fldChar1)
    run2 = p.add_run()
    instrText = parse_xml(f'<w:instrText {nsdecls("w")} xml:space="preserve"> PAGE </w:instrText>')
    run2._element.append(instrText)
    run3 = p.add_run()
    fldChar2 = parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="end"/>')
    run3._element.append(fldChar2)
    
    for r in [run, run2, run3]:
        r.font.name = "Arial"
        r.font.size = Pt(9)


def generate_thesis_template():
    doc = Document()
    
    # ============================================================
    # DEFAULT STYLE SETUP
    # ============================================================
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)
    style.paragraph_format.line_spacing = 1.15
    # Set default font for East Asian text
    rPr = style.element.get_or_add_rPr()
    rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>')
    rPr.insert(0, rFonts)
    
    # Setup heading styles
    for level, size in [(1, 14), (2, 13), (3, 12)]:
        style_name = f'Heading {level}'
        if style_name in doc.styles:
            h_style = doc.styles[style_name]
            h_font = h_style.font
            h_font.name = 'Arial'
            h_font.size = Pt(size)
            h_font.bold = True
            h_font.color.rgb = RGBColor(0, 0, 0)
            h_style.paragraph_format.line_spacing = 1.15
    
    # ============================================================
    # PAGE SETUP
    # ============================================================
    section = doc.sections[0]
    setup_page_margins(section)
    setup_page_numbers(section)
    
    # ============================================================
    # TITLE PAGE
    # ============================================================
    # University name
    add_styled_paragraph(doc, "", font_size=11, space_after=30)
    add_styled_paragraph(
        doc, "Warsaw University of Technology",
        font_size=16, bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=8
    )
    add_styled_paragraph(
        doc, "The Faculty of Electronics and Information Technology",
        font_size=13,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=4
    )
    add_styled_paragraph(
        doc, "Institute of Computer Science",
        font_size=12,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=8
    )
    add_styled_paragraph(
        doc, "Academic year 2025/2026",
        font_size=11,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=50
    )
    
    # Thesis type
    add_styled_paragraph(
        doc, "BACHELOR OF SCIENCE THESIS",
        font_size=16, bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=30
    )
    
    # Author
    add_styled_paragraph(
        doc, "[Your Full Name]",
        font_size=14, bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        color=(128, 128, 128),
        space_after=30
    )
    
    # Title
    add_styled_paragraph(
        doc, "StrayPet – A Comprehensive Web Platform",
        font_size=14, bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=4
    )
    add_styled_paragraph(
        doc, "for Stray Pet Adoption and Management",
        font_size=14, bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=50
    )
    
    # Supervisor
    add_styled_paragraph(
        doc, "Supervisor:",
        font_size=12,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=4
    )
    add_styled_paragraph(
        doc, "[Supervisor Name, Title]",
        font_size=12,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        color=(128, 128, 128),
        space_after=30
    )
    
    # Evaluation lines
    add_styled_paragraph(
        doc, "Evaluation .............................................................................",
        font_size=11,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=20
    )
    add_styled_paragraph(
        doc, ".............................................................",
        font_size=11,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=10
    )
    add_styled_paragraph(
        doc, "Signature of the Head",
        font_size=10,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=2
    )
    add_styled_paragraph(
        doc, "of Examination Committee",
        font_size=10,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=0
    )
    
    add_page_break(doc)

    # ============================================================
    # STUDENT INFO / CV PAGE
    # ============================================================
    add_styled_paragraph(doc, "Specialization:", font_size=11, bold=True, space_after=4)
    add_placeholder(doc, "Your specialization, e.g., Computer Science / Electrical and Computer Engineering")
    add_styled_paragraph(doc, "", font_size=6)
    add_styled_paragraph(doc, "Date of birth:", font_size=11, bold=True, space_after=4)
    add_placeholder(doc, "Your date of birth")
    add_styled_paragraph(doc, "", font_size=6)
    add_styled_paragraph(doc, "Date of the beginning of the studies:", font_size=11, bold=True, space_after=4)
    add_placeholder(doc, "e.g., 1 October 2022")
    add_styled_paragraph(doc, "", font_size=10)
    
    add_styled_paragraph(doc, "Curriculum Vitae", font_size=13, bold=True, space_before=10, space_after=8)
    add_placeholder(doc, "Write a brief curriculum vitae / biography. Include information about your education background, relevant experience, exchange programs, etc.")
    
    add_styled_paragraph(doc, "", font_size=30)
    add_styled_paragraph(
        doc, ".....................................",
        font_size=11,
        alignment=WD_ALIGN_PARAGRAPH.RIGHT,
        space_after=2
    )
    add_styled_paragraph(
        doc, "student's signature",
        font_size=10, italic=True,
        alignment=WD_ALIGN_PARAGRAPH.RIGHT,
        space_after=20
    )
    
    add_styled_paragraph(doc, "Bachelor of Science Examination", font_size=13, bold=True, space_before=20, space_after=8)
    add_styled_paragraph(doc, "Examination was held on: ........................................................................", font_size=11, space_after=6)
    add_styled_paragraph(doc, "With the result: ...................................................................................", font_size=11, space_after=6)
    add_styled_paragraph(doc, "Final Result of the Studies: ....................................................................", font_size=11, space_after=6)
    add_styled_paragraph(doc, "Suggestions and Remarks of the B.Sc. Examination Committee: ...............", font_size=11, space_after=4)
    add_styled_paragraph(doc, "....................................................................................................................", font_size=11, space_after=4)
    
    add_page_break(doc)

    # ============================================================
    # SUMMARY PAGE (English)
    # ============================================================
    add_styled_paragraph(
        doc, "SUMMARY",
        font_size=14, bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=16
    )
    
    add_body_text(doc, 
        "StrayPet is a comprehensive web platform designed to facilitate stray pet adoption "
        "and management. The system connects homeless animals with potential adopters through "
        "an intuitive interface that includes pet listings, adoption applications, lost pet "
        "tracking with map-based location display, and intelligent preference matching. "
        "The platform also features a blog and community system to foster engagement among "
        "pet lovers."
    )
    add_placeholder(doc, "Expand the summary to 150-250 words. Describe the motivation, the main features, "
                    "the technologies used (Django, React, PostgreSQL/PostGIS), and the key results.")
    
    add_styled_paragraph(doc, "", font_size=8)
    add_styled_paragraph(doc, "Key words: ", font_size=11, bold=True, space_after=4)
    add_styled_paragraph(
        doc,
        "Web Application, Pet Adoption, Django, React, TypeScript, PostgreSQL, PostGIS, "
        "REST API, JWT Authentication, Mapbox, Responsive Design",
        font_size=11, italic=True, space_after=20
    )
    
    # STRESZCZENIE (Polish summary)
    add_styled_paragraph(
        doc, "STRESZCZENIE",
        font_size=14, bold=True,
        alignment=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=20, space_after=16
    )
    
    add_styled_paragraph(
        doc, "Tytuł: StrayPet – Kompleksowa Platforma Internetowa do Adopcji i Zarządzania Bezdomnymi Zwierzętami",
        font_size=11, bold=True,
        space_after=8
    )
    
    add_placeholder(doc, "Write the Polish translation of the summary above. "
                    "If you're not a native Polish speaker, coordinate with your supervisor for review.")
    
    add_styled_paragraph(doc, "", font_size=8)
    add_styled_paragraph(doc, "Słowa kluczowe: ", font_size=11, bold=True, space_after=4)
    add_placeholder(doc, "Polish translation of keywords")
    
    add_page_break(doc)

    # ============================================================
    # TABLE OF CONTENTS
    # ============================================================
    add_styled_paragraph(
        doc, "Contents",
        font_size=14, bold=True,
        space_after=16
    )
    
    add_placeholder(doc, "TABLE OF CONTENTS - Auto-generate in Word: References tab → Table of Contents. "
                    "Update before final submission by right-clicking → Update Field.")
    
    add_page_break(doc)

    # ============================================================
    # CHAPTER 1: INTRODUCTION
    # ============================================================
    add_heading_styled(doc, "1. Introduction", level=1)
    
    # 1.1 Preface
    add_heading_styled(doc, "1.1. Preface", level=2)
    add_body_text(doc,
        "This document is the written result of a bachelor thesis, submitted in complete "
        "fulfillment of all requirements for the Bachelor's Degree at Warsaw University "
        "of Technology, Faculty of Electronics and Information Technology. It demonstrates "
        "work done by the author during the academic year 2025/2026."
    )
    add_placeholder(doc, "Expand this section: mention the thesis supervisor, the institute, "
                    "the time period of development, and a brief overview of what the document describes.")
    
    # 1.2 Objectives
    add_heading_styled(doc, "1.2. Objectives of the project", level=2)
    add_body_text(doc,
        "The primary objective of the StrayPet project is to develop a comprehensive web "
        "platform that addresses the challenges faced in stray pet adoption. The platform "
        "aims to:"
    )
    add_bullet(doc, "Provide an intuitive interface for browsing and adopting pets")
    add_bullet(doc, "Enable users to report and track lost pets using map-based technology")
    add_bullet(doc, "Implement intelligent pet recommendation based on user preferences")
    add_bullet(doc, "Create a community space through blog articles and comment systems")
    add_bullet(doc, "Offer a seamless user experience on both desktop and mobile devices")
    add_placeholder(doc, "Expand each objective with more detail. Explain the motivation "
                    "behind the project and why these objectives are important.")
    
    # 1.3 Scope
    add_heading_styled(doc, "1.3. Scope of the thesis", level=2)
    add_placeholder(doc, "Define the scope of this thesis. What is included and what is excluded? "
                    "Mention that the system covers: pet adoption, donation, lost pet tracking, "
                    "user management, blog, notifications, but may not cover: payment processing, "
                    "veterinary integration, etc.")
    
    # 1.4 Structure of the document
    add_heading_styled(doc, "1.4. Structure of the document", level=2)
    add_body_text(doc,
        "This thesis is organized as follows:"
    )
    add_bullet(doc, "Chapter 1 – Introduction: Presents the preface, objectives, scope, and document structure.")
    add_bullet(doc, "Chapter 2 – Problem Analysis: Discusses the methodology, system overview, similar systems, and technology selection.")
    add_bullet(doc, "Chapter 3 – System Design: Describes the architecture, database model, and API design.")
    add_bullet(doc, "Chapter 4 – Implementation: Details the backend and frontend implementation.")
    add_bullet(doc, "Chapter 5 – Testing and Deployment: Covers testing strategies and deployment configuration.")
    add_bullet(doc, "Chapter 6 – Conclusions: Summarizes findings, evaluates the project, and suggests future work.")
    add_bullet(doc, "Appendices: Include installation manual, user manual, and additional materials.")
    
    add_page_break(doc)

    # ============================================================
    # CHAPTER 2: PROBLEM ANALYSIS
    # ============================================================
    add_heading_styled(doc, "2. Problem analysis", level=1)
    
    # 2.1 Methodology
    add_heading_styled(doc, "2.1. Methodology of work", level=2)
    add_placeholder(doc, "Describe the methodology used during development. Consider: "
                    "Agile/iterative approach, version control with Git, project management tools, "
                    "development workflow (feature branches, code review), "
                    "testing strategy, deployment pipeline.")
    
    # 2.2 System overview
    add_heading_styled(doc, "2.2. System overview", level=2)
    
    add_heading_styled(doc, "2.2.1. Requirements analysis", level=3)
    add_body_text(doc,
        "The StrayPet platform has been designed to meet the following functional and "
        "non-functional requirements:"
    )
    add_styled_paragraph(doc, "Functional Requirements:", font_size=11, bold=True, space_before=8, space_after=4)
    add_bullet(doc, "FR1: User registration, authentication (JWT), and profile management")
    add_bullet(doc, "FR2: Pet listing with detailed information (breed, age, gender, health status, traits)")
    add_bullet(doc, "FR3: Pet adoption application submission and tracking")
    add_bullet(doc, "FR4: Pet donation with review workflow before publishing")
    add_bullet(doc, "FR5: Lost pet reporting with geographic location (PostGIS)")
    add_bullet(doc, "FR6: Map-based pet search and display (Mapbox GL / Leaflet)")
    add_bullet(doc, "FR7: Smart pet matching based on user preferences")
    add_bullet(doc, "FR8: Blog article system with comments and replies")
    add_bullet(doc, "FR9: Real-time notification system")
    add_bullet(doc, "FR10: Multi-criteria pet filtering and keyword search")
    add_bullet(doc, "FR11: Holiday family / temporary foster system")
    
    add_styled_paragraph(doc, "Non-Functional Requirements:", font_size=11, bold=True, space_before=8, space_after=4)
    add_bullet(doc, "NFR1: Responsive design for mobile and desktop")
    add_bullet(doc, "NFR2: Secure authentication and authorization")
    add_bullet(doc, "NFR3: RESTful API architecture")
    add_bullet(doc, "NFR4: Scalable deployment with Docker")
    add_placeholder(doc, "Expand requirements with more details and prioritization.")
    
    add_heading_styled(doc, "2.2.2. Use cases", level=3)
    add_placeholder(doc, "Describe the main use cases with use case diagrams. Consider actors: "
                    "Anonymous User, Registered User, Administrator. "
                    "Draw use case diagrams showing the interactions. Include: "
                    "- Browse pets, View pet details, Adopt pet "
                    "- Register/Login, Manage profile, Set preferences "
                    "- Donate pet, Report lost pet "
                    "- Read/Write blog articles, Comment "
                    "- Receive notifications "
                    "Insert use case diagram here.")
    
    # 2.3 Similar systems
    add_heading_styled(doc, "2.3. Similar systems", level=2)
    
    add_heading_styled(doc, "2.3.1. Petfinder", level=3)
    add_placeholder(doc, "Describe Petfinder (petfinder.com) - one of the largest pet adoption platforms. "
                    "Analyze its features, strengths, and limitations. Compare with StrayPet.")
    
    add_heading_styled(doc, "2.3.2. Adopt-a-Pet", level=3)
    add_placeholder(doc, "Describe Adopt-a-Pet platform. Analyze features and compare.")
    
    add_heading_styled(doc, "2.3.3. Local shelter websites", level=3)
    add_placeholder(doc, "Discuss existing Polish/European pet adoption platforms or shelter websites. "
                    "Identify gaps that StrayPet addresses.")
    
    add_heading_styled(doc, "2.3.4. Comparison summary", level=3)
    add_placeholder(doc, "Create a comparison table of features across similar systems. "
                    "Use Table format per requirements (title above, sans-serif 9pt).")
    
    # 2.4 Technology selection
    add_heading_styled(doc, "2.4. Technology selection", level=2)
    
    add_heading_styled(doc, "2.4.1. Database Management System", level=3)
    add_body_text(doc,
        "PostgreSQL has been selected as the database management system for StrayPet, "
        "primarily due to its robust support for geographic data through the PostGIS "
        "extension. The platform's core functionality of map-based pet location tracking "
        "requires efficient spatial queries, which PostGIS provides natively."
    )
    add_placeholder(doc, "Expand: compare PostgreSQL+PostGIS vs MySQL vs MongoDB. "
                    "Justify the choice with concrete features needed by the project.")
    
    add_heading_styled(doc, "2.4.2. Server-side technologies", level=3)
    add_body_text(doc,
        "The backend of StrayPet is built using Django 5.1, a high-level Python web "
        "framework, combined with Django REST Framework 3.15 for building the RESTful API. "
        "Authentication is handled through JWT (JSON Web Tokens) using the "
        "djangorestframework-simplejwt library."
    )
    add_placeholder(doc, "Expand: describe Django's MVT architecture, DRF serializers, "
                    "JWT authentication flow, Pillow for image processing. "
                    "Compare with alternatives (Flask, Express.js, Spring Boot).")
    
    add_heading_styled(doc, "2.4.3. Client-side technologies", level=3)
    add_body_text(doc,
        "The frontend is developed using React 19 with TypeScript, built with Vite 6 "
        "as the development and build tool. The UI component library used is React Bootstrap, "
        "with routing handled by React Router v6. State management relies on ahooks "
        "(specifically useRequest). Map functionality is provided by Mapbox GL with "
        "Leaflet as a fallback option."
    )
    add_placeholder(doc, "Expand: discuss React component architecture, TypeScript benefits, "
                    "Vite vs Webpack, Mapbox GL integration for geographic features, "
                    "FluentEditor for rich text editing.")
    
    add_heading_styled(doc, "2.4.4. Version control and deployment", level=3)
    add_placeholder(doc, "Describe: Git for version control, Docker + docker-compose for containerization, "
                    "Gunicorn as WSGI server, Nginx as reverse proxy. "
                    "Include deployment architecture diagram.")
    
    add_page_break(doc)

    # ============================================================
    # CHAPTER 3: SYSTEM DESIGN
    # ============================================================
    add_heading_styled(doc, "3. System design", level=1)
    
    add_heading_styled(doc, "3.1. System architecture", level=2)
    add_body_text(doc,
        "StrayPet follows a client-server architecture with a clear separation between "
        "the frontend and backend. The frontend React application communicates with the "
        "Django backend exclusively through RESTful API endpoints."
    )
    add_placeholder(doc, "Include a system architecture diagram showing: "
                    "React Frontend ↔ REST API ↔ Django Backend ↔ PostgreSQL/PostGIS. "
                    "Also show: Nginx, Gunicorn, Docker containers, static/media file serving.")
    
    add_heading_styled(doc, "3.2. Database model", level=2)
    add_body_text(doc,
        "The database model consists of the following main entities organized into "
        "Django applications:"
    )
    add_bullet(doc, "User app: Custom user model with profile, preferences, and avatar")
    add_bullet(doc, "Pet app: Pet model with breeds, traits, photos, shelters, lost pets, adoption applications")
    add_bullet(doc, "Blog app: Articles with categories and tags")
    add_bullet(doc, "Comment app: Threaded comment system with replies")
    add_bullet(doc, "Holiday Family app: Temporary foster/holiday family management")
    add_placeholder(doc, "Include Entity-Relationship (ER) diagram. "
                    "Describe each model's key fields and relationships in detail. "
                    "Show foreign key relationships, many-to-many relationships.")
    
    add_heading_styled(doc, "3.3. API design", level=2)
    add_placeholder(doc, "Describe the REST API design: "
                    "- URL structure and naming conventions "
                    "- Authentication and permission system "
                    "- Serializer design patterns "
                    "- Pagination approach "
                    "- Key API endpoints grouped by app "
                    "Include API endpoint table with method, URL, description, auth required.")
    
    add_heading_styled(doc, "3.4. User interface design", level=2)
    add_placeholder(doc, "Describe UI/UX design decisions: "
                    "- Responsive layout approach "
                    "- Navigation structure "
                    "- Key page wireframes or mockups "
                    "- Color scheme and typography "
                    "- Map integration design")
    
    add_page_break(doc)

    # ============================================================
    # CHAPTER 4: IMPLEMENTATION
    # ============================================================
    add_heading_styled(doc, "4. Implementation", level=1)
    
    add_heading_styled(doc, "4.1. Backend implementation", level=2)
    
    add_heading_styled(doc, "4.1.1. Django project structure", level=3)
    add_placeholder(doc, "Describe the Django project organization: "
                    "server/ (settings, urls), apps/ (pet, user, blog, comment, holiday_family), "
                    "api/ (serializers, views, urls), common/ (pagination, utils). "
                    "Show directory structure diagram.")
    
    add_heading_styled(doc, "4.1.2. Data models", level=3)
    add_placeholder(doc, "Detail the implementation of Django models: "
                    "- Pet model (fields, validators, geographic fields) "
                    "- User model (custom user, preferences) "
                    "- Blog and Comment models "
                    "- Include relevant code snippets")
    
    add_heading_styled(doc, "4.1.3. API views and serializers", level=3)
    add_placeholder(doc, "Describe implementation of DRF views: "
                    "- ViewSets and generic views used "
                    "- Serializer patterns (nested, dynamic fields) "
                    "- Custom permissions "
                    "- Filtering and search implementation "
                    "- Include code snippets of key serializers/views")
    
    add_heading_styled(doc, "4.1.4. Authentication and authorization", level=3)
    add_placeholder(doc, "Describe JWT authentication implementation: "
                    "- Token generation and refresh flow "
                    "- Permission classes "
                    "- User registration and password reset")
    
    add_heading_styled(doc, "4.1.5. Geographic features", level=3)
    add_placeholder(doc, "Describe PostGIS integration: "
                    "- Spatial fields in models "
                    "- Distance-based queries "
                    "- Geocoding integration "
                    "- Map data API endpoints")
    
    add_heading_styled(doc, "4.2. Frontend implementation", level=2)
    
    add_heading_styled(doc, "4.2.1. Project structure", level=3)
    add_placeholder(doc, "Describe React project organization: "
                    "src/views/ (page components), src/components/ (shared), "
                    "src/services/ (API), src/router/, src/utils/")
    
    add_heading_styled(doc, "4.2.2. Key components", level=3)
    add_placeholder(doc, "Describe implementation of key UI components: "
                    "- Pet listing and detail views "
                    "- Map component (Mapbox GL integration) "
                    "- Search and filter components "
                    "- Adoption form "
                    "- Blog and comment components "
                    "- Notification system "
                    "- Include screenshots")
    
    add_heading_styled(doc, "4.2.3. State management and API integration", level=3)
    add_placeholder(doc, "Describe how frontend manages state: "
                    "- ahooks useRequest for API calls "
                    "- React Router for navigation "
                    "- Local state vs shared state "
                    "- Error handling and loading states")
    
    add_heading_styled(doc, "4.2.4. Responsive design", level=3)
    add_placeholder(doc, "Describe responsive design implementation: "
                    "- React Bootstrap grid system "
                    "- Media queries "
                    "- Mobile-first approach "
                    "- Screenshot comparisons (desktop vs mobile)")
    
    add_page_break(doc)

    # ============================================================
    # CHAPTER 5: TESTING AND DEPLOYMENT
    # ============================================================
    add_heading_styled(doc, "5. Testing and deployment", level=1)
    
    add_heading_styled(doc, "5.1. Testing strategy", level=2)
    add_placeholder(doc, "Describe testing approach: "
                    "- Unit tests (Django TestCase, serializer tests) "
                    "- API testing (DRF APITestCase) "
                    "- Manual testing scenarios "
                    "- Test coverage")
    
    add_heading_styled(doc, "5.2. Deployment configuration", level=2)
    add_placeholder(doc, "Describe deployment setup: "
                    "- Docker and docker-compose configuration "
                    "- Gunicorn WSGI server "
                    "- Nginx reverse proxy "
                    "- Static and media file serving "
                    "- Environment variable management "
                    "- Include docker-compose.yml diagram/explanation")
    
    add_heading_styled(doc, "5.3. Performance considerations", level=2)
    add_placeholder(doc, "Discuss performance: "
                    "- Database query optimization "
                    "- Caching strategy (django_cache) "
                    "- Image optimization "
                    "- API pagination "
                    "- Frontend bundle optimization (Vite)")
    
    add_page_break(doc)

    # ============================================================
    # CHAPTER 6: CONCLUSIONS
    # ============================================================
    add_heading_styled(doc, "6. Conclusions", level=1)
    
    add_heading_styled(doc, "6.1. General conclusions", level=2)
    add_placeholder(doc, "Summarize the project achievements: "
                    "- Were all objectives met? "
                    "- What were the main challenges? "
                    "- What was learned during development?")
    
    add_heading_styled(doc, "6.2. Conclusions on technology selection", level=2)
    add_placeholder(doc, "Evaluate the technology choices: "
                    "- Was Django+DRF a good choice? "
                    "- React+TypeScript evaluation "
                    "- PostgreSQL+PostGIS effectiveness "
                    "- Docker deployment experience")
    
    add_heading_styled(doc, "6.3. Future work", level=2)
    add_placeholder(doc, "Suggest future improvements: "
                    "- Mobile native application "
                    "- Real-time chat between adopters and shelters "
                    "- AI-based pet image recognition "
                    "- Payment integration for donations "
                    "- Multi-language support "
                    "- Integration with veterinary systems")
    
    add_page_break(doc)

    # ============================================================
    # BIBLIOGRAPHY
    # ============================================================
    add_heading_styled(doc, "Bibliography", level=1)
    
    add_styled_paragraph(doc, "[1]", font_size=11, bold=True, space_after=2)
    add_styled_paragraph(
        doc, '     Django Software Foundation, "Django documentation," 2024. '
        '[Online]. Available: https://docs.djangoproject.com/',
        font_size=11, space_after=8
    )
    add_styled_paragraph(doc, "[2]", font_size=11, bold=True, space_after=2)
    add_styled_paragraph(
        doc, '     T. Christie, "Django REST framework," 2024. '
        '[Online]. Available: https://www.django-rest-framework.org/',
        font_size=11, space_after=8
    )
    add_styled_paragraph(doc, "[3]", font_size=11, bold=True, space_after=2)
    add_styled_paragraph(
        doc, '     Meta Platforms, "React documentation," 2024. '
        '[Online]. Available: https://react.dev/',
        font_size=11, space_after=8
    )
    add_styled_paragraph(doc, "[4]", font_size=11, bold=True, space_after=2)
    add_styled_paragraph(
        doc, '     The PostgreSQL Global Development Group, "PostgreSQL documentation," '
        '2024. [Online]. Available: https://www.postgresql.org/docs/',
        font_size=11, space_after=8
    )
    add_styled_paragraph(doc, "[5]", font_size=11, bold=True, space_after=2)
    add_styled_paragraph(
        doc, '     PostGIS Project, "PostGIS documentation," 2024. '
        '[Online]. Available: https://postgis.net/documentation/',
        font_size=11, space_after=8
    )
    add_styled_paragraph(doc, "[6]", font_size=11, bold=True, space_after=2)
    add_styled_paragraph(
        doc, '     Mapbox, "Mapbox GL JS documentation," 2024. '
        '[Online]. Available: https://docs.mapbox.com/mapbox-gl-js/',
        font_size=11, space_after=8
    )
    add_styled_paragraph(doc, "[7]", font_size=11, bold=True, space_after=2)
    add_styled_paragraph(
        doc, '     E. You, "Vite documentation," 2024. '
        '[Online]. Available: https://vitejs.dev/',
        font_size=11, space_after=8
    )
    add_styled_paragraph(doc, "[8]", font_size=11, bold=True, space_after=2)
    add_styled_paragraph(
        doc, '     Microsoft, "TypeScript documentation," 2024. '
        '[Online]. Available: https://www.typescriptlang.org/docs/',
        font_size=11, space_after=8
    )
    
    add_placeholder(doc, "Add more references as needed. Use numeric style [N] per PN standard. "
                    "Include references to: Docker documentation, React Bootstrap, ahooks, "
                    "JWT specification (RFC 7519), relevant academic papers on pet adoption systems, "
                    "web application architecture, etc. Arrange alphabetically by author surname.")
    
    add_page_break(doc)

    # ============================================================
    # APPENDIX A: INSTALLATION MANUAL
    # ============================================================
    add_heading_styled(doc, "Appendix A. Installation manual", level=1)
    
    add_heading_styled(doc, "A.1. Prerequisites", level=2)
    add_bullet(doc, "Python 3.10+")
    add_bullet(doc, "Node.js 18+")
    add_bullet(doc, "pnpm 9+")
    add_bullet(doc, "PostgreSQL 14+ with PostGIS extension")
    add_bullet(doc, "Docker and Docker Compose (optional)")
    add_bullet(doc, "Mapbox API Token (optional, for map features)")
    
    add_heading_styled(doc, "A.2. Backend setup", level=2)
    add_placeholder(doc, "Provide step-by-step backend installation instructions: "
                    "1. Clone repository, 2. Create virtual environment, "
                    "3. Install dependencies (pip install -r requirements.txt), "
                    "4. Configure database settings, 5. Run migrations, "
                    "6. Create superuser, 7. Run development server. "
                    "Also include Docker-based setup with docker-compose.")
    
    add_heading_styled(doc, "A.3. Frontend setup", level=2)
    add_placeholder(doc, "Provide step-by-step frontend installation: "
                    "1. cd frontend, 2. pnpm install, 3. Configure environment variables, "
                    "4. pnpm dev for development, 5. pnpm build for production.")
    
    add_heading_styled(doc, "A.4. Docker deployment", level=2)
    add_placeholder(doc, "Describe full Docker deployment: "
                    "docker-compose configuration, environment variables, "
                    "volume mounts, network configuration.")
    
    add_page_break(doc)

    # ============================================================
    # APPENDIX B: USER MANUAL
    # ============================================================
    add_heading_styled(doc, "Appendix B. User manual", level=1)
    
    add_heading_styled(doc, "B.1. Registration and login", level=2)
    add_placeholder(doc, "Describe user registration and login process with screenshots.")
    
    add_heading_styled(doc, "B.2. Browsing and searching pets", level=2)
    add_placeholder(doc, "Describe how to browse pets, use filters, map search. Include screenshots.")
    
    add_heading_styled(doc, "B.3. Adopting a pet", level=2)
    add_placeholder(doc, "Describe the adoption application process. Include screenshots.")
    
    add_heading_styled(doc, "B.4. Donating a pet", level=2)
    add_placeholder(doc, "Describe how to list a pet for adoption. Include screenshots.")
    
    add_heading_styled(doc, "B.5. Lost pet tracking", level=2)
    add_placeholder(doc, "Describe lost pet reporting and map-based tracking. Include screenshots.")
    
    add_heading_styled(doc, "B.6. Blog and community", level=2)
    add_placeholder(doc, "Describe blog reading, commenting, and community features. Include screenshots.")
    
    add_heading_styled(doc, "B.7. User profile and preferences", level=2)
    add_placeholder(doc, "Describe profile management and preference setting. Include screenshots.")
    
    add_heading_styled(doc, "B.8. Notifications", level=2)
    add_placeholder(doc, "Describe notification system usage. Include screenshots.")
    
    add_page_break(doc)

    # ============================================================
    # APPENDIX C: LIST OF FIGURES AND TABLES
    # ============================================================
    add_heading_styled(doc, "Appendix C. List of figures", level=1)
    add_placeholder(doc, "Auto-generate in Word: References tab → Insert Table of Figures. "
                    "Select 'Figure' label.")
    
    add_styled_paragraph(doc, "", font_size=20)
    
    add_heading_styled(doc, "Appendix D. List of tables", level=1)
    add_placeholder(doc, "Auto-generate in Word: References tab → Insert Table of Figures. "
                    "Select 'Table' label.")
    
    # ============================================================
    # SAVE DOCUMENT
    # ============================================================
    output_path = r"c:\Users\alf13\repo\StrayPet\thesis\StrayPet_Thesis_Template.docx"
    doc.save(output_path)
    print(f"Template saved to: {output_path}")
    print(f"Total sections: 6 chapters + 4 appendices")
    print("Format: A4, Arial 11pt, line spacing 1.15, mirror margins (30/20/25/25 mm)")


if __name__ == "__main__":
    generate_thesis_template()
