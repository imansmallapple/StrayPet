"""Phase 4: Chapter 4 — Implementation (backend + frontend details, code listings)."""

from thesis_utils import *


def write_ch4(doc):
    add_heading(doc, "4. Implementation", 1)

    # =====================================================================
    # 4.1 Backend Implementation
    # =====================================================================
    add_heading(doc, "4.1. Backend implementation", 2)
    add_p(doc,
        "The backend is implemented as a Django 5.1 project with Django REST Framework 3.15 "
        "providing the API layer. The project follows a modular architecture with five "
        "Django applications (pet, user, blog, comment, holiday_family), a shared utility "
        "module (common), and the server configuration package."
    )

    # 4.1.1 Project structure
    add_heading(doc, "4.1.1. Project structure", 3)
    add_p(doc,
        "The backend source tree is organised as follows. Each Django application "
        "contains models.py, views.py, serializer.py, admin.py, signals.py, and urls.py "
        "files following Django conventions:"
    )
    add_code_block(doc,
        "backend/\n"
        "├── manage.py                  # Django management entry point\n"
        "├── requirements.txt           # Python dependencies (34 packages)\n"
        "├── Dockerfile                 # Multi-stage Docker build\n"
        "├── docker-compose.yml         # 3-service composition\n"
        "├── server/\n"
        "│   ├── settings.py            # Project configuration (220 lines)\n"
        "│   ├── urls.py                # Root URL routing\n"
        "│   └── wsgi.py / asgi.py      # WSGI/ASGI entry points\n"
        "├── api/\n"
        "│   ├── serializers.py         # Shared / base serialisers\n"
        "│   ├── urls.py                # API URL aggregation\n"
        "│   └── views.py               # Cross-cutting API views\n"
        "├── apps/\n"
        "│   ├── pet/                   # Pet management (12 models)\n"
        "│   ├── user/                  # User profiles, friends, messages\n"
        "│   ├── blog/                  # Articles, categories, tags\n"
        "│   ├── comment/               # Generic comment system\n"
        "│   └── holiday_family/        # Holiday family applications\n"
        "├── common/\n"
        "│   ├── utils.py               # CAPTCHA + geocoding utilities\n"
        "│   └── pagination.py          # Custom pagination class\n"
        "├── media/                     # User-uploaded files\n"
        "└── static/                    # Collected static files",
        "Listing 4.1: Backend directory structure"
    )

    # 4.1.2 Signal-driven business logic
    add_heading(doc, "4.1.2. Signal-driven business logic", 3)
    add_p(doc,
        "Django's signal framework is used extensively to enforce business rules that must "
        "be consistent regardless of whether data changes originate from the REST API, the "
        "Django Admin interface, or management commands. Three signal modules implement "
        "the core business logic: pet/signals.py (adoption lifecycle + lost-pet "
        "synchronisation), user/signals.py (profile auto-creation + notification "
        "generation), and comment/signals.py (comment notification dispatch)."
    )

    add_p(doc, "Adoption Lifecycle Signals", bold=True, first_line_indent=0, space_before=8)
    add_p(doc,
        "The adoption workflow is managed by two signal handlers in apps/pet/signals.py. "
        "The first handler, set_pet_pending_on_create, fires on the post_save signal "
        "of the Adoption model. When a new adoption application is created (created=True) "
        "and the associated pet's status is AVAILABLE, the handler transitions the pet to "
        "PENDING status. This prevents concurrent adoption applications from appearing to "
        "target an 'available' pet."
    )
    add_code_block(doc,
        "@receiver(post_save, sender=Adoption)\n"
        "def set_pet_pending_on_create(sender, instance: Adoption,\n"
        "                              created, **kwargs):\n"
        "    if not created:\n"
        "        return\n"
        "    pet = instance.pet\n"
        "    if pet.status == Pet.Status.AVAILABLE:\n"
        "        pet.status = Pet.Status.PENDING\n"
        "        pet.save(update_fields=['status', 'pub_date'])",
        "Listing 4.2: Signal handler — set pet to PENDING on new adoption"
    )

    add_p(doc,
        "The second handler, handle_status_transitions, uses the pre_save signal to "
        "intercept status changes on existing Adoption records. It loads the previous "
        "status from the database and compares it with the new status. If the adoption "
        "is approved, it transitions the pet to ADOPTED status and bulk-closes all other "
        "open applications for the same pet within an atomic transaction. If the adoption "
        "is rejected or closed and no other open applications remain, the pet reverts to "
        "AVAILABLE status."
    )
    add_code_block(doc,
        "OPEN_STATUSES = {'submitted', 'processing'}\n\n"
        "@receiver(pre_save, sender=Adoption)\n"
        "def handle_status_transitions(sender, instance: Adoption,\n"
        "                              **kwargs):\n"
        "    if not instance.pk:\n"
        "        return\n"
        "    try:\n"
        "        old_status = sender.objects.only('status')\\\n"
        "                          .get(pk=instance.pk).status\n"
        "    except sender.DoesNotExist:\n"
        "        return\n"
        "    new_status = instance.status\n"
        "    if old_status == new_status:\n"
        "        return\n"
        "    pet = instance.pet\n\n"
        "    # Approval: mark pet adopted, close other applications\n"
        "    if new_status == 'approved':\n"
        "        with transaction.atomic():\n"
        "            if pet.status != Pet.Status.ADOPTED:\n"
        "                pet.status = Pet.Status.ADOPTED\n"
        "                pet.save(update_fields=['status', 'pub_date'])\n"
        "            sender.objects.filter(\n"
        "                pet=pet, status__in=OPEN_STATUSES\n"
        "            ).exclude(pk=instance.pk).update(status='closed')\n"
        "        return\n\n"
        "    # Rejection/closure: revert pet if no open applications\n"
        "    if new_status in {'closed', 'rejected'}:\n"
        "        open_exists = sender.objects.filter(\n"
        "            pet=pet, status__in=OPEN_STATUSES\n"
        "        ).exclude(pk=instance.pk).exists()\n"
        "        if not open_exists and pet.status in (\n"
        "            Pet.Status.PENDING, Pet.Status.AVAILABLE):\n"
        "            pet.status = Pet.Status.AVAILABLE\n"
        "            pet.save(update_fields=['status', 'pub_date'])",
        "Listing 4.3: Signal handler — adoption status transitions with atomic transaction"
    )

    add_p(doc, "Lost-Pet Synchronisation Signal", bold=True, first_line_indent=0, space_before=8)
    add_p(doc,
        "The sync_pet_with_lost signal handler fires after every Lost record save and "
        "maintains bidirectional consistency between the Lost and Pet tables. When a "
        "new Lost record is created without an associated Pet, the handler first searches "
        "for an existing Pet with the same name and reporter. If none is found, it creates "
        "a new Pet record with LOST status, copying species, breed, description, address, "
        "and photo data. If a Pet already exists, it updates any changed fields (species, "
        "breed, description, address, photo) using a selective update_fields list for "
        "minimal database writes."
    )
    add_code_block(doc,
        "@receiver(post_save, sender=Lost)\n"
        "def sync_pet_with_lost(sender, instance: Lost, created,\n"
        "                       **kwargs):\n"
        "    pet = instance.pet\n"
        "    if not pet:\n"
        "        pet = Pet.objects.filter(\n"
        "            name=instance.pet_name,\n"
        "            created_by=instance.reporter\n"
        "        ).first()\n"
        "    if not pet:\n"
        "        pet = Pet.objects.create(\n"
        "            name=instance.pet_name or\n"
        "                 f'{instance.species} ({instance.color})',\n"
        "            species=instance.species or 'unknown',\n"
        "            breed=instance.breed or '',\n"
        "            sex=_safe_sex(instance.sex or 'male'),\n"
        "            description=instance.description or '',\n"
        "            address=instance.address,\n"
        "            status=Pet.Status.LOST,\n"
        "            created_by=instance.reporter,\n"
        "        )\n"
        "        ... # copy photo if present\n\n"
        "    # When Lost is FOUND/CLOSED, revert Pet to AVAILABLE\n"
        "    if instance.status in (LostStatus.FOUND, LostStatus.CLOSED)\\\n"
        "       and pet.status == Pet.Status.LOST:\n"
        "        pet.status = Pet.Status.AVAILABLE\n"
        "        pet.save(update_fields=['status', 'pub_date'])",
        "Listing 4.4: Signal handler — synchronising Lost reports with Pet records"
    )

    # 4.1.3 User profile auto-creation and avatar generation
    add_heading(doc, "4.1.3. User profile auto-creation and avatar generation", 3)
    add_p(doc,
        "When a new user registers, a post_save signal on the User model automatically "
        "creates a UserProfile record and generates a default avatar image. The avatar "
        "generator uses the Pillow library (PIL) to create a 200×200 pixel image with "
        "the user's initials rendered on a deterministic colour background — the colour "
        "is selected from a palette of 10 predefined colours using a hash of the username, "
        "ensuring consistent avatar appearance across sessions."
    )
    add_code_block(doc,
        "@receiver(post_save, sender=settings.AUTH_USER_MODEL)\n"
        "def create_profile(sender, instance, created, **kwargs):\n"
        "    if created:\n"
        "        profile, _ = UserProfile.objects.get_or_create(\n"
        "            user=instance)\n"
        "        if not profile.avatar:\n"
        "            default_avatar = generate_default_avatar(\n"
        "                instance.username)\n"
        "            profile.avatar.save(\n"
        "                f'{instance.username}_avatar.png',\n"
        "                default_avatar, save=True)",
        "Listing 4.5: Signal handler — automatic profile and avatar creation"
    )
    add_code_block(doc,
        "def generate_default_avatar(username: str,\n"
        "                            size: int = 200) -> ContentFile:\n"
        "    initials = (username[:2] if len(username) >= 2\n"
        "               else username[0] * 2).upper()\n"
        "    colors = [\n"
        "        (255, 107, 107),   # Red\n"
        "        (66, 165, 245),    # Blue\n"
        "        (102, 187, 106),   # Green\n"
        "        (255, 167, 38),    # Orange\n"
        "        (171, 71, 188),    # Purple\n"
        "        ...  # 10 colours total\n"
        "    ]\n"
        "    color = colors[\n"
        "        sum(ord(c) for c in username) % len(colors)]\n"
        "    image = Image.new('RGB', (size, size), color=color)\n"
        "    draw = ImageDraw.Draw(image)\n"
        "    # Centre initials on canvas\n"
        "    draw.text((x, y), initials,\n"
        "              fill=(255, 255, 255), font=font)\n"
        "    return ContentFile(img_io.getvalue())",
        "Listing 4.6: Default avatar generation with Pillow"
    )

    # 4.1.4 Geocoding and address resolution
    add_heading(doc, "4.1.4. Geocoding and address resolution", 3)
    add_p(doc,
        "The geocoding system resolves user-provided addresses (street, city, postal code, "
        "country) into longitude/latitude coordinates for map display. It implements a "
        "dual-provider strategy with automatic fallback: Mapbox Geocoding API v5 is the "
        "primary provider, with OpenStreetMap Nominatim as a fallback when Mapbox fails "
        "or returns low-confidence results. All results are cached for 24 hours using "
        "Django's file-based cache to minimise external API calls."
    )
    add_p(doc,
        "The geocode_address() function accepts a free-form address string and an optional "
        "context dictionary containing structured components (street, city, region, country, "
        "postal_code). When context is provided, the function assembles a structured query "
        "by normalising the street format (detecting and reversing number-first patterns "
        "common in Polish addresses, e.g., converting '12 Marszałkowska' to 'Marszałkowska 12'). "
        "A cache key is generated by hashing the normalised address and context using MD5."
    )
    add_code_block(doc,
        "def geocode_address(address: str, *,\n"
        "    context: Optional[Dict[str, Any]] = None\n"
        ") -> Optional[Tuple[float, float]]:\n"
        "    cache_key = _mk_cache_key('geocode',\n"
        "        {'addr': addr, **{k: v for k, v in\n"
        "         context.items() if v}})\n"
        "    cached = _cache_get(cache_key)\n"
        "    if cached:\n"
        "        return cached\n\n"
        "    # Primary: Mapbox Geocoding API v5\n"
        "    token = getattr(settings, 'MAPBOX_TOKEN', None)\n"
        "    if token:\n"
        "        params = {\n"
        "            'access_token': token, 'limit': 1,\n"
        "            'types': 'address,poi', 'language': 'pl',\n"
        "        }\n"
        "        resp = requests.get(url, params=params, timeout=6)\n"
        "        if resp.ok:\n"
        "            feats = resp.json().get('features', [])\n"
        "            if feats and feats[0].get('relevance') >= 0.7:\n"
        "                lon, lat = feats[0]['center']\n"
        "                _cache_set(cache_key, (lon, lat))\n"
        "                return lon, lat\n\n"
        "    # Fallback: OpenStreetMap Nominatim\n"
        "    params = {'format': 'jsonv2', 'limit': 1,\n"
        "              'accept-language': 'pl'}\n"
        "    resp = requests.get(nominatim_url, params=params,\n"
        "                        timeout=8)\n"
        "    if resp.ok and resp.json():\n"
        "        lat = float(resp.json()[0]['lat'])\n"
        "        lon = float(resp.json()[0]['lon'])\n"
        "        _cache_set(cache_key, (lon, lat))\n"
        "        return lon, lat\n"
        "    return None",
        "Listing 4.7: Dual-provider geocoding with cache and fallback"
    )

    add_p(doc,
        "The Mapbox provider applies a relevance threshold of 0.7 (on a 0–1 scale) and "
        "restricts result types to 'address' and 'poi' to avoid overly broad matches. "
        "If the first attempt fails, a retry is attempted with a simplified street number "
        "(splitting compound numbers like '12/15' into separate attempts). The Nominatim "
        "fallback uses structured query parameters (street, city, postalcode, country) "
        "when context is available, falling back to a free-form 'q' parameter otherwise."
    )

    # 4.1.5 CAPTCHA authentication system
    add_heading(doc, "4.1.5. CAPTCHA authentication system", 3)
    add_p(doc,
        "The login process integrates a custom CAPTCHA verification step to prevent "
        "automated credential-stuffing attacks. The system consists of three components: "
        "image generation (using PIL), server-side validation (using Django's cache), "
        "and a custom JWT serialiser that wraps SimpleJWT's TokenObtainPairSerializer "
        "with CAPTCHA verification."
    )
    add_p(doc,
        "The CAPTCHA image generator creates an 80×30 pixel image containing 4 random "
        "alphanumeric characters, each rendered in a random colour at slightly varying "
        "positions. Random noise points and lines are overlaid to hinder OCR attacks. "
        "The generated text is stored in Django's cache with a 5-minute TTL, keyed by "
        "a UUID. The image is returned to the client as a base64-encoded PNG data URI."
    )
    add_code_block(doc,
        "class CaptchaGenericAPIView(GenericAPIView):\n"
        "    permission_classes = [AllowAny]\n"
        "    authentication_classes = []\n\n"
        "    def get(self, request, *args, **kwargs):\n"
        "        image, text = generate_catcha_image()\n"
        "        uid = uuid.uuid4().hex\n"
        "        cache.set(uid, text, 60 * 5)  # 5-minute TTL\n"
        "        buf = io.BytesIO()\n"
        "        image.save(buf, format='PNG')\n"
        "        b64 = base64.b64encode(\n"
        "            buf.getvalue()).decode('ascii')\n"
        "        return Response({\n"
        "            'uid': uid,\n"
        "            'image': f'data:image/png;base64,{b64}'\n"
        "        })",
        "Listing 4.8: CAPTCHA image generation and delivery endpoint"
    )
    add_p(doc,
        "The CaptchaSerializer validates the user-submitted code against the cached value "
        "using case-insensitive comparison. On success, the cache entry is deleted to "
        "prevent replay attacks. The LoginSerializer inherits from both CaptchaSerializer "
        "and SimpleJWT's TokenObtainPairSerializer using Python's multiple inheritance "
        "(MRO), ensuring CAPTCHA validation runs before credential verification:"
    )
    add_code_block(doc,
        "class CaptchaSerializer(serializers.Serializer):\n"
        "    captcha = serializers.CharField(\n"
        "        max_length=4, min_length=4, write_only=True)\n"
        "    uid = serializers.CharField(\n"
        "        max_length=100, min_length=10, write_only=True)\n\n"
        "    def validate(self, attrs):\n"
        "        cached_captcha = cache.get(attrs.get('uid'))\n"
        "        if not cached_captcha:\n"
        "            raise ValidationError(\n"
        "                {'captcha': ['Code expired or invalid']})\n"
        "        if cached_captcha.lower() != \\\n"
        "           attrs.get('captcha').lower():\n"
        "            raise ValidationError(\n"
        "                {'captcha': ['Code is incorrect']})\n"
        "        cache.delete(attrs.get('uid'))\n"
        "        return super().validate(attrs)\n\n"
        "class LoginSerializer(CaptchaSerializer,\n"
        "                      TokenObtainPairSerializer):\n"
        "    pass  # MRO: CAPTCHA validated first",
        "Listing 4.9: CAPTCHA validation and JWT login serialiser"
    )

    # 4.1.6 Donation approval workflow
    add_heading(doc, "4.1.6. Donation approval workflow", 3)
    add_p(doc,
        "The donation system allows authenticated users to submit stray animals for "
        "inclusion in the adoption system. Submissions enter a review queue with PENDING "
        "status. Authorised administrators can approve or reject donations via dedicated "
        "API endpoints. The approval logic is implemented in the Donation model's "
        "approve() method, wrapped in a database transaction to ensure atomicity."
    )
    add_p(doc,
        "The approve() method performs four operations within a single atomic transaction: "
        "(1) Creates a new Pet record by copying all relevant fields from the Donation "
        "(name, species, breed, sex, age, size, description, health traits, behavioural "
        "traits, contact information, address). (2) Copies all DonationPhoto records to "
        "PetPhoto records, preserving order and setting the first photo as the cover "
        "image. (3) Updates the Donation status to 'approved' and records the reviewer "
        "and note. (4) Sets the created_pet OneToOneField linking the Donation to the "
        "newly created Pet. If any step fails, the entire transaction rolls back."
    )

    # 4.1.7 View statistics with deduplication
    add_heading(doc, "4.1.7. View statistics with deduplication", 3)
    add_p(doc,
        "The ViewStatistics model uses Django's ContentType framework (GenericForeignKey) "
        "to provide reusable view counting for any model. The increase() classmethod "
        "implements per-visitor, per-day deduplication using Django's cache backend."
    )
    add_code_block(doc,
        "class ViewStatistics(models.Model):\n"
        "    object_id = models.PositiveIntegerField()\n"
        "    content_type = models.ForeignKey(\n"
        "        ContentType, on_delete=models.CASCADE)\n"
        "    content_object = GenericForeignKey(\n"
        "        'content_type', 'object_id')\n"
        "    count = models.PositiveIntegerField(default=0)\n"
        "    date = models.DateField(auto_now_add=True)\n\n"
        "    @classmethod\n"
        "    def increase(cls, request, obj):\n"
        "        uid = request.uid  # from UserUidMiddleware\n"
        "        date = timezone.now().date()\n"
        "        ct = ContentType.objects.get_for_model(\n"
        "            obj.__class__)\n"
        "        key = f'{uid}:{date}:{obj.id}'\n"
        "        if not cache.get(key):\n"
        "            cache.set(key, 1, 60 * 60 * 24)\n"
        "            cls.objects.filter(\n"
        "                content_type=ct, object_id=obj.id,\n"
        "                date=date\n"
        "            ).update(count=F('count') + 1)",
        "Listing 4.10: View statistics with cache-based deduplication"
    )
    add_p(doc,
        "The deduplication mechanism builds a composite cache key from three components: "
        "the visitor's unique identifier (request.uid, set by the UserUidMiddleware as a "
        "cookie-based UUID for anonymous visitors or the authenticated user's ID), the "
        "current date, and the target object's primary key. A cache lookup determines "
        "whether this visitor has already been counted for this object today. If not, "
        "the cache entry is created with a 24-hour TTL, and the database counter is "
        "atomically incremented using F('count') + 1 to avoid race conditions."
    )
    add_p(doc,
        "The BlogArticleViewSet's retrieve() method integrates view counting seamlessly: "
        "ViewStatistics.increase(request, obj) is called before the default retrieve "
        "response. Aggregate counts are computed at the queryset level using annotate() "
        "with a Coalesce(Sum('view_count__count'), 0) expression via the Article model's "
        "GenericRelation to ViewStatistics."
    )

    # 4.1.8 Notification system
    add_heading(doc, "4.1.8. Notification system", 3)
    add_p(doc,
        "Notifications are generated by signal handlers attached to model save events. "
        "Seven notification types are defined: friend_request, friend_accept, comment, "
        "comment_reply, adoption_status, donation_status, and system. Each notification "
        "stores optional foreign key references to the source object (comment, friendship, "
        "holiday_family_application) for navigation purposes. The frontend polls the "
        "unread notification count every 30 seconds via a lightweight GET endpoint."
    )

    # =====================================================================
    # 4.2 Frontend Implementation
    # =====================================================================
    add_heading(doc, "4.2. Frontend implementation", 2)
    add_p(doc,
        "The frontend is a single-page application built with React 19 and TypeScript, "
        "bundled by Vite 7 with the SWC compiler for fast development builds (sub-second "
        "HMR) and optimised production output. The application contains approximately "
        "30 route-level views, 15 shared components, and 8 service modules."
    )

    # 4.2.1 Project structure
    add_heading(doc, "4.2.1. Project structure", 3)
    add_code_block(doc,
        "frontend/\n"
        "├── index.html                 # SPA entry point\n"
        "├── vite.config.ts             # Vite + SWC configuration\n"
        "├── tsconfig.json              # TypeScript config (strict)\n"
        "├── package.json               # Dependencies + scripts\n"
        "├── eslint.config.js           # ESLint flat config\n"
        "├── stylelint.config.js        # CSS/SCSS linting\n"
        "├── lint-staged.config.js      # Pre-commit lint rules\n"
        "├── public/                    # Static assets\n"
        "└── src/\n"
        "    ├── main.tsx               # React root mount\n"
        "    ├── App.tsx                # Router provider\n"
        "    ├── router/\n"
        "    │   ├── index.tsx          # Route definitions\n"
        "    │   └── utils/\n"
        "    │       └── lazy-load.tsx  # Code-split helpers\n"
        "    ├── views/                 # Route-level pages\n"
        "    │   ├── home/\n"
        "    │   ├── adoption/          # Pet listing + detail\n"
        "    │   ├── lost/              # Lost pets + map\n"
        "    │   ├── donation/          # Donation submission\n"
        "    │   ├── shelters/          # Shelter directory\n"
        "    │   ├── blog/              # Articles + editor\n"
        "    │   ├── holiday-family/    # HF applications\n"
        "    │   ├── messages/          # Private messaging\n"
        "    │   ├── auth/              # Login, register\n"
        "    │   └── user/              # User profiles\n"
        "    ├── components/            # Shared components\n"
        "    ├── services/              # API service modules\n"
        "    ├── store/                 # Zustand state stores\n"
        "    ├── utils/                 # Utility functions\n"
        "    ├── styles/                # Global SCSS files\n"
        "    └── types/                 # TypeScript interfaces",
        "Listing 4.11: Frontend directory structure"
    )

    # 4.2.2 Routing and code splitting
    add_heading(doc, "4.2.2. Routing and code splitting", 3)
    add_p(doc,
        "React Router v7 manages client-side navigation with 30+ routes defined in "
        "router/index.tsx. Every route-level component is loaded lazily using a custom "
        "lazyWithFallback() wrapper that combines React.lazy() with error recovery:"
    )
    add_code_block(doc,
        "// router/utils/lazy-load.tsx\n"
        "export function lazyWithFallback(\n"
        "  importer: () => Promise<any>\n"
        "): LazyExoticComponent<any> {\n"
        "  return lazy(() =>\n"
        "    importer().catch(async (e: any) => {\n"
        "      console.error(\n"
        "        '[lazyWithFallback] failed to import', e)\n"
        "      return {\n"
        "        default: () => (\n"
        "          <div className='route-error'>\n"
        "            Failed to load page\n"
        "          </div>\n"
        "        ),\n"
        "      }\n"
        "    })\n"
        "  )\n"
        "}\n\n"
        "// Route definition pattern:\n"
        "{ path: '/adopt',\n"
        "  element: LazyLoad(\n"
        "    lazyWithFallback(\n"
        "      () => import('@/views/adoption/index'))) },\n"
        "{ path: '/adopt/:id',\n"
        "  element: LazyLoad(\n"
        "    lazyWithFallback(\n"
        "      () => import('@/views/adoption/detail'))) },",
        "Listing 4.12: Error-resilient lazy loading with fallback UI"
    )
    add_p(doc,
        "This pattern provides two benefits: (1) Only the JavaScript chunk for the "
        "currently visited route is downloaded, reducing the initial bundle size. Vite's "
        "code-splitting generates separate chunks for each lazy import. (2) If a chunk "
        "fails to load (network error, stale deployment), the user sees a 'Failed to load "
        "page' message instead of a blank white screen, allowing them to retry by "
        "navigating away and back."
    )

    # 4.2.3 HTTP client and authentication flow
    add_heading(doc, "4.2.3. HTTP client and authentication flow", 3)
    add_p(doc,
        "All API communication is handled through a centrally configured Axios instance "
        "(services/http.ts) with request and response interceptors implementing the JWT "
        "authentication flow. The request interceptor automatically attaches the access "
        "token from localStorage to every outgoing request, and removes the Content-Type "
        "header for FormData requests (allowing the browser to set the multipart boundary "
        "automatically)."
    )
    add_code_block(doc,
        "// Request interceptor: attach JWT token\n"
        "http.interceptors.request.use(\n"
        "  (config: InternalAxiosRequestConfig) => {\n"
        "    const token = getAccess();\n"
        "    if (token) {\n"
        "      config.headers.Authorization =\n"
        "        `Bearer ${token}`;\n"
        "    }\n"
        "    // FormData: let browser set boundary\n"
        "    if (config.data instanceof FormData) {\n"
        "      delete config.headers['Content-Type'];\n"
        "    }\n"
        "    return config;\n"
        "  }\n"
        ");",
        "Listing 4.13: Axios request interceptor for JWT token injection"
    )
    add_p(doc,
        "The response interceptor implements transparent token refresh. When a 401 "
        "response is received, the interceptor attempts to obtain a new access token "
        "using the stored refresh token. A singleton Promise pattern prevents concurrent "
        "refresh requests when multiple API calls fail simultaneously:"
    )
    add_code_block(doc,
        "let refreshing: Promise<string> | null = null;\n\n"
        "http.interceptors.response.use(\n"
        "  (res: AxiosResponse) => res,\n"
        "  async (error: AxiosError) => {\n"
        "    const original = error.config as\n"
        "      InternalAxiosRequestConfig & { _retried?: boolean };\n"
        "    if (status === 401 && original\n"
        "        && !original._retried) {\n"
        "      const refresh = getRefresh();\n"
        "      if (!refresh) {\n"
        "        clearTokens();\n"
        "        return Promise.reject(error);\n"
        "      }\n"
        "      original._retried = true;\n"
        "      refreshing = refreshing ||\n"
        "        http.post('/user/token/refresh/',\n"
        "                  { refresh })\n"
        "          .then(({ data }) => {\n"
        "            setAccess(data.access);\n"
        "            return data.access;\n"
        "          })\n"
        "          .finally(() => { refreshing = null });\n"
        "      const newAccess = await refreshing;\n"
        "      original.headers.Authorization =\n"
        "        `Bearer ${newAccess}`;\n"
        "      return http(original);  // retry original\n"
        "    }\n"
        "    return Promise.reject(error);\n"
        "  }\n"
        ");",
        "Listing 4.14: Response interceptor with singleton token refresh"
    )

    # 4.2.4 Map integration
    add_heading(doc, "4.2.4. Interactive map integration", 3)
    add_p(doc,
        "Three distinct map implementations serve different use cases across the "
        "application, all built on Mapbox GL JS with WebGL rendering:"
    )
    add_p(doc, "Lost Pets Map (LostPetsMap component)",
          bold=True, first_line_indent=0, space_before=8)
    add_p(doc,
        "The most complex map implementation displays all open lost-pet reports as "
        "interactive markers on a full-page map. The component initialises the map "
        "with Poland-centred defaults (centre: [19.145, 51.919], zoom: 6) and geographic "
        "bounds (longitude 14.12–24.15, latitude 49.00–54.84). Pets are grouped by "
        "coordinates: a Map<string, LostPet[]> keyed by 'lng,lat' strings clusters "
        "overlapping markers."
    )
    add_code_block(doc,
        "// Coordinate-based grouping for overlapping markers\n"
        "const petsByCoords = new Map<string, LostPet[]>()\n"
        "pets.forEach((pet: LostPet) => {\n"
        "  const lng = parseCoordinate(pet.longitude)\n"
        "  const lat = parseCoordinate(pet.latitude)\n"
        "  if (lng == null || lat == null) return\n"
        "  const coordKey = `${lng},${lat}`\n"
        "  if (!petsByCoords.has(coordKey))\n"
        "    petsByCoords.set(coordKey, [])\n"
        "  petsByCoords.get(coordKey)!.push(pet)\n"
        "})\n\n"
        "// Single pet: circular photo marker\n"
        "// Multiple pets: count badge overlay\n"
        "// Click → popup with pet details + link",
        "Listing 4.15: Lost pets map — coordinate grouping and marker rendering"
    )
    add_p(doc,
        "Single-pet markers render the pet's photo as a circular image element with CSS "
        "border-radius: 50%. Multi-pet markers display a red count badge. Each marker "
        "has an attached Mapbox Popup with pet details (name, species, photo, loss date) "
        "and a link to the detail page. After all markers are placed, the map auto-fits "
        "to include all markers using map.fitBounds() with 100px padding."
    )

    add_p(doc, "Shelter Map Preview",
          bold=True, first_line_indent=0, space_before=8)
    add_p(doc,
        "The shelter listing and detail pages embed a lighter-weight map component that "
        "shows a single marker at the shelter's coordinates. A click handler opens Google "
        "Maps in a new tab for driving directions. The component includes WebGL capability "
        "detection — if the browser lacks WebGL support, a static image from the Mapbox "
        "Static Images API is displayed instead."
    )

    add_p(doc, "Address Picker (Form Integration)",
          bold=True, first_line_indent=0, space_before=8)
    add_p(doc,
        "The AddressPicker component integrates map-based address selection into forms "
        "(add pet, report lost, shelter management). It provides cascading Country → "
        "Region → City dropdown selects that update based on parent selection, with a "
        "'create new' mode allowing users to add addresses not yet in the database. "
        "The selected address is geocoded in real-time using the backend's geocoding "
        "endpoint."
    )

    add_p(doc, "Poland Map Configuration",
          bold=True, first_line_indent=0, space_before=8)
    add_p(doc,
        "A shared configuration module (utils/polandMapConfig.ts) centralises all "
        "Poland-specific geographic constants: bounding box coordinates, 10 major city "
        "positions (Warsaw, Kraków, Gdańsk, Wrocław, Poznań, Łódź, Katowice, Szczecin, "
        "Białystok, Gdynia), and utility functions for coordinate validation "
        "(isCoordinateInPoland) and clamping (clampCoordinateToPoland)."
    )

    # 4.2.5 State management
    add_heading(doc, "4.2.5. State management", 3)
    add_p(doc,
        "Global application state is managed by Zustand 5, a lightweight state management "
        "library (1.1 kB gzip) that provides hook-based access to shared state without "
        "the boilerplate of Redux. Two stores are defined:"
    )
    add_p_multi(doc, [
        ("useUserStore: ", True),
        ("Manages authentication state (JWT token) and user information (username, avatar). "
         "Uses Zustand's Immer middleware for immutable state updates with mutable syntax. "
         "Store slices include updateToken() for login/logout and updateUserName() for "
         "profile changes.", False)
    ])
    add_p_multi(doc, [
        ("useLoadingStore: ", True),
        ("Implements a reference-counted loading overlay. showLoading() increments a counter "
         "and sets isLoading=true; hideLoading() decrements the counter and only clears "
         "isLoading when the count reaches zero. This prevents flickering when multiple "
         "concurrent API calls trigger overlapping loading states.", False)
    ])
    add_code_block(doc,
        "// Reference-counted loading store\n"
        "export const useLoadingStore = create<State & Action>(\n"
        "  (set) => ({\n"
        "    count: 0,\n"
        "    isLoading: false,\n"
        "    showLoading: () => set((state) => ({\n"
        "      count: state.count + 1,\n"
        "      isLoading: true,\n"
        "    })),\n"
        "    hideLoading: () => set((state) => ({\n"
        "      count: state.count - 1,\n"
        "      isLoading: state.count - 1 > 0,\n"
        "    })),\n"
        "  })\n"
        ");",
        "Listing 4.16: Reference-counted loading store with Zustand"
    )

    # 4.2.6 Rich text editing
    add_heading(doc, "4.2.6. Rich text editing", 3)
    add_p(doc,
        "Blog article creation uses the @opentiny/fluent-editor library (version 3.25), "
        "a WYSIWYG editor based on Quill with extended capabilities including table "
        "insertion, image upload, code blocks, and Markdown shortcuts. The editor output "
        "is HTML, which is stored in the Article model's content field and sanitised "
        "through DOMPurify before display on the frontend."
    )

    # 4.2.7 Responsive design
    add_heading(doc, "4.2.7. Responsive design", 3)
    add_p(doc,
        "The application uses React Bootstrap 2.10's responsive grid system throughout. "
        "Pet listing cards use a responsive Column configuration of xs=12 sm=6 md=4 "
        "lg=3, displaying 1 card per row on mobile, 2 on small tablets, 3 on medium "
        "screens, and 4 on large desktops. Form layouts switch from horizontal to "
        "stacked at the 'sm' breakpoint. Navigation collapses into a hamburger menu "
        "at the 'lg' breakpoint. All images use responsive sizing with max-width: 100% "
        "to prevent horizontal overflow on narrow screens."
    )

    # 4.2.8 Social features
    add_heading(doc, "4.2.8. Social features", 3)
    add_p(doc,
        "The platform includes a complete social interaction layer implemented across "
        "multiple modules:"
    )
    add_bullet(doc,
        "Friendship system: Users can send friend requests, which create Pending status "
        "Friendship records. The recipient receives a NotificationBell alert with inline "
        "accept/reject buttons. Accepted friendships enable private messaging.")
    add_bullet(doc,
        "Private messaging: A two-pane interface (contact list + message thread) with "
        "real-time read tracking (is_read, read_at timestamps). System messages "
        "(is_system=True) are rendered with distinct styling.")
    add_bullet(doc,
        "Comment system: Threaded comments with arbitrary nesting depth via self-referencing "
        "parent FK. The EmojiPicker component (7-category grid in a Bootstrap Popover) "
        "integrates into the comment editor. Reply notifications link back to the parent "
        "comment's context.")
    add_bullet(doc,
        "Favourites: Per-user pet bookmarking (PetFavorite) and article bookmarking "
        "(FavoriteArticle) with toggle endpoints and presence indicators (is_favorited "
        "computed field in list serialisers).")

    # =====================================================================
    # 4.3 Containerised Deployment
    # =====================================================================
    add_heading(doc, "4.3. Containerised deployment", 2)
    add_p(doc,
        "The backend is packaged as a Docker composition with three services defined "
        "in docker-compose.yml:"
    )

    add_table(doc, "4.1", "Docker service configuration",
        ["Service", "Image / Build", "Ports", "Configuration"],
        [
            ["db", "postgis/postgis:16-3.4", "5432:5432",
             "Volume mount for pgdata persistence; POSTGRES_DB, "
             "POSTGRES_USER, POSTGRES_PASSWORD via environment"],
            ["web", "Custom (Dockerfile)", "8000:8000",
             "Python 3.12-slim base; system deps: GDAL, GEOS, PROJ, "
             "PostgreSQL client; Gunicorn with 3 workers, 120s timeout; "
             "depends_on: db; volume: media files"],
            ["adminer", "adminer:latest", "8080:8080",
             "Database management UI for development"],
        ]
    )

    add_p(doc,
        "The Dockerfile uses a single-stage build based on python:3.12-slim. System "
        "dependencies for PostGIS support (libgdal-dev, libgeos-dev, libproj-dev, "
        "gdal-bin) are installed via apt-get. Python dependencies are pinned in "
        "requirements.txt (34 packages) and installed via pip. The container's CMD "
        "runs Django migrations, collectstatic, and then starts Gunicorn serving the "
        "WSGI application with 3 worker processes and a 120-second timeout."
    )

    add_heading(doc, "4.3.1. Performance optimisations", 3)
    add_p(doc,
        "Several performance optimisations are applied in the Django settings:"
    )
    add_bullet(doc,
        "Database query optimisation: select_related() and prefetch_related() are used "
        "in all ViewSet querysets to eliminate N+1 query patterns. The PetViewSet's "
        "queryset pre-fetches 8 related tables in a single JOIN.")
    add_bullet(doc,
        "File-based caching: Django's FileBasedCache backend stores CAPTCHA codes (5-min "
        "TTL), geocoding results (24-hour TTL), and view deduplication flags (24-hour TTL). "
        "The cache directory is configured at CACHES['default']['LOCATION'] = 'django_cache'.")
    add_bullet(doc,
        "Static file serving: WhiteNoise middleware serves static files directly from "
        "the WSGI process, eliminating the need for a separate Nginx container in "
        "simple deployments.")
    add_bullet(doc,
        "JWT token configuration: Access tokens expire after 120 minutes, refresh tokens "
        "after 7 days, with token rotation enabled (ROTATE_REFRESH_TOKENS=True) and "
        "blacklisting disabled for simplicity.")
    add_bullet(doc,
        "Pagination: Custom StandardResultsSetPagination limits page size to 50 results "
        "maximum (default 10), reducing payload size for large collections.")

    page_break(doc)
    print("  ✓ Phase 4 complete: Chapter 4")
