/* ============================================================
   PlateMind — Data Layer & Recommendation Engine
   Everything here runs client-side: no backend required.
   In a production version, this module is what you'd swap
   for real API calls (e.g. /api/recipes, /api/recommend).
   ============================================================ */

const DIETS = ["vegetarian","vegan","high-protein","diabetic-friendly","low-carb"];
const ALLERGENS = ["nuts","dairy","gluten","shellfish","soy","eggs"];

const QUICK_ADD_ITEMS = [
  "onion","garlic","tomato","rice","eggs","spinach","paneer","chickpeas",
  "chicken breast","greek yogurt","olive oil","lemon","ginger","bell pepper",
  "broccoli","oats","milk","butter","potato","lentils"
];

/* Substitution map: ingredient -> array of {sub, note} */
const SUBSTITUTIONS = {
  "paneer": [{sub:"firm tofu", note:"similar texture, lower fat, fully vegan"},{sub:"halloumi", note:"saltier, holds shape well when fried"}],
  "chicken breast": [{sub:"firm tofu", note:"for a vegetarian version, press well before cooking"},{sub:"chickpeas", note:"adds fibre, great in curries and bowls"}],
  "greek yogurt": [{sub:"hung curd", note:"near-identical tang and thickness"},{sub:"coconut yogurt", note:"dairy-free, slightly sweeter"}],
  "butter": [{sub:"olive oil", note:"lighter, heart-healthier fat"},{sub:"ghee", note:"works in Indian dishes, lactose-light"}],
  "milk": [{sub:"oat milk", note:"creamy, dairy-free, neutral flavour"},{sub:"almond milk", note:"lighter, nutty undertone"}],
  "rice": [{sub:"cauliflower rice", note:"cuts carbs significantly, great for low-carb"},{sub:"quinoa", note:"adds protein and fibre"}],
  "sugar": [{sub:"stevia", note:"zero-calorie, good for diabetic-friendly diets"},{sub:"dates (blended)", note:"natural sweetness with fibre"}],
  "cream": [{sub:"cashew cream", note:"blended soaked cashews, dairy-free"},{sub:"evaporated milk", note:"lighter, less saturated fat"}],
  "soy sauce": [{sub:"tamari", note:"gluten-free alternative, same flavour depth"},{sub:"coconut aminos", note:"soy-free, slightly sweeter"}],
  "all-purpose flour": [{sub:"almond flour", note:"low-carb, adds protein"},{sub:"oat flour", note:"gluten-light, mild flavour"}],
  "potato": [{sub:"cauliflower", note:"lower-carb mash or roast alternative"},{sub:"sweet potato", note:"lower glycemic impact, more fibre"}],
  "white bread": [{sub:"whole wheat bread", note:"more fibre, slower glucose release"},{sub:"lettuce wrap", note:"carb-free wrap option"}],
};

