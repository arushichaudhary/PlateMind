PlateMind — Smart Nutrition & Recipe Recommendation App
=========================================================

WHAT CHANGED
------------
PlateMind is now a real (small) web app instead of a pure static site:
a tiny Node/Express server sits in front of it that requires users to
create an account (username + password) before they can reach the app.
Passwords are hashed with bcrypt; user accounts are stored in a plain
users.json file and sessions in a plain file store — deliberately pure
JavaScript, so there's no native compiler / Visual Studio Build Tools
needed to install dependencies on Windows.

PROJECT LAYOUT
---------------
server.js          Express server: auth routes + serves the app
package.json       Backend dependencies
render.yaml         One-click Render deploy config (optional)
public/             The original app (index.html, app.js, data.js, styles.css)
public-auth/        login.html — the sign in / create account page

RUNNING IT LOCALLY
-------------------
1. Install Node.js 18+ if you don't have it.
2. In this folder run:
     npm install
     npm start
3. Open http://localhost:3000 — you'll land on the sign-in page.
   Click "Create an account", pick a username (3-20 chars, letters/
   numbers/underscore) and a password (8+ chars), and you're in.

A file called users.json (and a sessions/ folder) will appear in this
folder — that's your local database of users/sessions. Delete them
any time to start fresh.

DEPLOYING ON RENDER
---------------------
Option A — render.yaml (recommended):
  1. Push this folder to a GitHub repo.
  2. In Render: New -> Blueprint -> pick the repo. Render reads
     render.yaml and creates the service, a persistent disk (so your
     user accounts survive deploys/restarts), and a random
     SESSION_SECRET automatically.
  3. Deploy. That's it.

Option B — manual web service:
  1. Push this folder to GitHub.
  2. In Render: New -> Web Service -> connect the repo.
  3. Build command:  npm install
     Start command:  npm start
  4. Add environment variables:
       SESSION_SECRET = (any long random string)
       NODE_ENV       = production
       DATA_DIR       = /data
  5. Add a Persistent Disk, mount path /data, 1 GB is plenty.
     (Without a persistent disk, Render's filesystem resets on every
     deploy/restart and your SQLite database — i.e. all accounts —
     would be wiped. The free Render plan doesn't include disks; if
     you're on the free tier, leave DATA_DIR unset and accept that
     accounts reset on redeploys, or upgrade to a paid plan for a disk.)
  6. Deploy.

HOW AUTH WORKS
----------------
- POST /api/register  { username, password }  -> creates account, logs you in
- POST /api/login      { username, password }  -> logs you in
- POST /api/logout                              -> ends your session
- GET  /api/me                                  -> current logged-in user
- GET  /                                        -> the app, or redirects
                                                    to /login.html if you
                                                    aren't signed in

Sessions are httpOnly cookies (not readable by JS, helps against XSS
token theft) and are marked "secure" in production, so they only work
over HTTPS (which Render gives you automatically).

WHAT'S NOT INCLUDED (BY DESIGN, TO KEEP THIS SIMPLE)
-------------------------------------------------------
- Password reset / "forgot password" flow.
- Per-user saved pantry/preferences on the server — the pantry, meal
  plan, grocery list, etc. still live only in the browser tab's memory,
  same as before. If you want each user's pantry/preferences to persist
  across devices and logins, the next step would be adding a few more
  tables (pantry_items, preferences) keyed by user id, and a couple of
  API routes for the frontend to read/write them.
- Rate limiting on login attempts (worth adding before a real public
  launch, e.g. with express-rate-limit).

ORIGINAL APP DETAILS
-----------------------
PAGES INCLUDED
  1. Dashboard       - today's top pick, stats, leftover rescue, mini planner
  2. My Pantry        - add/remove ingredients you have at home
  3. Recipes          - filterable, AI-ranked recipe matches
  4. Recipe Detail    - full recipe, nutrition, ingredient swaps
  5. Meal Planner     - 7-day x 3-meal interactive planner
  6. Grocery List     - auto-fills from missing recipe ingredients
  7. Preferences      - diets, allergens, calorie/protein goals

HOW THE "AI" WORKS
  data.js contains a transparent scoring engine (scoreRecipe) that ranks
  recipes by: ingredient overlap with your pantry, fit with your selected
  diets, hard-excludes anything matching your allergens, and closeness to
  your per-meal calorie goal. It also powers ingredient substitution
  suggestions and the "leftover rescue" feature for low-stock items.
