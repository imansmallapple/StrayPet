# 🐾 StrayPet - Pet Adoption Platform

A comprehensive platform for stray pet adoption, helping homeless animals find loving homes. Features include pet listings, adoption applications, lost pet tracking, and user preference matching.

## ✨ Features

### 🏠 Core Functionality

- **Pet Adoption**: Browse adoptable pets, view detailed information, submit adoption applications
- **Pet Donation**: Users can list pets for adoption, subject to review before publishing
- **Lost Pet Tracking**: Post and view lost pet information with map-based location display
- **Smart Matching**: Recommend suitable pets based on user preferences

### 👤 User System

- **Account Management**: Registration, login, password reset
- **User Profile**: Personal information, favorite pets, my pets, preferences
- **Favorites**: Save pets of interest for easy access later
- **Adoption Preferences**: Set ideal pet characteristics (species, size, age, etc.)

### 🔍 Search & Filtering

- **Multi-criteria Filtering**: Filter by species, age, gender, location, etc.
- **Map Search**: Find nearby pets based on geographic location
- **Keyword Search**: Quickly search for specific pets

### 📝 Pet Management

- **Detailed Information**: Name, breed, age, gender, health status
- **Trait Tags**: Markers for spayed/neutered, vaccinated, friendly, etc.
- **Multi-photo Display**: Support for multiple photo uploads with carousel display
- **Location Information**: Precise address and map positioning

## 🛠️ Tech Stack

### Backend

- **Framework**: Django 5.1 + Django REST Framework 3.15
- **Database**: PostgreSQL + PostGIS (Geographic Information Extension)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Image Processing**: Pillow
- **Deployment**: Docker + Gunicorn + Nginx

### Frontend

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **UI Components**: React Bootstrap
- **Routing**: React Router v6
- **State Management**: ahooks (useRequest)
- **Maps**: Mapbox GL + Leaflet (fallback)
- **Rich Text**: FluentEditor

## 📦 Project Structure

```
strayPet/
├── backend/                 # Django backend
│   ├── apps/
│   │   ├── pet/            # Pet-related modules
│   │   ├── user/           # User module
│   │   ├── blog/           # Blog module
│   │   └── comment/        # Comment module
│   ├── server/             # Project configuration
│   ├── manage.py
│   ├── requirements.txt
│   └── docker-compose.yml
│
└── frontend/               # React frontend
    ├── src/
    │   ├── views/          # Page components
    │   ├── components/     # Shared components
    │   ├── services/       # API services
    │   ├── router/         # Route configuration
    │   └── utils/          # Utility functions
    ├── package.json
    └── vite.config.ts
```

## 🚀 Quick Start

### Requirements

- **Backend**: Python 3.10+, PostgreSQL 14+, Docker (optional)
- **Frontend**: Node.js 18+, pnpm 9+
- **Map Service**: Mapbox Token (optional)

### Backend Installation & Running

#### Using Docker (Recommended)

```bash
cd backend
docker-compose up -d
```

#### Manual Installation

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure database (in server/settings.py for PostgreSQL)

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Installation & Running

```bash
cd frontend

# Install dependencies
pnpm install

# Configure environment variables (copy .env.example to .env.local)
# Set VITE_MAPBOX_TOKEN (optional)

# Start development server
pnpm dev
```

Access:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

## 📖 API Documentation

### Main Endpoints

#### Pet Related

- `GET /pet/` - Get pet list
- `GET /pet/{id}/` - Get pet details
- `POST /pet/{id}/apply/` - Submit adoption application
- `POST /pet/{id}/favorite/` - Favorite a pet
- `DELETE /pet/{id}/unfavorite/` - Unfavorite a pet
- `GET /pet/favorites/` - Get favorites list
- `GET /pet/my_pets/` - Get my pets

#### User Related

- `POST /user/token/` - Login to get token
- `POST /user/token/refresh/` - Refresh token
- `POST /user/register/` - User registration
- `GET /user/me/` - Get current user info
- `PATCH /user/me/` - Update user info and preferences

#### Donation Related

- `POST /pet/donation/` - Submit pet donation
- `GET /pet/donation/` - Get donation list
- `GET /pet/donation/{id}/` - Get donation details

#### Lost Pet Related

- `POST /pet/lost/` - Post lost pet
- `GET /pet/lost/` - Get lost pets list

## 🗄️ Data Models

### Pet

- Basic Info: Name, species, breed, gender, age
- Health Traits: Spayed/neutered, vaccinated, dewormed, microchipped
- Behavioral Traits: Affectionate, loves to play, good with other pets, etc.
- Status: Available, pending review, adopted, etc.

### User

- Account Info: Username, email, password
- Profile: Phone number
- Adoption Preferences: Preferred species, size, age, experience, etc.

### Adoption

- Application details: Applicant, pet, message
- Status: Submitted, processing, approved, rejected

### Donation

- Donation details: Donor, pet information, photos
- Review Status: Pending, reviewing, approved, rejected

## 🔧 Configuration

### Environment Variables

#### Backend (backend/.env)

```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/strayPet
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (frontend/.env.local)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your-mapbox-token
```

## 📝 Development Guidelines

### Code Style

- **Backend**: Follow PEP 8 conventions
- **Frontend**: Use ESLint + Prettier

### Git Commit Conventions

```
feat: New feature
fix: Bug fix
docs: Documentation update
style: Code formatting
refactor: Code refactoring
test: Testing related
chore: Build/toolchain related
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 👥 Authors

- **imansmallapple** - Initial work - [GitHub](https://github.com/imansmallapple)

## 🙏 Acknowledgments

- Django REST Framework team
- React and Vite community
- Mapbox mapping service
- All contributors to the open source community

## 📮 Contact

- Repository: [https://github.com/imansmallapple/strayPet_server](https://github.com/imansmallapple/strayPet_server)
- Issue Tracker: [GitHub Issues](https://github.com/imansmallapple/strayPet_server/issues)

---

**Helping every stray animal find a warm home 🏡💕**
