# Fitness Tracker App — Build Specification

**Date:** November 1, 2026  
**Target Platform:** Android (single-device sideload)  
**Tech Stack:** Kotlin + Jetpack Compose  
**Reference Repos:** SparkyFitness, GymMane, openGym, wger, free-exercise-db  

---

## Executive Summary

Build a local-first Android app that combines macro tracking with workout planning. Core functionality works offline; network used for barcode lookups, remote food search, and optional AI features. Generic AI interface accepts any OpenAI-compatible endpoint (user configures URL + key). Health Connect integration exports workout sessions and imports bodyweight/heart rate. All exercise and equipment media bundled in APK (~60-100MB).

---

## Core Features

### Module 1: Macro Tracker

**UX Philosophy: Scan-first.** Barcode scanning is the primary entry path. Manual entry, search, and photo AI are secondary options.

| Feature | Implementation Notes |
|---|---|
| **Barcode Scanner (Priority)** | Camera opens by default on food logging screen. Scans barcode → queries OpenFoodFacts → pre-fills macro entry. Manual entry only when scan fails. |
| **Merged Food Search** | Local FTS5 index + remote federated search. Results combine: custom foods, cached scanned foods, recipes, USDA ingredients, and OpenFoodFacts remote results in one ranked list. If local search yields no/few results, automatically query remote APIs and merge. |
| **Barcode + Scan History** | Scanned foods cached locally. Recent/frequent scans appear at top of search — rescan unnecessary for known items. |
| **Recipe Builder** | Add all ingredients into a recipe ("the pot"), specify number of meal-prep containers, app divides total macros by container count. Logging = "add Chicken Meal 1" with per-container macros auto-applied. Portion scaling supported (log 1.5 containers → 1.5x macros). |
| **Meal Planning + Logging** | Both: plan meals ahead (assign recipes/foods to days), log actual consumption. Planned vs. actual comparison mirrors workout schedule design. |
| **Macro Goal Setting (4 Methods)** | (1) Manual entry of exact targets, (2) TDEE calculator (height/weight/age/activity → maintenance calories), (3) Goal-based (lose fat / maintain / gain muscle → derived deficit/surplus of 0.5-1% bodyweight/week), (4) AI suggestion based on goals, activity, and historical data. |
| **Diet Presets** | Keto, Paleo, Standard, Vegan macro templates — selectable starting points, fully editable. |
| **Net Calorie Display** | Food intake subtracted from calorie GOAL for "net remaining." Workout burn displayed SEPARATELY BELOW as informational burn line — does NOT count toward net remaining. |
| **Food Photo AI (Optional)** | Camera icon next to barcode scan button. Snap plate photo → vision LLM estimates ingredients/portions/macros → user reviews and confirms before logging. Disabled gracefully if no AI key configured. |
| **Charts & Trends** | Daily progress, rolling 7-day averages, month-over-month trends, correlation views (macros vs. weight change vs. workout volume). |
| **Coaching Suggestions** | When weight trend diverges from goal trajectory (e.g., losing slower than target), suggest calorie adjustment ("reduce by 200 kcal/day"). Rule-based core, AI-enriched when configured. |
| **Data Export** | CSV export for all food logs, recipes, and goals. |

**Excluded (deliberately):** Water tracking, supplements, fasting timer. User handles these elsewhere.

**Food Database Sources (Merged Pool):**
- **Custom foods:** User-entered, stored locally
- **Cached scans:** OpenFoodFacts results stored locally after first lookup
- **Recipes:** Built from ingredients (above), macros rolled up automatically
- **USDA:** Raw ingredients/produce — bundled CSV or API for offline-capable ingredient lookups
- **OpenFoodFacts:** Remote federated search for packaged goods, no auth required

### Module 2: Workout Planner

| Feature | Implementation Notes |
|---|---|
| **Exercise Library** | 800+ exercises bundled with animated WebP media. Metadata from wger, media from free-exercise-db + GymMane. |
| **Global Search** | Search bar across exercises, equipment, routines. Local FTS5 index with fuzzy matching. Instant offline. |
| **Equipment-Based Filtering** | Full catalog mapped to equipment. USER_EQUIPMENT table filters visibility. Wishlist tracks desired purchases with "unlocks N exercises" display. |
| **Equipment Catalog Photos** | Every EQUIPMENT table entry has associated photo (`media_path` column). Bundled images (~100). Visual confirmation when selecting gear, AI reference for detection. |
| **AI Equipment Detection** | Two paths: (1) photo of new gear → vision LLM identifies → matches catalog → adds to USER_EQUIPMENT; (2) shopping link pasted → AI extracts product info → adds to wishlist/owned. AI prompts support photo attachments. |
| **Routine Builder** | Create custom routines with sets, reps, weight, rest timers. Supersets, drop sets, pyramid sets. |
| **Workout Logger** | Quick-log mode: "Next Set" button advances with automatic rest countdown, "Done" completes session. Editable weight/reps before confirming each set. |
| **Progress Tracking** | 1RM estimates, strength-to-bodyweight ratios, volume metrics, PR alerts. |
| **Activity Heatmap** | Training frequency and muscle coverage visualization. |