/* Recipe database. macros are per serving. */
const RECIPES = [
  {
    id:"r1", name:"Lemon Herb Chickpea Bowl",
    description:"A bright, protein-packed bowl built around pantry chickpeas, fresh lemon, and whatever greens you have on hand.",
    diets:["vegetarian","vegan","high-protein","diabetic-friendly"],
    allergens:[],
    time:20, difficulty:"easy", servings:2,
    ingredients:[
      {name:"chickpeas", qty:"1.5 cups"},{name:"lemon", qty:"1"},{name:"olive oil", qty:"2 tbsp"},
      {name:"spinach", qty:"2 cups"},{name:"garlic", qty:"2 cloves"},{name:"bell pepper", qty:"1"}
    ],
    steps:[
      "Drain and rinse the chickpeas, then pat dry.",
      "Warm olive oil in a pan over medium heat and add minced garlic until fragrant.",
      "Add chickpeas and bell pepper, saute for 6-7 minutes until lightly golden.",
      "Stir in spinach until just wilted, about 2 minutes.",
      "Finish with lemon juice and zest, season with salt and pepper, and serve warm."
    ],
    nutrition:{calories:340, protein:14, carbs:42, fat:13, fiber:11},
    tags:["bowl","mediterranean","quick"]
  },
  {
    id:"r2", name:"Paneer Tikka Skillet",
    description:"Smoky, spiced paneer seared in one pan with peppers and onion, a weeknight version of the tandoor classic.",
    diets:["vegetarian","high-protein"],
    allergens:["dairy"],
    time:25, difficulty:"easy", servings:3,
    ingredients:[
      {name:"paneer", qty:"250g"},{name:"bell pepper", qty:"2"},{name:"onion", qty:"1"},
      {name:"greek yogurt", qty:"3 tbsp"},{name:"ginger", qty:"1 inch"},{name:"garlic", qty:"3 cloves"},{name:"olive oil", qty:"2 tbsp"}
    ],
    steps:[
      "Cube the paneer and slice the onion and bell peppers into chunks.",
      "Mix yogurt with grated ginger, garlic, and your spice blend (chili, turmeric, garam masala).",
      "Coat the paneer and vegetables in the marinade for at least 10 minutes.",
      "Heat oil in a skillet on high and sear the paneer until lightly charred on edges.",
      "Add vegetables and cook for 5 more minutes, then serve hot."
    ],
    nutrition:{calories:410, protein:22, carbs:18, fat:27, fiber:4},
    tags:["indian","skillet","spiced"]
  },
  {
    id:"r3", name:"Ginger Garlic Egg Fried Rice",
    description:"Fast and satisfying, built to use up leftover rice and any odds-and-ends vegetables in the fridge.",
    diets:["vegetarian","high-protein"],
    allergens:["eggs","soy"],
    time:15, difficulty:"easy", servings:2,
    ingredients:[
      {name:"rice", qty:"2 cups cooked"},{name:"eggs", qty:"2"},{name:"garlic", qty:"2 cloves"},
      {name:"ginger", qty:"1 tsp"},{name:"soy sauce", qty:"1.5 tbsp"},{name:"onion", qty:"0.5"}
    ],
    steps:[
      "Heat a wok or wide pan over high heat with a little oil.",
      "Scramble the eggs lightly and set aside.",
      "Saute garlic, ginger, and onion until fragrant.",
      "Add the cooked rice, breaking up clumps, and toss for 3-4 minutes.",
      "Return the eggs to the pan, add soy sauce, and stir-fry until evenly combined."
    ],
    nutrition:{calories:390, protein:15, carbs:55, fat:11, fiber:2},
    tags:["fried rice","leftover-friendly","asian"]
  },
  {
    id:"r4", name:"Grilled Lemon Chicken with Greens",
    description:"Simple grilled chicken breast with a citrus marinade, served over wilted spinach, built for high-protein, low-carb goals.",
    diets:["high-protein","low-carb","diabetic-friendly"],
    allergens:[],
    time:30, difficulty:"medium", servings:2,
    ingredients:[
      {name:"chicken breast", qty:"2 pieces"},{name:"lemon", qty:"1"},{name:"olive oil", qty:"2 tbsp"},
      {name:"garlic", qty:"2 cloves"},{name:"spinach", qty:"3 cups"}
    ],
    steps:[
      "Marinate the chicken in lemon juice, olive oil, minced garlic, salt, and pepper for 15 minutes.",
      "Grill or pan-sear the chicken for 6-7 minutes per side until cooked through.",
      "Rest the chicken for 5 minutes, then slice.",
      "Quickly wilt spinach in the same pan with the leftover juices.",
      "Plate the spinach, top with sliced chicken, and finish with a squeeze of lemon."
    ],
    nutrition:{calories:360, protein:42, carbs:6, fat:17, fiber:3},
    tags:["grilled","high-protein","light"]
  },
  {
    id:"r5", name:"Spiced Lentil & Tomato Stew",
    description:"A slow-simmered, warming lentil stew that is naturally diabetic-friendly thanks to its low glycemic profile.",
    diets:["vegetarian","vegan","diabetic-friendly"],
    allergens:[],
    time:40, difficulty:"easy", servings:4,
    ingredients:[
      {name:"lentils", qty:"1.5 cups"},{name:"tomato", qty:"3"},{name:"onion", qty:"1"},
      {name:"garlic", qty:"3 cloves"},{name:"ginger", qty:"1 inch"},{name:"olive oil", qty:"2 tbsp"}
    ],
    steps:[
      "Rinse lentils thoroughly and set aside.",
      "Saute onion, garlic, and ginger in olive oil until softened.",
      "Add chopped tomatoes and cook until they break down, about 8 minutes.",
      "Add lentils and 4 cups of water, bring to a boil, then simmer for 25 minutes.",
      "Season generously and serve with a drizzle of olive oil."
    ],
    nutrition:{calories:310, protein:16, carbs:48, fat:7, fiber:14},
    tags:["stew","comfort","budget"]
  },
  {
    id:"r6", name:"Overnight Oats with Berries",
    description:"A make-ahead breakfast that takes five minutes the night before and stays gentle on blood sugar in the morning.",
    diets:["vegetarian","diabetic-friendly"],
    allergens:["dairy"],
    time:5, difficulty:"easy", servings:1,
    ingredients:[
      {name:"oats", qty:"0.5 cup"},{name:"milk", qty:"0.75 cup"},{name:"greek yogurt", qty:"2 tbsp"},{name:"lemon", qty:"1 tsp zest"}
    ],
    steps:[
      "Combine oats, milk, and yogurt in a jar.",
      "Stir well, add lemon zest, and cover.",
      "Refrigerate overnight, or for at least 4 hours.",
      "Top with fresh berries or nuts before serving."
    ],
    nutrition:{calories:290, protein:13, carbs:38, fat:8, fiber:6},
    tags:["breakfast","make-ahead","no-cook"]
  },
  {
    id:"r7", name:"Broccoli & Tofu Stir-Fry",
    description:"A crisp, garlicky stir-fry that comes together in one pan and leans on whatever crunchy vegetables you have left.",
    diets:["vegetarian","vegan","low-carb","high-protein"],
    allergens:["soy"],
    time:18, difficulty:"easy", servings:2,
    ingredients:[
      {name:"broccoli", qty:"2 cups"},{name:"firm tofu", qty:"200g"},{name:"garlic", qty:"2 cloves"},
      {name:"ginger", qty:"1 tsp"},{name:"soy sauce", qty:"2 tbsp"},{name:"olive oil", qty:"1 tbsp"}
    ],
    steps:[
      "Press and cube the tofu, then pan-fry until golden on all sides.",
      "Remove tofu and set aside; add garlic and ginger to the same pan.",
      "Add broccoli and stir-fry for 4-5 minutes until just tender-crisp.",
      "Return tofu to the pan, add soy sauce, and toss to coat.",
      "Serve hot, optionally over rice or cauliflower rice."
    ],
    nutrition:{calories:280, protein:19, carbs:14, fat:16, fiber:6},
    tags:["stir-fry","quick","plant-based"]
  },
  {
    id:"r8", name:"Sweet Potato & Black Bean Tacos",
    description:"Roasted sweet potato and black beans bring natural sweetness and fibre to a weeknight taco night.",
    diets:["vegetarian","vegan"],
    allergens:["gluten"],
    time:35, difficulty:"medium", servings:3,
    ingredients:[
      {name:"sweet potato", qty:"2"},{name:"black beans", qty:"1.5 cups"},{name:"onion", qty:"0.5"},
      {name:"lemon", qty:"1"},{name:"olive oil", qty:"2 tbsp"},{name:"white bread", qty:"6 small tortillas"}
    ],
    steps:[
      "Roast diced sweet potato with olive oil at 200C (400F) for 20 minutes until tender.",
      "Warm the black beans with diced onion in a small pan.",
      "Warm the tortillas on a dry skillet for 30 seconds per side.",
      "Assemble tacos with sweet potato, black beans, and a squeeze of lemon.",
      "Top with your favourite fresh herbs or salsa."
    ],
    nutrition:{calories:420, protein:13, carbs:68, fat:11, fiber:15},
    tags:["tacos","mexican","vegan"]
  },
  {
    id:"r9", name:"Greek Yogurt Chicken Salad",
    description:"A creamy, protein-forward salad that swaps mayo for Greek yogurt, light but still satisfying.",
    diets:["high-protein","low-carb","diabetic-friendly"],
    allergens:["dairy"],
    time:15, difficulty:"easy", servings:2,
    ingredients:[
      {name:"chicken breast", qty:"2 cups cooked, shredded"},{name:"greek yogurt", qty:"0.5 cup"},
      {name:"lemon", qty:"1"},{name:"bell pepper", qty:"0.5"},{name:"onion", qty:"0.25"}
    ],
    steps:[
      "Shred the cooked chicken breast finely.",
      "Mix Greek yogurt, lemon juice, salt, and pepper into a dressing.",
      "Finely dice the bell pepper and onion.",
      "Combine chicken, dressing, and diced vegetables.",
      "Chill for 10 minutes before serving over greens or in a wrap."
    ],
    nutrition:{calories:300, protein:38, carbs:8, fat:11, fiber:2},
    tags:["salad","meal-prep","high-protein"]
  },
  {
    id:"r10", name:"Garlic Butter Mushroom Pasta",
    description:"A rich, comforting pasta night that leans entirely on pantry staples plus whatever mushrooms are on hand.",
    diets:["vegetarian"],
    allergens:["gluten","dairy"],
    time:25, difficulty:"medium", servings:3,
    ingredients:[
      {name:"all-purpose flour", qty:"pasta, 300g"},{name:"butter", qty:"3 tbsp"},{name:"garlic", qty:"4 cloves"},
      {name:"cream", qty:"0.5 cup"},{name:"onion", qty:"0.5"}
    ],
    steps:[
      "Cook pasta according to package directions, reserving a cup of pasta water.",
      "Melt butter in a pan and saute garlic and onion until soft.",
      "Add sliced mushrooms (if available) and cook until golden.",
      "Stir in cream and a splash of pasta water to loosen the sauce.",
      "Toss with pasta until coated, season, and serve immediately."
    ],
    nutrition:{calories:520, protein:14, carbs:62, fat:24, fiber:3},
    tags:["pasta","comfort","indulgent"]
  },
  {
    id:"r11", name:"Cauliflower Fried Rice",
    description:"All the satisfaction of fried rice with a fraction of the carbs, great for low-carb or diabetic-friendly plans.",
    diets:["vegetarian","vegan","low-carb","diabetic-friendly"],
    allergens:["soy"],
    time:18, difficulty:"easy", servings:2,
    ingredients:[
      {name:"cauliflower rice", qty:"3 cups"},{name:"eggs", qty:"1"},{name:"garlic", qty:"2 cloves"},
      {name:"ginger", qty:"1 tsp"},{name:"soy sauce", qty:"1 tbsp"},{name:"bell pepper", qty:"0.5"}
    ],
    steps:[
      "Heat oil in a wide pan and scramble the egg, then set aside.",
      "Saute garlic, ginger, and bell pepper for 2 minutes.",
      "Add cauliflower rice and stir-fry for 5-6 minutes until tender.",
      "Return the egg, add soy sauce, and toss everything together.",
      "Serve hot, garnished with spring onion if available."
    ],
    nutrition:{calories:190, protein:9, carbs:14, fat:11, fiber:5},
    tags:["low-carb","quick","fried rice"]
  },
  {
    id:"r12", name:"Classic Margherita Flatbread",
    description:"A simple, crowd-pleasing flatbread that comes together fast on busy nights with minimal pantry items.",
    diets:["vegetarian"],
    allergens:["gluten","dairy"],
    time:20, difficulty:"easy", servings:2,
    ingredients:[
      {name:"all-purpose flour", qty:"flatbread base, 2"},{name:"tomato", qty:"2"},{name:"paneer", qty:"100g, sliced"},
      {name:"olive oil", qty:"1 tbsp"},{name:"garlic", qty:"1 clove"}
    ],
    steps:[
      "Preheat oven to 220C (425F).",
      "Rub flatbread bases lightly with olive oil and minced garlic.",
      "Top with sliced tomato and paneer (or mozzarella if available).",
      "Bake for 10-12 minutes until edges are crisp and cheese has softened.",
      "Finish with fresh basil if on hand, slice, and serve."
    ],
    nutrition:{calories:380, protein:16, carbs:42, fat:17, fiber:3},
    tags:["flatbread","quick","crowd-pleaser"]
  }
];

