PlateMind — Smart Nutrition & Recipe Recommendation App
=========================================================

WHAT THIS IS
------------
A fully self-contained web app. There is no separate frontend/backend
to deploy — everything (UI, data, and the recommendation engine) runs
in the browser from static files.

HOW TO RUN IT
-------------
Option A (simplest): double-click index.html to open it in any browser.

Option B (recommended, avoids browser file-access quirks):
  1. Open a terminal in this folder.
  2. Run:  python3 -m http.server 8000
  3. Open: http://localhost:8000 in your browser.

Option C: drag the whole folder into a static host (Netlify, Vercel,
GitHub Pages, etc). No build step, no server, no database needed.

PAGES INCLUDED
--------------
1. Dashboard       - today's top pick, stats, leftover rescue, mini planner
2. My Pantry       - add/remove ingredients you have at home
3. Recipes         - filterable, AI-ranked recipe matches
4. Recipe Detail   - full recipe, nutrition, ingredient swaps
5. Meal Planner    - 7-day x 3-meal interactive planner
6. Grocery List    - auto-fills from missing recipe ingredients
7. Preferences     - diets, allergens, calorie/protein goals

HOW THE "AI" WORKS
-------------------
data.js contains a transparent scoring engine (scoreRecipe) that ranks
recipes by: ingredient overlap with your pantry, fit with your selected
diets, hard-excludes anything matching your allergens, and closeness to
your per-meal calorie goal. It also powers ingredient substitution
suggestions and the "leftover rescue" feature for low-stock items.

To connect a real backend or LLM later, replace the functions in
data.js (getRankedRecipes, getSubstitutionsFor, etc.) with calls to
your API — the UI layer in app.js does not need to change.

FILES
-----
index.html   Structure for all 7 pages
styles.css   Pastel peach sorbet design system
data.js      Recipe database + recommendation engine
app.js       Routing, rendering, interactivity