### Module 3: Schedule & Programs

| Feature | Implementation Notes |
|---|---|
| **Pre-built Programs** | Curated templates (BEGINNER-assumes-no-experience) based on user's owned equipment. Templates adoptable — copied to user library for editing. |
| **User-Scheduled Plan** | Fully user-controlled. Assign routines to days/time slots. Per-day exceptions (e.g., Sunday morning movement cancelled). |
| **Morning Movement Slot** | Quick-morning session type (1 set per muscle group). Defaults daily, individually cancellable. |
| **Planned vs. Actual** | SCHEDULE = intent. SESSIONS = reality. Adherence = gap between them. |
| **Multiple Sessions Per Day** | Unlimited, timestamped chronologically (7 AM morning movement, 7 PM main workout). |

### Module 4: AI Integration (Generic, Optional)

| Feature | Implementation Notes |
|---|---|
| **Generic LLM Interface** | Abstract interface accepting ANY OpenAI-compatible API. User configures endpoint URL + API key + model name in settings. Stored in EncryptedSharedPreferences. |
| **Provider Examples** | Pollinations.ai (no key), Groq (free tier), Claude (paid key), or any compatible endpoint. No code changes to swap providers. |
| **Photo Attachments** | AI prompts support image attachments (base64) for equipment detection and food photo analysis. Vision-capable endpoint required for these features; text-only endpoints work for workout generation. |
| **Workout Generation** | Natural language input ("chest day with dumbbells, 45 min") → JSON routine respecting owned equipment. Preview before saving. |
| **Food Photo Analysis** | Plate photo → estimated ingredients/portions/macros in JSON → user confirms → logged. |
| **Equipment Identification** | Gear photo → catalog match. Shopping link → product extraction. |
| **Coaching Insights** | Enriches rule-based recommendations when configured. |
| **Manual Clipboard Bridge** | If no key configured or API fails, copy prompt to clipboard, user pastes into Lumo/Claude app, pastes JSON response back. Always available. |

**Workout Generation Prompt Template:**
```
You are a fitness expert. Generate a workout routine based on these constraints:

Available Equipment: {{equipment_list}}
Fitness Level: {{beginner|intermediate|advanced}}
Duration Minutes: {{duration}}
Focus Muscles: {{muscle_groups}}
User Goal: {{goal}}

Return ONLY valid JSON in this exact format:
{
  "routine_name": "string",
  "exercises": [
    {
      "name": "string",
      "sets": number,
      "reps": "string (e.g., '8-12' or 'AMRAP')",
      "rest_seconds": number,
      "notes": "string or null"
    }
  ],
  "estimated_duration_minutes": number
}

Do not include any text outside the JSON object.
```

**Food Photo Prompt Template:**
```
Analyze this food photo. Estimate portions and ingredients. Return ONLY valid JSON:
{
  "foods": [
    { "name": "string", "grams": number, "confidence": number }
  ],
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number
}
```

**Equipment Photo Prompt Template:**
```
Identify all fitness equipment visible in this photo. Match against this catalog:
{{equipment_catalog_names}}
Return ONLY valid JSON: { "matches": ["equipment_name", ...] }
```

### Module 5: Data Persistence & Health Connect

| Feature | Implementation Notes |
|---|---|
| **Local-First** | Room database (SQLite). All core data offline. |
| **Backup/Restore** | Export complete database to encrypted ZIP. Import from JSON/CSV. |
| **Health Connect Write** | Activity sessions (start/end, type, duration, estimated calories). Deduplication check before writing — if another app logged a session in the same window, prompt user: skip or overwrite. |
| **Health Connect Read** | body_weight (smart scale via Samsung Health), heart_rate (Galaxy Watch via Samsung Health). |
| **HR-Enhanced Calories** | With heart rate data: ACSM/HR-based formula. Without: MET-based (kcal = MET × bodyweight kg × hours). Apply 10% conservative reduction. Label "Estimated (±10%)." |
| **Galaxy Watch** | No watch-side app. All data flows through Health Connect. |

