# Frontend Integration Notes

## Real API Integrations

### Authentication
| Endpoint | Method | Usage |
|----------|--------|-------|
| `POST /auth/token` | Login with email/password | Login form |
| `POST /auth/logout` | Invalidate token | Logout action |
| `POST /auth/outbound/authentication?code=` | Google OAuth callback | OAuth callback page |
| `GET /users/me` | Fetch user profile | Auth store on login |
| `PUT /users/me` | Update profile | Edit profile form |
| `PUT /credentials/change-password` | Change password | Change password form |

### Tests (Practice)
| Endpoint | Method | Usage |
|----------|--------|-------|
| `GET /api/v1/admin/tests?page=&size=&skill=` | Paginated test list | Practice page, Admin tests |
| `GET /api/v1/admin/tests/{id}` | Test detail with stimuli/questions | Reading/Writing/Listening/Speaking pages |
| `POST /api/v1/admin/tests` | Import new test | Admin test import wizard |
| `PUT /api/v1/admin/tests/{id}` | Update test | Admin test edit |
| `DELETE /api/v1/admin/tests/{id}` | Delete test | Admin test delete |

### Tags
| Endpoint | Method | Usage |
|----------|--------|-------|
| `GET /api/v1/tags` | List all tags | Admin tags page |
| `POST /api/v1/tags` | Create tag | Admin tag dialog |
| `PUT /api/v1/tags/{id}` | Update tag | Admin tag dialog |
| `DELETE /api/v1/tags/{id}` | Delete tag | Admin tags page |

### Users (Admin)
| Endpoint | Method | Usage |
|----------|--------|-------|
| `GET /api/v1/admin/users?page=&size=` | Paginated user list | Admin users page |
| `PUT /api/v1/admin/users/{id}/ban` | Ban user | Admin users page |

### Media
| Endpoint | Method | Usage |
|----------|--------|-------|
| `POST /api/v1/media/upload` | Upload file (multipart) | Admin media page |
| `GET /api/v1/media` | List media files | Admin media page |
| `DELETE /api/v1/media/{id}` | Delete media | Admin media page |

### Payment & Credits
| Endpoint | Method | Usage |
|----------|--------|-------|
| `GET /api/v1/packages` | List pricing packages (bare array) | Payment page |
| `POST /api/v1/payments/init` | Init payment, get QR code | Checkout page |
| `GET /api/v1/payments/{id}` | Check payment status | Checkout polling |
| `GET /api/v1/payments` | Payment history (bare array) | Payment history page |
| `GET /api/v1/credit-transactions` | Credit transactions (bare array) | Transactions page |
| `GET /api/v1/services` | Service pricing (bare array) | Payment page |

---

## Mock Data Areas (No Backend API)

### Vocabulary Module
- **All vocabulary data is mock** in `src/data/vocab-mock.ts`
- Backend has `VocabularyWord` and `VocabularyCollection` entities but **no REST endpoints**
- 4 collections, 22 words for demo purposes
- Pages: `/vocabulary`, `/vocabulary/[collectionId]`, `/vocabulary/flashcard`

### Practice Detail Content
- **Reading passages**: Mock text in `MOCK_PASSAGES` if API returns empty content
- **Writing prompts**: Mock prompts in `MOCK_PROMPTS` as fallback
- **Listening transcripts**: Fully mock in `MOCK_TRANSCRIPTS` - no transcript API exists
- **Listening audio**: Uses `stimuli[0].mediaUrl` from API but falls back to `/audio/sample.mp3`
- **Speaking timings**: prep/speak time hardcoded (60s/120s), no API for this
- **Speaking feedback**: Mock feedback scores - no AI feedback API

### Other Mock Data
- Exercise view counts on practice page cards (random numbers)
- Writing grading results (mock AI scoring)

---

## Known Issues

### Security
- **Admin test endpoint exposes answers**: `GET /api/v1/admin/tests/{id}` returns `options[].isCorrect` to ALL authenticated users, not just admins. Students can see correct answers. Backend needs role-based response filtering.