/* ===================== APPLICATION STATE ===================== */
const STATE = {
  pantry: [
    {name:"onion", qty:"plenty"}, {name:"garlic", qty:"plenty"}, {name:"tomato", qty:"some"},
    {name:"rice", qty:"plenty"}, {name:"eggs", qty:"some"}, {name:"spinach", qty:"a little"},
    {name:"olive oil", qty:"plenty"}, {name:"lemon", qty:"some"}, {name:"bell pepper", qty:"some"},
    {name:"ginger", qty:"a little"}, {name:"greek yogurt", qty:"some"}, {name:"paneer", qty:"some"}
  ],
  preferences: {
    diets: ["vegetarian"],
    allergens: [],
    goalCalories: 2000,
    goalProtein: 90,
    servings: 2
  },
  planner: {},
  grocery: [],
  currentRecipeId: null,
};

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MEALS = ["Breakfast","Lunch","Dinner"];

/* ===================== RECOMMENDATION ENGINE ===================== */

function pantryNameSet(){
  return new Set(STATE.pantry.map(p => p.name.toLowerCase()));
}

/* Core matching algorithm: scores a recipe against the pantry + preferences.
   This is the "AI recommendation" layer: a transparent, explainable scoring
   model combining ingredient overlap, dietary fit, and nutrition-goal alignment. */