### Module 6: Equipment System

**Catalog:** Full equipment list imported with photos, category tags, and exercise mappings.

**USER_EQUIPMENT table:** owned flag, wishlist flag, timestamps. Adding equipment instantly surfaces new exercises. Removing greys out (history intact).

**Wishlist:** Shows "buying this unlocks N exercises and M programs." Wishlist items can link to shopping URLs for reference.

**Pre-seeded User Equipment Profile:**

| Equipment | Status |
|---|---|
| Adjustable bench (flat/incline/decline) | Owned |
| Smith machine (with lat pull-down + low row attachments) | Owned |
| Pull-up bar | Owned |
| Adjustable dumbbells (PowerBlock) | Owned |
| Spin-lock dumbbells (generic) | Owned |
| Weight plates (1-inch standard) | Owned |
| Curl bar | Owned |
| Ab machine (knee slider, incline) | Owned |
| Punching bag | Owned (may be removed) |
| Hack squat / leg press combo | Wishlist |

First launch detects empty USER_EQUIPMENT → auto-populates this profile with confirmation dialog.

---

## Database Schema

### EQUIPMENT

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `name` | TEXT NOT NULL | "Barbell", "Smith Machine", etc. |
| `category` | TEXT | Free weights, Machines, Cardio, Accessories |
| `media_path` | TEXT | Bundled photo path |

### USER_EQUIPMENT

| Column | Type | Description |
|---|---|---|
| `equipment_id` | INTEGER FK | References EQUIPMENT |
| `owned` | BOOLEAN | User owns it |
| `on_wishlist` | BOOLEAN | User wants it |
| `added_at` | TIMESTAMP | When added |

### EXERCISE

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `name` | TEXT NOT NULL | Exercise name |
| `description` | TEXT | Beginner-friendly instructions + common mistakes |
| `muscle_group` | TEXT | Chest, Back, Legs, Shoulders, Arms, Core |
| `secondary_muscles` | TEXT[] | Assisted muscles |
| `difficulty` | INTEGER | 1-5 scale |
| `media_path` | TEXT | Bundled animation path |
| `source` | TEXT | wger, GymMane, free-exercise-db |
| `is_custom` | BOOLEAN | User-created |

### EXERCISE_EQUIPMENT (many-to-many)

| Column | Type |
|---|---|
| `exercise_id` | INTEGER FK |
| `equipment_id` | INTEGER FK |

### ROUTINES

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `name` | TEXT NOT NULL | Routine name |
| `is_template` | BOOLEAN | Pre-built template flag |
| `created_at` | TIMESTAMP | Creation date |

### ROUTINE_ENTRIES

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `routine_id` | INTEGER FK | References ROUTINES |
| `exercise_id` | INTEGER FK | References EXERCISE |
| `order_index` | INTEGER | Position in routine |
| `target_sets` | INTEGER | Planned sets |
| `target_reps` | TEXT | Rep range ("8-12") |
| `superset_group` | INTEGER | Null if not superset |

### SCHEDULE (Plan = Intent)

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `day_of_week` | INTEGER | 0=Sunday to 6=Saturday |
| `time_slot` | TEXT | "Morning", "Evening", or custom |
| `routine_id` | INTEGER FK | References ROUTINES |
| `slot_type` | TEXT | "Morning Movement" or "Main Workout" |
| `enabled` | BOOLEAN | Cancellable per-day |

### SESSIONS (Actual Logs)

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `scheduled_id` | INTEGER FK | Nullable SCHEDULE reference |
| `date` | DATE | When workout occurred |
| `start_time` | TIMESTAMP | Session start |
| `end_time` | TIMESTAMP | Session end |
| `duration_minutes` | INTEGER | Calculated |
| `calories_estimated` | REAL | HR or MET-based, -10% conservative |
| `avg_heart_rate` | INTEGER | From Health Connect |
| `adherence_notes` | TEXT | User/AI observations |

### SETS

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `session_id` | INTEGER FK | References SESSIONS |
| `exercise_id` | INTEGER FK | References EXERCISE |
| `set_number` | INTEGER | 1, 2, 3, etc. |
| `reps` | INTEGER | Repetitions completed |
| `weight_lb` | REAL | Weight used |
| `rest_seconds_planned` | INTEGER | Target rest |
| `completed` | BOOLEAN | Completion flag |
| `rpe` | INTEGER | Optional 1-10 |
| `logged_at` | TIMESTAMP | When recorded |

