/* ============================================================
   PlateMind — Application Logic
   Client-side router + renderers. Auth is handled by server.js;
   this just confirms the session is still valid and wires logout.
   ============================================================ */

(function authGuard(){
  fetch("/api/me", { credentials: "same-origin" })
    .then(function(r){
      if (!r.ok) { window.location.href = "/login.html"; return; }
      return r.json();
    })
    .then(function(data){
      if (data && data.user){
        var el = document.getElementById("logoutUsername");
        if (el) el.textContent = "Sign out (" + data.user.username + ")";
      }
    })
    .catch(function(){ /* network hiccup — let the user keep using the cached page */ });
})();

document.addEventListener("DOMContentLoaded", function(){
  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn){
    logoutBtn.addEventListener("click", function(){
      fetch("/api/logout", { method: "POST", credentials: "same-origin" })
        .finally(function(){ window.location.href = "/login.html"; });
    });
  }
});

function $(sel, root){ return (root || document).querySelector(sel); }
function $all(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function showToast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 2200);
}

const MACRO_COLORS = {
  protein: ["#A8D8B9","#6FAE85"],
  carbs:   ["#FFE3D3","#FF8C69"],
  fat:     ["#FFD66B","#F2A93B"]
};

function scoopGradient(recipe){
  const dom = getMacroDominant(recipe.nutrition);
  const pair = MACRO_COLORS[dom];
  return "radial-gradient(circle at 35% 30%, " + pair[0] + ", " + pair[1] + ")";
}

/* ---------------------- ROUTER ---------------------- */
const PAGES = ["dashboard","pantry","recipes","recipe-detail","planner","grocery","profile"];

function goTo(pageId){
  PAGES.forEach(function(p){
    const el = $("#page-" + p);
    if(el) el.classList.toggle("hidden", p !== pageId);
  });
  $all(".rail-link").forEach(function(btn){
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });
  $("#mobileNav").classList.remove("open");
  window.scrollTo({top:0, behavior:"smooth"});

  if(pageId === "dashboard") renderDashboard();
  if(pageId === "pantry") renderPantry();
  if(pageId === "recipes") renderRecipes();
  if(pageId === "planner") renderPlanner();
  if(pageId === "grocery") renderGrocery();
  if(pageId === "profile") renderProfile();
}

function openRecipeDetail(recipeId){
  STATE.currentRecipeId = recipeId;
  renderRecipeDetail(recipeId);
  PAGES.forEach(function(p){
    const el = $("#page-" + p);
    if(el) el.classList.toggle("hidden", p !== "recipe-detail");
  });
  window.scrollTo({top:0, behavior:"smooth"});
}

/* ---------------------- DASHBOARD ---------------------- */
function renderDashboard(){
  const ranked = getRankedRecipes({});
  const top = ranked[0];

  if(top){
    $("#heroRecipeName").textContent = top.recipe.name;
    $("#heroRecipeSub").textContent = top.recipe.description;
    const tagsEl = $("#heroTags");
    tagsEl.innerHTML = "";
    [top.matchPct + "% pantry match", top.recipe.time + " min", capitalize(top.recipe.difficulty)].forEach(function(t){
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tagsEl.appendChild(span);
    });
    $("#heroScoop").style.background = scoopGradient(top.recipe);
    $("#heroCookBtn").onclick = function(){ goTo("recipes"); openRecipeDetail(top.recipe.id); };
  }

  $("#statPantryCount").textContent = STATE.pantry.length;
  $("#statRecipeCount").textContent = ranked.filter(function(r){ return r.matchPct >= 50; }).length;
  const avgCal = ranked.length ? Math.round(ranked.reduce(function(s,r){ return s+r.recipe.nutrition.calories; },0)/ranked.length) : 0;
  $("#statAvgCal").textContent = avgCal;

  const leftovers = getLeftoverRescues();
  const leftoverList = $("#leftoverList");
  leftoverList.innerHTML = "";
  if(leftovers.length === 0){
    leftoverList.innerHTML = '<p class="card-sub" style="margin:0;">Nothing close to expiring right now. Your pantry is in good shape.</p>';
  } else {
    leftovers.forEach(function(item){
      const ingredient = item.ingredient, recipe = item.recipe;
      const row = document.createElement("div");
      row.className = "leftover-item";
      row.innerHTML =
        '<div class="leftover-item-left">' +
          '<span class="leftover-dot"></span>' +
          '<div>' +
            '<div class="leftover-name">' + capitalize(ingredient) + '</div>' +
            '<div class="leftover-match">Use it in: ' + recipe.name + '</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm">View recipe</button>';
      row.querySelector("button").onclick = function(){ goTo("recipes"); openRecipeDetail(recipe.id); };
      leftoverList.appendChild(row);
    });
  }

  const miniPlanner = $("#miniPlanner");
  miniPlanner.innerHTML = "";
  DAYS.slice(0,5).forEach(function(day){
    const key = day + "-Dinner";
    const recipeId = STATE.planner[key];
    const recipe = recipeId ? RECIPES.find(function(r){ return r.id===recipeId; }) : null;
    const row = document.createElement("div");
    row.className = "mini-planner-row";
    row.innerHTML = '<span class="mini-planner-day">' + day + '</span><span class="mini-planner-meal ' + (recipe?'':'empty') + '">' + (recipe ? recipe.name : 'Not planned') + '</span>';
    miniPlanner.appendChild(row);
  });
}