function scoreRecipe(recipe){
  const have = pantryNameSet();
  const total = recipe.ingredients.length;
  const owned = recipe.ingredients.filter(i => have.has(i.name.toLowerCase())).length;
  const matchPct = total === 0 ? 0 : Math.round((owned/total)*100);

  let dietBonus = 0;
  if(STATE.preferences.diets.length){
    const fits = STATE.preferences.diets.some(d => recipe.diets.includes(d));
    dietBonus = fits ? 15 : -25;
  }

  const allergenConflict = STATE.preferences.allergens.some(a => recipe.allergens.includes(a));
  if(allergenConflict) dietBonus -= 1000;

  const calDelta = Math.abs(recipe.nutrition.calories - (STATE.preferences.goalCalories/3));
  const calScore = Math.max(0, 10 - Math.floor(calDelta/40));

  const finalScore = matchPct + dietBonus + calScore;
  return {matchPct, finalScore, owned, total, allergenConflict};
}

function getRankedRecipes(opts){
  opts = opts || {};
  const pantryOnly = opts.pantryOnly || false;
  const diet = opts.diet || "all";
  const maxTime = opts.maxTime || 999;
  const difficulty = opts.difficulty || "all";

  return RECIPES
    .map(r => Object.assign({recipe:r}, scoreRecipe(r)))
    .filter(x => !x.allergenConflict)
    .filter(x => diet === "all" || x.recipe.diets.includes(diet))
    .filter(x => x.recipe.time <= maxTime)
    .filter(x => difficulty === "all" || x.recipe.difficulty === difficulty)
    .filter(x => !pantryOnly || x.matchPct === 100)
    .sort((a,b) => b.finalScore - a.finalScore);
}

