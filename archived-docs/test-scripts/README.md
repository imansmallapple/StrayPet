# Test Scripts

All API and functional test scripts organized by feature category.

## Test Categories

### Authentication & Users
- `get_token.py` - Token generation utility
- `generate_fresh_tokens.py` - Generate test tokens
- `test_fresh_token_immediately.py` - Test fresh token generation
- `test_new_token.py` - Test new token creation
- `test_token_user_lookup.py` - Test user lookup via token
- `debug_token.py` - Token debugging
- `debug_jwt_auth.py` - JWT authentication debugging
- `test_registration.py` - User registration test

### Avatar Management
- `test_avatar_api.py` - Avatar API endpoint testing
- `test_avatar_debug.py` - Avatar debugging utilities
- `test_avatar_upload.py` - Avatar upload functionality test
- `generate_missing_avatars.py` - Generate missing user avatars

### Content Management
- `test_article.py` - Blog article tests
- `test_article_author.py` - Article author tests
- `test_blog_author.py` - Blog author profile tests
- `test_blog_comments.py` - Blog comment tests
- `test_comments.py` - Comment functionality tests
- `test_my_comments.py` - User's own comments tests
- `test_hashtag.py` - Hashtag functionality tests

### Social Features
- `test_friend_request.py` - Friend request tests
- `test_replies_api.py` - Comment reply API tests
- `test_replies_avatars.py` - Reply author avatars tests

### Messaging & Notifications
- `test_notifications.py` - Notification system tests
- `test_mark_messages_as_read.py` - Message read status tests

### General API
- `test_api_endpoint.py` - General API endpoint testing
- `test_api_response.py` - API response validation
- `test_api_with_server.py` - API testing with running server
- `test_with_django_client.py` - Django test client utilities
- `test_media.py` - Media file handling tests

## Running Tests

### Run all tests
```bash
python -m pytest *.py
```

### Run specific category
```bash
python -m pytest test_avatar_*.py
python -m pytest test_article*.py
python -m pytest test_blog_*.py
```

### Run single test
```bash
python test_avatar_api.py
python -m pytest test_notifications.py -v
```

## Test Dependencies

All test scripts require:
- Django (configured in DJANGO_SETTINGS_MODULE)
- Django REST Framework
- Django Test Client or Requests library

Ensure these are installed:
```bash
pip install django djangorestframework
```

## Notes

- Tests may require a running Django development server
- Some tests may need database setup or migrations
- Review individual test files for specific requirements and setup instructions