### Missing Backend Features
- **No unban API**: Can ban users via `PUT /admin/users/{id}/ban` but no endpoint to unban
- **No credit balance on user entity**: `GET /users/me` doesn't return credit balance. Frontend can't show balance in navbar
- **No vocabulary API endpoints**: Backend entities exist but no REST controllers
- **No transcript API**: Listening transcripts are fully mocked
- **No speaking feedback API**: No AI-powered speaking evaluation
- **No writing grading API**: Writing grading/scoring is mocked

### API Design Notes
- **Bare array responses**: `/packages`, `/payments`, `/credit-transactions`, `/services` return `T[]` directly, NOT wrapped in `ApiResponse<T>`. Frontend handles both patterns.
- **Inconsistent field naming**: `UserProfileResponse` uses snake_case (`full_name`, `avatar_url`) while other responses use camelCase
- **Test list uses admin endpoint**: `GET /api/v1/admin/tests` is used for both student practice page AND admin panel - no separate student-facing endpoint

### Frontend Limitations
- **Role detection from JWT only**: User role decoded from JWT `scope` claim. No backend endpoint to get role directly.
- **No real-time payment webhook**: Payment status checked via 5-second polling interval, not WebSocket/SSE
- **Google OAuth client_id hardcoded**: Should move to environment variable for production

---

## Required Backend Changes for Production

1. **Create student-facing test list API** - separate from admin endpoint, hide answers
2. **Add unban user endpoint** - `PUT /admin/users/{id}/unban`
3. **Add credit balance to user profile** - include in `GET /users/me` response
4. **Create vocabulary REST API** - CRUD for collections and words
5. **Create transcript API** - for listening exercises
6. **Add AI grading endpoints** - writing evaluation, speaking feedback
7. **Fix response consistency** - standardize snake_case vs camelCase
8. **Add role endpoint** - `GET /users/me/role` or include role in profile response
9. **Implement payment webhooks** - replace polling with real-time notification
10. **Move OAuth config to backend** - return Google OAuth URL from API instead of hardcoding

---

## File Summary

### New Files Created (~43)
- `src/types/test.types.ts`, `payment.types.ts`, `admin.types.ts`, `vocab.types.ts`
- `src/lib/tests-api.ts`, `payment-api.ts`, `admin-api.ts`, `jwt-utils.ts`, `skill-utils.ts`
- `src/hooks/use-practice-exercises.ts`, `use-test-detail.ts`
- `src/store/payment-store.ts`
- `src/data/vocab-mock.ts`
- `src/app/(auth)/oauth/callback/page.tsx`
- `src/app/(admin)/layout.tsx` + all admin pages (dashboard, tests, tags, users, media)
- `src/components/admin/*` (sidebar, header, tag dialog, test import steps, media components)
- `src/components/profile/*` (edit form, change password form)
- `src/components/vocabulary/*` (vocab card, flashcard viewer, word detail dialog)
- `src/app/(protected)/payment/*`, `transactions/*`, `vocabulary/*`

### Modified Files (~13)
- `src/lib/api-client.ts` - added `upload()` method
- `src/types/auth.types.ts` - added role, UpdateProfileRequest, ChangePasswordRequest
- `src/store/auth-store.ts` - added role detection, updateUser(), refreshProfile()
- `src/app/(auth)/login/page.tsx` - split-scroll redesign with test accounts
- `src/components/auth/login-form.tsx` - added Google OAuth button
- `src/components/layout/inner-navbar.tsx` - added vocab + payment nav links
- `src/components/layout/user-avatar-dropdown.tsx` - added admin panel + credits links
- `src/app/(protected)/practice/page.tsx` - API integration
- `src/app/(protected)/practice/reading/[id]/page.tsx` - API integration
- `src/app/(protected)/practice/writing/[id]/page.tsx` - API integration
- `src/app/(protected)/practice/listening/[id]/page.tsx` - API integration
- `src/app/(protected)/practice/speaking/[id]/page.tsx` - API integration
- `src/app/(protected)/profile/page.tsx` - tab layout with forms