function getMissingIngredients(recipe){
  const have = pantryNameSet();
  return recipe.ingredients.filter(i => !have.has(i.name.toLowerCase()));
}

function getSubstitutionsFor(recipe){
  const missing = getMissingIngredients(recipe);
  const subs = [];
  missing.forEach(ing => {
    const key = ing.name.toLowerCase();
    if(SUBSTITUTIONS[key]){
      SUBSTITUTIONS[key].forEach(s => subs.push(Object.assign({original:ing.name}, s)));
    }
  });
  return subs;
}

/* "Leftover rescue": ingredients in pantry with low quantity ("a little")
   matched against recipes that use them, prioritising the best overall match. */
function getLeftoverRescues(){
  const lowStock = STATE.pantry.filter(p => p.qty === "a little");
  const results = [];
  lowStock.forEach(item => {
    const candidates = RECIPES.filter(r =>
      r.ingredients.some(i => i.name.toLowerCase() === item.name.toLowerCase())
    );
    if(candidates.length){
      const ranked = candidates.map(r => Object.assign({recipe:r}, scoreRecipe(r))).sort((a,b)=>b.finalScore-a.finalScore);
      results.push({ingredient:item.name, recipe:ranked[0].recipe});
    }
  });
  return results.slice(0,4);
}

function getMacroDominant(nutrition){
  const proteinCals = nutrition.protein*4, carbCals = nutrition.carbs*4, fatCals = nutrition.fat*9;
  const max = Math.max(proteinCals, carbCals, fatCals);
  if(max === proteinCals) return "protein";
  if(max === carbCals) return "carbs";
  return "fat";
}