### FOODS

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `name` | TEXT NOT NULL | Food item name |
| `brand` | TEXT | Manufacturer (nullable) |
| `barcode` | TEXT UNIQUE | GTIN/EAN if scanned |
| `serving_size` | REAL | Numeric amount |
| `serving_unit` | TEXT | oz, cup, slice, etc. |
| `calories` | REAL | Per serving |
| `protein_g` | REAL | Per serving |
| `carbs_g` | REAL | Per serving |
| `fat_g` | REAL | Per serving |
| `fiber_g` | REAL | Optional |
| `source` | TEXT | Manual, OpenFoodFacts, USDA |
| `created_at` | TIMESTAMP | Creation date |

### RECIPES

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `name` | TEXT NOT NULL | "Chicken Meal 1" |
| `container_count` | INTEGER | Meal-prep containers made |
| `instructions` | TEXT | Optional cooking notes |
| `created_at` | TIMESTAMP | Creation date |

### RECIPE_INGREDIENTS

| Column | Type | Description |
|---|---|---|
| `recipe_id` | INTEGER FK | References RECIPES |
| `food_id` | INTEGER FK | References FOODS |
| `quantity` | REAL | Amount of ingredient |

**Recipe macros:** Total = sum(ingredient macros × quantity). Per container = total ÷ container_count.

### MEAL_PLANS (Planned = Intent)

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `date` | DATE | Planned date |
| `meal_type` | TEXT | Breakfast/Lunch/Dinner/Snack |
| `food_id` | INTEGER FK | Nullable FOODS reference |
| `recipe_id` | INTEGER FK | Nullable RECIPES reference |
| `quantity` | REAL | Planned servings/containers |

### FOOD_LOGS (Actual Logs)

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `food_id` | INTEGER FK | Nullable FOODS reference |
| `recipe_id` | INTEGER FK | Nullable RECIPES reference |
| `meal_type` | TEXT | Breakfast/Lunch/Dinner/Snack |
| `quantity` | REAL | Servings/containers consumed |
| `logged_date` | DATE | When consumed |
| `timestamp` | TIMESTAMP | Exact log time |
| `photo_path` | TEXT | Optional source photo (AI-analyzed meals) |

### MACRO_GOALS

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `effective_date` | DATE | When this goal took effect |
| `calories` | INTEGER | Daily calorie target |
| `protein_g` | INTEGER | Daily protein target |
| `carbs_g` | INTEGER | Daily carb target |
| `fat_g` | INTEGER | Daily fat target |
| `method` | TEXT | manual, tdee, goal_based, ai_suggested |
| `preset_name` | TEXT | Keto, Paleo, etc. (nullable) |

### BODY_WEIGHT

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `weight_lb` | REAL | Weight in pounds |
| `measured_at` | TIMESTAMP | When measured |
| `source` | TEXT | Manual, Health Connect, Smart Scale |

**Data Retention:** NO auto-deletes. User-triggered deletion only, per-record or bulk.

---

## Search Implementation

**Local:** SQLite FTS5 full-text index across EXERCISE, EQUIPMENT, FOODS, RECIPES, ROUTINES. Fuzzy matching for typos.

**Remote fallback:** When local results are empty or sparse (< threshold), automatically query OpenFoodFacts (and USDA if configured) and merge remote results into ranked list. Results cached locally after first lookup.

**Search behavior:** Debounced input, results grouped by type (Foods / Recipes / Exercises / Equipment / Routines), recent items boosted.

---

## Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **UI** | Jetpack Compose | Modern declarative UI, Material 3 |
| **Architecture** | MVVM + Clean Architecture | Separation of concerns |
| **DI** | Hilt | Lifecycle-aware injection |
| **Navigation** | Compose Navigation | Type-safe navigation |
| **Local DB** | Room + FTS5 | SQLite abstraction + full-text search |
| **Async** | Kotlin Coroutines + Flow | Reactive streams |
| **Health Connect** | Health Connect API | Android 14+ (Play Store install for 13-) |

**Libraries:** ML Kit (barcode, on-device), OkHttp + Retrofit (API calls), MPAndroidChart or Compose Charts, Coil (image loading), kotlinx.serialization, WorkManager (background tasks).

**AI Client:** Generic OpenAI-compatible. POST {endpoint}/chat/completions with model, messages, optional image attachments (base64). Vision features require vision-capable endpoint; degrade gracefully otherwise.