/* ---------------------- PANTRY ---------------------- */
function renderPantry(){
  const grid = $("#pantryGrid");
  grid.innerHTML = "";
  $("#pantryEmpty").style.display = STATE.pantry.length === 0 ? "flex" : "none";

  STATE.pantry.forEach(function(item, idx){
    const tile = document.createElement("div");
    tile.className = "pantry-tile";
    tile.innerHTML =
      '<button class="pantry-tile-remove" aria-label="Remove ' + item.name + '">' +
        '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<span class="pantry-tile-name">' + capitalize(item.name) + '</span>' +
      '<span class="pantry-tile-qty">' + capitalize(item.qty) + '</span>';
    tile.querySelector(".pantry-tile-remove").onclick = function(){
      STATE.pantry.splice(idx,1);
      renderPantry();
      showToast("Removed " + item.name + " from pantry");
    };
    grid.appendChild(tile);
  });

  const quickRow = $("#quickAddChips");
  quickRow.innerHTML = "";
  const have = pantryNameSet();
  QUICK_ADD_ITEMS.filter(function(i){ return !have.has(i); }).slice(0,10).forEach(function(item){
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = item;
    chip.onclick = function(){
      STATE.pantry.push({name:item, qty:"some"});
      renderPantry();
      showToast("Added " + item + " to pantry");
    };
    quickRow.appendChild(chip);
  });
}

document.addEventListener("DOMContentLoaded", function(){
  const pantryForm = $("#pantryForm");
  if(pantryForm){
    pantryForm.addEventListener("submit", function(e){
      e.preventDefault();
      const input = $("#pantryInput");
      const qty = $("#pantryQty").value;
      const val = input.value.trim().toLowerCase();
      if(!val) return;
      const have = pantryNameSet();
      if(have.has(val)){
        showToast(capitalize(val) + " is already in your pantry");
        return;
      }
      STATE.pantry.push({name:val, qty:qty});
      input.value = "";
      renderPantry();
      showToast("Added " + val + " to pantry");
    });
  }
});

/* ---------------------- RECIPES LIST ---------------------- */
function renderRecipes(){
  applyRecipeFilters();
}

