export const AI_CONFIG = {
  SAFETY_DISCLAIMER:
    "AI suggestion only. AI assists with classification and operational logistics, but CANNOT determine microbiological freshness or whether food is safe to eat. All food safety declarations and sensory inspections remain the sole responsibility of the donating and receiving organizations.",
  ASSISTANT_DISCLAIMER:
    "ShareBite Assistant provides platform navigation and educational operational guidance. It does not provide medical, legal, or food safety guarantees.",
  IMAGE_DISCLAIMER:
    "AI assists with visual categorization only and cannot assess hygiene, spoilage, or microbial safety. The donor must confirm or correct the result.",
  DESCRIPTION_DISCLAIMER:
    "AI-generated text suggestion. The donor must review and verify all details for accuracy before publishing.",
  CATEGORIES: [
    "Rice",
    "Bread",
    "Vegetables",
    "Fruits",
    "Cooked meal",
    "Bakery",
    "Packaged food",
    "Unknown",
  ] as const,
  TIMEOUT_MS: 5000,
  DEFAULT_MODEL: "gemini-1.5-flash",
  FALLBACK_ENGINE: "local-heuristic-v1",
};

export const COMMON_ALLERGENS_MAP: Record<string, string[]> = {
  "Gluten / Wheat": [
    "bread", "roti", "chapati", "naan", "wheat", "pasta", "flour", "cake", "pastry",
    "cookie", "pie", "muffin", "croissant", "noodle", "dough", "crust", "semolina", "atta", "maida"
  ],
  "Dairy / Milk": [
    "cheese", "milk", "butter", "paneer", "cream", "curd", "yogurt", "ghee", "custard",
    "ice cream", "latte", "whey", "makhani", "tikka masala"
  ],
  "Eggs": [
    "egg", "omelette", "scramble", "mayonnaise", "mayo", "meringue", "souffle", "quiche"
  ],
  "Peanuts": [
    "peanut", "groundnut", "peanut butter", "satay"
  ],
  "Tree Nuts": [
    "almond", "cashew", "walnut", "pistachio", "pecan", "hazelnut", "macadamia", "kaju", "badam", "pista"
  ],
  "Soybeans": [
    "soy", "soya", "tofu", "edamame", "soy sauce", "miso", "tempeh"
  ],
  "Fish / Shellfish": [
    "fish", "salmon", "tuna", "shrimp", "prawn", "crab", "lobster", "oyster", "clam", "seafood"
  ],
  "Sesame": [
    "sesame", "tahini", "til", "hummus"
  ],
  "Mustard": [
    "mustard", "sarson", "rai"
  ],
  "Vegetarian": [
    "biryani", "dal", "paneer", "vegetable", "sabzi", "rice", "curry", "pasta", "salad",
    "fruit", "bread", "roti", "lentil", "chana", "rajma", "khichdi", "idli", "dosa", "sambar"
  ],
  "Vegan": [
    "fruit", "salad", "vegetables", "rice", "dal", "lentil", "chana", "rajma", "tofu"
  ],
  "Halal": [
    "biryani", "curry", "chicken", "mutton", "lamb", "halal", "rice"
  ]
};