---

## Networking Behavior

| Scenario | Behavior |
|---|---|
| Barcode scan with no network | Block with clear message: "Network required for new barcode lookups. Cached items still searchable." |
| AI features with no network | Block with retry prompt. Manual clipboard bridge always works. |
| Remote food search offline | Local FTS5 results only, no block (search still functional). |
| Health Connect sync | On-device, no network needed. |

Camera, barcode, and food-photo features require runtime permissions with clear rationale dialogs.

---

## Widgets

Multiple home screen widgets, user chooses which to install:

| Widget | Size | Function |
|---|---|---|
| **Quick Macro Log** | 2x2 | Calories remaining + tap to scan barcode |
| **Today's Macros** | 4x1 | Horizontal macro bars (P/C/F progress) |
| **Start Workout** | 2x2 | Today's scheduled workout, one-tap session start |
| **Weight Quick Log** | 2x1 | Tap to enter today's weight |

All widgets update via WorkManager periodic refresh + manual refresh on tap.

---

## Rule-Based Recommendation Engine (Always-On)

| Trigger | Recommendation |
|---|---|
| Muscle group untouched > 7 days | "Legs haven't been trained in 8 days" |
| Volume drop > 30% this week | "Bench volume dropped 38%" |
| Same weight 4 consecutive sessions | "Try +2.5lb next session" |
| Push/pull imbalance > 2:1 | "Consider adding rows" |
| Morning movement skipped 3/5 days | "Morning movement consistency slipping" |
| Weight trend vs. goal divergence | "Losing slower than target — reduce calories by 200?" |
| Adherence < 50% weekly | "Adjust schedule?" |
| PR achieved | "New 1RM: Deadlift 225lb!" |

Runs offline, instant, deterministic. AI layer enriches when key configured.

---

## UI/UX Guidelines

### Design System

- **Material 3**, dynamic color from wallpaper, dark/light toggle
- **Units:** LB primary, kg toggle
- **Beginner-assumed:** exercise instructions with step-by-step cues, animations, common mistakes

### Home Screen Layout

```
┌─────────────────────────────────────┐
│ Today                                │
├─────────────────────────────────────┤
│ Net Remaining:      130 / 2,000 cal │  ← food intake − goal
│ ─────────────────────────────────── │
│ Protein: ████████░░  124/180g       │
│ Carbs:   ███░░░░░░░  42/80g   (keto)│
│ Fat:     █████████░ 96/140g         │
│─────────────────────────────────────│
│ Workout burn:        420 cal (est.) │  ← display only, NOT in net
├─────────────────────────────────────┤
│ [📷 Scan] [🍳 Recipe] [💪 Workout]   │
└─────────────────────────────────────┘
```

### Screen Map

| Screen | Description |
|---|---|
| **Home** | Net calorie ring, macro bars, workout burn line, quick actions (scan, recipe, workout), streak, adherence |
| **Food Logging** | Camera-first (barcode), photo AI icon beside scanner, search, recent items, meal type selector |
| **Recipe Builder** | Ingredient pot → container count → per-container macros |
| **Meal Plan** | Calendar view, planned vs. actual comparison |
| **Schedule** | Week view, planned slots color-coded (green=done, yellow=pending, red=cancelled) |
| **Workout Logger** | Quick-log, Next Set + rest countdown, Done |
| **Exercise Library** | Searchable, filter by equipment/muscle, animations, beginner instructions |
| **Equipment Manager** | Owned/wishlist grids with photos, AI detect (photo/link), unlock counts |
| **Progress** | Charts: weight trend, macro adherence, strength curves, correlations, heatmap |
| **Settings** | AI config (endpoint/key/model), Health Connect permissions, goals/TDEE, presets, export, units |

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Project scaffolding (Kotlin + Compose + Hilt + Room)
- [ ] ALL tables with DAOs (equipment, exercise, routines, schedule, sessions, foods, recipes, logs, goals, weight)
- [ ] FTS5 search index setup
- [ ] Navigation scaffold, Settings screen
- [ ] Equipment seeding with pre-set user profile + confirmation dialog

### Phase 2: Macro Tracking (Week 3-4)

- [ ] Scan-first food logging (ML Kit barcode → OpenFoodFacts)
- [ ] Merged search (local FTS5 + remote fallback, cached results)
- [ ] Recipe builder (pot → containers → per-container macros)
- [ ] Meal planning + logging, planned vs. actual
- [ ] Goal setting (manual, TDEE, goal-based, presets incl. Keto)
- [ ] Home screen macro display (net remaining, burn shown separately)
- [ ] CSV export