function applyRecipeFilters(){
  const diet = $("#filterDiet").value;
  const maxTime = parseInt($("#filterTime").value, 10);
  const difficulty = $("#filterDifficulty").value;
  const pantryOnly = $("#filterPantryOnly").checked;

  const ranked = getRankedRecipes({diet:diet, maxTime:maxTime, difficulty:difficulty, pantryOnly:pantryOnly});
  const grid = $("#recipeGrid");
  grid.innerHTML = "";

  if(ranked.length === 0){
    grid.innerHTML = '<div class="card empty-state" style="grid-column:1/-1;">' +
      '<svg viewBox="0 0 24 24" width="32" height="32"><path d="M12 2C8 2 6 6 6 10c0 3 1.5 5 3 6.2V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4.8c1.5-1.2 3-3.2 3-6.2 0-4-2-8-6-8Z" fill="currentColor"/></svg>' +
      '<p>No recipes match these filters yet. Try widening your search.</p>' +
    '</div>';
    return;
  }

  ranked.forEach(function(item){
    const recipe = item.recipe, matchPct = item.matchPct;
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML =
      '<div class="recipe-card-top">' +
        '<div class="scoop-visual" style="width:64px;height:64px;background:' + scoopGradient(recipe) + ';"></div>' +
        '<div>' +
          '<div class="recipe-card-name">' + recipe.name + '</div>' +
          '<div class="recipe-card-match ' + (matchPct < 50 ? 'low':'') + '">' + matchPct + '% pantry match</div>' +
        '</div>' +
      '</div>' +
      '<div class="recipe-card-tags">' +
        recipe.diets.slice(0,2).map(function(d){ return '<span class="tag tag-soft">' + d + '</span>'; }).join("") +
      '</div>' +
      '<div class="recipe-card-meta">' +
        '<span><svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 7v5l4 2" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>' + recipe.time + ' min</span>' +
        '<span><svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2 2 7l10 5 10-5-10-5Zm0 10v10" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>' + capitalize(recipe.difficulty) + '</span>' +
        '<span>' + recipe.nutrition.calories + ' kcal</span>' +
      '</div>';
    card.onclick = function(){ openRecipeDetail(recipe.id); };
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", function(){
  ["filterDiet","filterTime","filterDifficulty","filterPantryOnly"].forEach(function(id){
    const el = $("#" + id);
    if(el) el.addEventListener("change", applyRecipeFilters);
  });
});

/* ---------------------- RECIPE DETAIL ---------------------- */
function renderRecipeDetail(recipeId){
  const recipe = RECIPES.find(function(r){ return r.id === recipeId; });
  if(!recipe) return;
  const missing = getMissingIngredients(recipe);
  const have = pantryNameSet();

  $("#detailScoop").style.background = scoopGradient(recipe);
  $("#detailName").textContent = recipe.name;
  $("#detailDesc").textContent = recipe.description;
  $("#detailTime").textContent = recipe.time + " min";
  $("#detailDifficulty").textContent = capitalize(recipe.difficulty);
  $("#detailServes").textContent = "Serves " + recipe.servings;

  const tagsEl = $("#detailTags");
  tagsEl.innerHTML = "";
  recipe.diets.forEach(function(d){
    const span = document.createElement("span");
    span.className = "tag tag-soft";
    span.textContent = d;
    tagsEl.appendChild(span);
  });

  const ingList = $("#detailIngredients");
  ingList.innerHTML = "";
  recipe.ingredients.forEach(function(ing){
    const owned = have.has(ing.name.toLowerCase());
    const li = document.createElement("li");
    li.innerHTML = '<span>' + capitalize(ing.name) + ' <span style="color:var(--taupe-light);">— ' + ing.qty + '</span></span><span class="' + (owned ? 'ing-have':'ing-missing') + '">' + (owned ? 'In pantry':'Need to buy') + '</span>';
    ingList.appendChild(li);
  });

  const stepsList = $("#detailSteps");
  stepsList.innerHTML = "";
  recipe.steps.forEach(function(step){
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });

  const n = recipe.nutrition;
  const nutriGrid = $("#detailNutrition");
  nutriGrid.innerHTML = "";
  [["Calories", n.calories, ""], ["Protein", n.protein, "g"], ["Carbs", n.carbs, "g"], ["Fat", n.fat, "g"], ["Fibre", n.fiber, "g"]].forEach(function(row){
    const label = row[0], val = row[1], unit = row[2];
    const div = document.createElement("div");
    div.className = "nutri-item";
    div.innerHTML = '<span class="nutri-val">' + val + unit + '</span><span class="nutri-label">' + label + '</span>';
    nutriGrid.appendChild(div);
  });

  const subs = getSubstitutionsFor(recipe);
  const subsList = $("#detailSubs");
  subsList.innerHTML = "";
  if(subs.length === 0){
    subsList.innerHTML = '<p class="card-sub" style="margin:0;">You have everything you need. No swaps required.</p>';
  } else {
    subs.forEach(function(s){
      const div = document.createElement("div");
      div.className = "sub-item";
      div.innerHTML = '<span>' + capitalize(s.original) + '</span><span class="arrow">&rarr;</span><span><strong>' + capitalize(s.sub) + '</strong> — ' + s.note + '</span>';
      subsList.appendChild(div);
    });
  }

  $("#addToPlanBtn").onclick = function(){
    const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay()-1;
    const day = DAYS[dayIdx];
    STATE.planner[day + "-Dinner"] = recipe.id;
    showToast("Added " + recipe.name + " to " + day + " dinner");
  };

  $("#addMissingToGroceryBtn").onclick = function(){
    if(missing.length === 0){ showToast("Nothing missing. You're fully stocked for this one"); return; }
    missing.forEach(function(ing){
      const already = STATE.grocery.some(function(g){ return g.name.toLowerCase() === ing.name.toLowerCase(); });
      if(!already){
        STATE.grocery.push({id: Date.now()+Math.random(), name: ing.name, done:false});
      }
    });
    showToast("Added " + missing.length + " item" + (missing.length>1?'s':'') + " to grocery list");
  };
}

/* ---------------------- PLANNER ---------------------- */
function renderPlanner(){
  const board = $("#plannerBoard");
  board.innerHTML = "";
  const ranked = getRankedRecipes({});

  DAYS.forEach(function(day){
    const col = document.createElement("div");
    col.className = "planner-day";
    col.innerHTML = '<div class="planner-day-label">' + day + '</div>';
    MEALS.forEach(function(meal){
      const key = day + "-" + meal;
      const recipeId = STATE.planner[key];
      const recipe = recipeId ? RECIPES.find(function(r){ return r.id===recipeId; }) : null;
      const slot = document.createElement("div");
      slot.className = "planner-slot" + (recipe ? " filled" : "");
      if(recipe){
        slot.innerHTML =
          '<span class="planner-slot-meal">' + meal + '</span>' +
          '<span class="planner-slot-name">' + recipe.name + '</span>' +
          '<span class="planner-slot-remove">Remove</span>';
        slot.querySelector(".planner-slot-remove").onclick = function(e){
          e.stopPropagation();
          delete STATE.planner[key];
          renderPlanner();
        };
        slot.onclick = function(e){
          if(e.target.classList.contains("planner-slot-remove")) return;
          openRecipeDetail(recipe.id);
        };
      } else {
        const suggestion = ranked[Math.floor(Math.random()*Math.min(5,ranked.length))];
        slot.innerHTML = '<span class="planner-slot-meal">' + meal + '</span><span class="planner-slot-empty">Tap to add</span>';
        slot.onclick = function(){
          if(suggestion){
            STATE.planner[key] = suggestion.recipe.id;
            renderPlanner();
            showToast("Added " + suggestion.recipe.name + " to " + day + " " + meal.toLowerCase());
          }
        };
      }
      col.appendChild(slot);
    });
    board.appendChild(col);
  });
}

document.addEventListener("DOMContentLoaded", function(){
  const btn = $("#clearPlanBtn");
  if(btn) btn.addEventListener("click", function(){
    STATE.planner = {};
    renderPlanner();
    showToast("Cleared the week's plan");
  });
});

/* ---------------------- GROCERY ---------------------- */
function renderGrocery(){
  const activeList = $("#groceryList");
  const doneList = $("#groceryDoneList");
  activeList.innerHTML = "";
  doneList.innerHTML = "";

  const active = STATE.grocery.filter(function(g){ return !g.done; });
  const done = STATE.grocery.filter(function(g){ return g.done; });

  $("#groceryEmpty").style.display = active.length === 0 ? "flex" : "none";

  active.forEach(function(item){
    activeList.appendChild(buildGroceryRow(item));
  });
  if(done.length === 0){
    doneList.innerHTML = '<p class="card-sub" style="margin-top:.6rem;">Nothing checked off yet.</p>';
  } else {
    done.forEach(function(item){ doneList.appendChild(buildGroceryRow(item)); });
  }
}

function buildGroceryRow(item){
  const row = document.createElement("div");
  row.className = "grocery-item" + (item.done ? " done" : "");
  row.innerHTML =
    '<button class="grocery-checkbox ' + (item.done ? 'checked':'') + '" aria-label="Toggle ' + item.name + '">' +
      (item.done ? '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
    '</button>' +
    '<span class="grocery-item-name">' + capitalize(item.name) + '</span>' +
    '<button class="grocery-item-remove">Remove</button>';
  row.querySelector(".grocery-checkbox").onclick = function(){
    item.done = !item.done;
    renderGrocery();
  };
  row.querySelector(".grocery-item-remove").onclick = function(){
    STATE.grocery = STATE.grocery.filter(function(g){ return g.id !== item.id; });
    renderGrocery();
  };
  return row;
}

document.addEventListener("DOMContentLoaded", function(){
  const groceryForm = $("#groceryForm");
  if(groceryForm){
    groceryForm.addEventListener("submit", function(e){
      e.preventDefault();
      const input = $("#groceryInput");
      const val = input.value.trim();
      if(!val) return;
      STATE.grocery.push({id: Date.now()+Math.random(), name: val, done:false});
      input.value = "";
      renderGrocery();
    });
  }
  const clearGroceryBtn = $("#clearGroceryBtn");
  if(clearGroceryBtn){
    clearGroceryBtn.addEventListener("click", function(){
      STATE.grocery = [];
      renderGrocery();
      showToast("Grocery list cleared");
    });
  }
});

/* ---------------------- PROFILE / PREFERENCES ---------------------- */
function renderProfile(){
  const dietRow = $("#dietChipRow");
  dietRow.innerHTML = "";
  DIETS.forEach(function(d){
    const chip = document.createElement("button");
    chip.className = "diet-chip" + (STATE.preferences.diets.includes(d) ? " selected" : "");
    chip.textContent = d;
    chip.onclick = function(){
      const idx = STATE.preferences.diets.indexOf(d);
      if(idx > -1) STATE.preferences.diets.splice(idx,1);
      else STATE.preferences.diets.push(d);
      renderProfile();
    };
    dietRow.appendChild(chip);
  });

  const allergenRow = $("#allergenChipRow");
  allergenRow.innerHTML = "";
  ALLERGENS.forEach(function(a){
    const chip = document.createElement("button");
    chip.className = "diet-chip" + (STATE.preferences.allergens.includes(a) ? " selected" : "");
    chip.textContent = a;
    chip.onclick = function(){
      const idx = STATE.preferences.allergens.indexOf(a);
      if(idx > -1) STATE.preferences.allergens.splice(idx,1);
      else STATE.preferences.allergens.push(a);
      renderProfile();
    };
    allergenRow.appendChild(chip);
  });

  $("#goalCalories").value = STATE.preferences.goalCalories;
  $("#goalProtein").value = STATE.preferences.goalProtein;
  $("#goalServings").value = STATE.preferences.servings;
}

document.addEventListener("DOMContentLoaded", function(){
  const saveBtn = $("#savePrefsBtn");
  if(saveBtn){
    saveBtn.addEventListener("click", function(){
      STATE.preferences.goalCalories = parseInt($("#goalCalories").value, 10) || 2000;
      STATE.preferences.goalProtein = parseInt($("#goalProtein").value, 10) || 90;
      STATE.preferences.servings = parseInt($("#goalServings").value, 10) || 2;
      const confirmEl = $("#saveConfirm");
      confirmEl.classList.add("show");
      setTimeout(function(){ confirmEl.classList.remove("show"); }, 1800);
      showToast("Preferences saved");
    });
  }
});

/* ---------------------- NAV WIRING + INIT ---------------------- */
document.addEventListener("DOMContentLoaded", function(){
  $all(".rail-link, .mobile-nav .rail-link").forEach(function(btn){
    btn.addEventListener("click", function(){ goTo(btn.dataset.page); });
  });
  $all("[data-goto]").forEach(function(btn){
    btn.addEventListener("click", function(){ goTo(btn.dataset.goto); });
  });
  const mobileMenuBtn = $("#mobileMenuBtn");
  if(mobileMenuBtn){
    mobileMenuBtn.addEventListener("click", function(){
      $("#mobileNav").classList.toggle("open");
    });
  }

  goTo("dashboard");
});