### Phase 3: Workout Planning (Week 5-6)

- [ ] Exercise library with bundled media (800+, animations + instructions)
- [ ] Global search (exercises, equipment, routines)
- [ ] Equipment manager with photos, wishlist, AI detection hooks
- [ ] Routine builder (supersets, drop sets, pyramids)
- [ ] Schedule management (plan = intent, per-day exceptions)
- [ ] Pre-built beginner templates based on owned equipment

### Phase 4: Live Workout + Health Connect (Week 7)

- [ ] Quick-log mode (Next Set, rest countdown, Done)
- [ ] Session tracking with timestamps
- [ ] Health Connect: write sessions (dedup check), read bodyweight + HR
- [ ] Calorie calculation (HR-based when available, MET fallback, -10% conservative, labeled estimate)

### Phase 5: AI Integration (Week 8)

- [ ] Generic OpenAI-compatible client (endpoint + key + model in settings)
- [ ] Workout generation with JSON parsing + preview
- [ ] Food photo analysis (vision endpoint, review-before-log)
- [ ] Equipment photo/link detection
- [ ] Manual clipboard bridge
- [ ] AI coaching enrichment over rule engine

### Phase 6: Polish & Testing (Week 9-10)

- [ ] Widgets (quick macro log, today's macros, start workout, weight log)
- [ ] Charts and correlation views
- [ ] Material 3 polish, animations
- [ ] Backup/restore (encrypted ZIP)
- [ ] Unit + instrumented tests, Health Connect verification on device

---

## Security & Privacy

| Concern | Mitigation |
|---|---|
| **API Key Protection** | EncryptedSharedPreferences |
| **Health Data** | Explicit Health Connect consent dialogs, dedup on write |
| **Photos** | Food/plate photos stored locally only, optional per-log |
| **No Auto-Delete** | User-triggered deletion only |

---

## Potential Pitfalls & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| OpenFoodFacts sparse barcode data | Medium | Manual override, USDA fallback, custom food creation |
| AI JSON parsing failures | Medium | Strict validation, retry, manual entry fallback |
| Health Connect permissions denied | Low | Graceful degradation, manual calorie/weight entry |
| Vision endpoint unavailable | Medium | Photo AI toggle disables cleanly; barcode scan unaffected |
| Recipe scaling math errors | Low | Unit tests on rollup and division logic |
| FTS5 index corruption | Low | Room re-index on app update |
| Media bundle size | Low | WebP optimization; user has 100GB+ free space |

---

## Handoff Checklist for Claude

1. **Database First:** All Room entities + DAOs before any UI. Equipment system is foundational.
2. **Scan-First UX:** Food logging defaults to camera. Manual entry is fallback, not default.
3. **Test Early:** Unit tests for macro math, recipe rollups, calorie formulas, 1RM, adherence calculations.
4. **Media Bundling:** All animations + equipment photos in `/assets/` at build time.
5. **Graceful Degradation:** Every AI/network feature has an offline or manual fallback path.
6. **Health Connect Early:** Verify read/write on actual Samsung device in Phase 4.

**Deliverables:**
- Kotlin project with Gradle build files
- All schemas, DAOs, migrations
- Seeding scripts: 800+ exercises, equipment catalog with photos, user equipment profile, 10+ beginner routine templates, macro presets (Keto/Paleo/Standard/Vegan)
- 2 fully functional screens first (Home + Food Logging)
- Generic AI client with vision support
- Health Connect integration stub for device testing

**Equipment Changes Protocol:** User may buy/change/remove equipment. Changes flow through Equipment Manager UI (or AI detection) — never require reinstall or rebuild. Wishlist → owned transitions surface newly unlocked exercises and suggest program updates.

---

## Additional Reference Material

| Repo | Resource | Why It Matters |
|---|---|---|
| GymMane | `exercises.json` | 500+ exercise definitions |
| GymMane | `nutrients.csv` | Food database structure |
| wger | Exercise DB (845+ exercises) | Metadata: muscles, equipment, descriptions, multilingual |
| free-exercise-db | Media repository | Public domain animated GIFs/WebP |
| openGym | `api/openapi.yaml` | REST API patterns |
| openGym | `frontend/src/lib/training.ts` | Progression algorithms (1RM, volume) |
| SparkyFitness | `db_schema_backup.sql` | Relational schema example |

---

**End of Specification**

*Hand this entire document to your coding assistant to begin implementation.*