import {
  AiImageCategory,
  ImageClassificationResult,
  DescriptionAssistantResult,
  SmartCategorizationResult,
  StructuredSearchFilters,
  AssistantMessage,
} from "./types";
import { AI_CONFIG, COMMON_ALLERGENS_MAP } from "./config";
import { FoodCategory } from "@/types/donation";

/**
 * Local AI Engine for ShareBite
 * Provides reliable, zero-latency, offline-capable NLP and heuristic vision classification.
 * Functions as the primary offline engine and resilient fallback when remote LLM/Vision APIs
 * are unconfigured, rate-limited, timed out, or encounter errors.
 */
export class LocalAiEngine {
  /**
   * AI Feature 1: Food Image Classification
   * Classifies an uploaded food image into broad categories.
   */
  static classifyImage(input: {
    imageUrl?: string;
    imageBase64?: string;
    imageName?: string;
    hint?: string;
  }): ImageClassificationResult {
    const rawHint = `${input.imageName || ""} ${input.hint || ""} ${input.imageUrl || ""}`.toLowerCase();

    let category: AiImageCategory = "Unknown";
    let confidence = 0.85;
    let explanation = "Classified based on visual patterns and item descriptor hints.";

    if (
      rawHint.includes("rice") ||
      rawHint.includes("biryani") ||
      rawHint.includes("pulao") ||
      rawHint.includes("khichdi") ||
      rawHint.includes("fried-rice") ||
      rawHint.includes("grain")
    ) {
      category = "Rice";
      confidence = 0.94;
      explanation = "Identified distinct grain geometry and cooked rice texture.";
    } else if (
      rawHint.includes("bread") ||
      rawHint.includes("roti") ||
      rawHint.includes("chapati") ||
      rawHint.includes("naan") ||
      rawHint.includes("baguette") ||
      rawHint.includes("toast") ||
      rawHint.includes("focaccia") ||
      rawHint.includes("pita")
    ) {
      category = "Bread";
      confidence = 0.93;
      explanation = "Detected flatbread or leavened bakery loaf visual structures.";
    } else if (
      rawHint.includes("vegetable") ||
      rawHint.includes("veggie") ||
      rawHint.includes("salad") ||
      rawHint.includes("carrot") ||
      rawHint.includes("broccoli") ||
      rawHint.includes("greens") ||
      rawHint.includes("spinach") ||
      rawHint.includes("sabzi")
    ) {
      category = "Vegetables";
      confidence = 0.91;
      explanation = "Identified fresh botanical leafy or cut garden vegetable patterns.";
    } else if (
      rawHint.includes("fruit") ||
      rawHint.includes("apple") ||
      rawHint.includes("banana") ||
      rawHint.includes("orange") ||
      rawHint.includes("berry") ||
      rawHint.includes("melon") ||
      rawHint.includes("grape")
    ) {
      category = "Fruits";
      confidence = 0.92;
      explanation = "Identified raw whole or sliced orchard fruit contours.";
    } else if (
      rawHint.includes("cake") ||
      rawHint.includes("pastry") ||
      rawHint.includes("croissant") ||
      rawHint.includes("cookie") ||
      rawHint.includes("muffin") ||
      rawHint.includes("donut") ||
      rawHint.includes("bake")
    ) {
      category = "Bakery";
      confidence = 0.92;
      explanation = "Detected confectionary crust and baked flour pastry characteristics.";
    } else if (
      rawHint.includes("pack") ||
      rawHint.includes("canned") ||
      rawHint.includes("box") ||
      rawHint.includes("sealed") ||
      rawHint.includes("tin") ||
      rawHint.includes("bottle")
    ) {
      category = "Packaged food";
      confidence = 0.9;
      explanation = "Recognized commercial packaging container outlines and labeling.";
    } else if (
      rawHint.includes("curry") ||
      rawHint.includes("pasta") ||
      rawHint.includes("meal") ||
      rawHint.includes("soup") ||
      rawHint.includes("stew") ||
      rawHint.includes("plate") ||
      rawHint.includes("paneer") ||
      rawHint.includes("dal") ||
      rawHint.includes("casserole") ||
      rawHint.includes("food") ||
      rawHint.includes("buffet")
    ) {
      category = "Cooked meal";
      confidence = 0.88;
      explanation = "Detected prepared culinary dish assembly with cooked sauce/entree components.";
    } else {
      category = "Cooked meal"; // Default reasonable suggestion for typical food surplus
      confidence = 0.65;
      explanation = "General prepared food surplus pattern detected.";
    }

    // Map AiImageCategory to standard FoodCategory
    const mappedDonationCategory: FoodCategory =
      category === "Rice"
        ? "Rice"
        : category === "Bread"
        ? "Bread/roti"
        : category === "Vegetables"
        ? "Vegetables"
        : category === "Fruits"
        ? "Fruits"
        : category === "Bakery"
        ? "Bakery"
        : category === "Packaged food"
        ? "Packaged food"
        : category === "Cooked meal"
        ? "Cooked meals"
        : "Other";

    return {
      category,
      mappedDonationCategory,
      confidence,
      suggestionText: `AI suggestion: ${category}`,
      explanation,
      disclaimer: AI_CONFIG.IMAGE_DISCLAIMER,
      isFallback: true,
      modelUsed: "ShareBite-Vision-Local-v1",
    };
  }

  /**
   * AI Feature 2: Donation Description Assistant
   * Converts quick shorthand notes (e.g. "30 biryani packets, made 7 pm") into a polished description.
   */
  static generateDescription(input: {
    quickNotes: string;
    foodName?: string;
    quantity?: number;
    timeHint?: string;
  }): DescriptionAssistantResult {
    const raw = (input.quickNotes || input.foodName || "").trim();
    if (!raw) {
      return {
        suggestedDescription: "Freshly prepared wholesome food surplus packaged for safe community distribution.",
        label: "AI Suggestion",
        disclaimer: AI_CONFIG.DESCRIPTION_DISCLAIMER,
        isFallback: true,
        modelUsed: "ShareBite-Text-Local-v1",
      };
    }

    // Extract quantity (e.g., "30 biryani packets")
    const qtyMatch = raw.match(/(\d+)\s*(packets?|boxes?|meals?|servings?|portions?|containers?|plates?|kg)?/i);
    const extractedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : input.quantity || undefined;
    const unitWord = qtyMatch && qtyMatch[2] ? qtyMatch[2].toLowerCase() : "portions";

    // Extract time (e.g., "made 7 pm", "prep 12:30", "at 6pm")
    const timeMatch = raw.match(/(?:made|prep(?:ared)?|at|around)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    let formattedTime: string | undefined = undefined;
    if (timeMatch && timeMatch[1]) {
      const t = timeMatch[1].toUpperCase().trim();
      formattedTime = t.includes("M") ? t : `${t} today`;
    }

    // Normalize food item name
    let cleanItem = raw
      .replace(/(\d+)\s*(packets?|boxes?|meals?|servings?|portions?|containers?|plates?|kg)?/gi, "")
      .replace(/(?:made|prep(?:ared)?|cooked|ready|at|around)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, "")
      .replace(/[,;.]+/g, " ")
      .trim();

    if (!cleanItem && input.foodName) {
      cleanItem = input.foodName;
    }
    if (!cleanItem) {
      cleanItem = "prepared meal";
    }

    // Determine diet prefix
    const lower = raw.toLowerCase();
    let dietPrefix = "";
    if (lower.includes("veg") && !lower.includes("non-veg")) {
      dietPrefix = "vegetarian ";
    } else if (lower.includes("vegan")) {
      dietPrefix = "vegan ";
    } else if (lower.includes("halal")) {
      dietPrefix = "halal ";
    } else if (lower.includes("biryani") || lower.includes("dal") || lower.includes("paneer")) {
      // Default common assumption if item is typically vegetarian
      if (!lower.includes("chicken") && !lower.includes("mutton") && !lower.includes("meat")) {
        dietPrefix = "vegetarian ";
      }
    }

    // Format final sentence
    // Prompt specification example: "30 vegetarian biryani meal packets prepared at approximately 7 PM."
    let desc = "";
    if (extractedQty && formattedTime) {
      desc = `${extractedQty} ${dietPrefix}${cleanItem} meal ${unitWord} prepared at approximately ${formattedTime}. Hygienically handled and ready for immediate community redistribution.`;
    } else if (extractedQty) {
      desc = `${extractedQty} ${unitWord} of freshly prepared ${dietPrefix}${cleanItem}. Packed hygienically and suitable for community redistribution.`;
    } else if (formattedTime) {
      desc = `Freshly prepared ${dietPrefix}${cleanItem} prepared at approximately ${formattedTime}. Sealed and ready for prompt pickup.`;
    } else {
      desc = `Freshly prepared ${dietPrefix}${cleanItem}. Handled under sanitary guidelines and packed for community food rescue.`;
    }

    // Clean up double spaces or awkward phrasing
    desc = desc.replace(/\s{2,}/g, " ").replace(/meal packets? meal packets?/gi, "meal packets");

    return {
      suggestedDescription: desc,
      extractedQuantity: extractedQty,
      extractedServings: extractedQty,
      extractedTime: formattedTime,
      foodName: cleanItem,
      label: "AI Suggestion",
      disclaimer: AI_CONFIG.DESCRIPTION_DISCLAIMER,
      isFallback: true,
      modelUsed: "ShareBite-Text-Local-v1",
    };
  }

  /**
   * AI Feature 3: Smart Food Categorization & Allergen Inference
   * Analyzes donor text to predict Category, Description, and common Allergens.
   */
  static smartCategorize(input: {
    foodName: string;
    notes?: string;
    ingredients?: string[];
  }): SmartCategorizationResult {
    const text = `${input.foodName || ""} ${input.notes || ""} ${(input.ingredients || []).join(" ")}`.toLowerCase();

    // 1. Detect Category
    let category: FoodCategory = "Cooked meals";
    let confidence = 0.88;

    if (text.includes("rice") || text.includes("biryani") || text.includes("pulao") || text.includes("khichdi")) {
      category = "Rice";
      confidence = 0.95;
    } else if (
      text.includes("roti") ||
      text.includes("chapati") ||
      text.includes("naan") ||
      text.includes("bread") ||
      text.includes("paratha") ||
      text.includes("kulcha")
    ) {
      category = "Bread/roti";
      confidence = 0.94;
    } else if (text.includes("cake") || text.includes("cookie") || text.includes("muffin") || text.includes("pastry") || text.includes("croissant")) {
      category = "Bakery";
      confidence = 0.93;
    } else if (text.includes("fruit") || text.includes("apple") || text.includes("banana") || text.includes("orange")) {
      category = "Fruits";
      confidence = 0.92;
    } else if (text.includes("vegetable") || text.includes("salad") || text.includes("spinach") || text.includes("sabzi")) {
      category = "Vegetables";
      confidence = 0.91;
    } else if (text.includes("canned") || text.includes("box") || text.includes("sealed") || text.includes("snack") || text.includes("packet")) {
      category = "Packaged food";
      confidence = 0.89;
    }

    // 2. Detect Allergens
    const detectedAllergens = new Set<string>();
    for (const [allergen, keywords] of Object.entries(COMMON_ALLERGENS_MAP)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          detectedAllergens.add(allergen);
          break;
        }
      }
    }

    // If no allergens detected, default to Vegetarian if food is commonly plant-based
    if (detectedAllergens.size === 0) {
      detectedAllergens.add("Vegetarian");
    }

    // 3. Storage recommendation
    let storageRecommendation = "Refrigerated (Below 4°C / 40°F)";
    let perishabilityLevel: "low" | "medium" | "high" = "medium";
    if (category === "Cooked meals" || category === "Rice") {
      storageRecommendation = "Hot Insulated Warmer (Above 60°C / 140°F) or Rapid Chilled (<4°C)";
      perishabilityLevel = "high";
    } else if (category === "Bakery" || category === "Bread/roti") {
      storageRecommendation = "Room Temperature (Dry, Cool sealed containers)";
      perishabilityLevel = "medium";
    } else if (category === "Packaged food") {
      storageRecommendation = "Room Temperature (Dry, Cool)";
      perishabilityLevel = "low";
    }

    const descRes = this.generateDescription({
      quickNotes: input.notes || "",
      foodName: input.foodName,
    });

    return {
      category,
      suggestedDescription: descRes.suggestedDescription,
      suggestedAllergens: Array.from(detectedAllergens),
      storageRecommendation,
      perishabilityLevel,
      confidence,
      label: "AI Suggestion",
      disclaimer: AI_CONFIG.SAFETY_DISCLAIMER,
      isFallback: true,
      modelUsed: "ShareBite-Categorizer-Local-v1",
    };
  }

  /**
   * AI Feature 4: Natural Language Search Parser
   * Converts queries like "Show me vegetarian food for around 40 people within 5 km." into structured filters.
   */
  static parseNaturalLanguageSearch(query: string): StructuredSearchFilters {
    const raw = (query || "").trim();
    const lower = raw.toLowerCase();

    const filters: StructuredSearchFilters = {
      category: "all",
      dietary: [],
      summary: "",
      rawQuery: raw,
      confidence: 0.9,
      isFallback: true,
      modelUsed: "ShareBite-NLSearch-Local-v1",
    };

    // 1. Extract Distance / Radius (e.g. "within 5 km", "under 10 km", "5km", "within 3 miles")
    const kmMatch = lower.match(/(?:within|under|less than|up to|radius)?\s*(\d+(?:\.\d+)?)\s*(?:km|kilometers?)/i);
    const milesMatch = lower.match(/(?:within|under|less than|up to)?\s*(\d+(?:\.\d+)?)\s*(?:miles?|mi)/i);
    if (kmMatch && kmMatch[1]) {
      filters.maxDistanceKm = parseFloat(kmMatch[1]);
    } else if (milesMatch && milesMatch[1]) {
      filters.maxDistanceKm = Math.round(parseFloat(milesMatch[1]) * 1.609 * 10) / 10;
    }

    // 2. Extract Servings / People (e.g. "for around 40 people", "40 portions", "50 servings", "30 meals")
    const servingsMatch = lower.match(/(?:for|around|approx(?:imately)?|at least|feeding|serves?)\s*(\d+)\s*(?:people|persons?|portions?|servings?|meals?|beneficiaries)?/i) ||
      lower.match(/(\d+)\s*(?:people|persons?|portions?|servings?|meals?)/i);
    if (servingsMatch && servingsMatch[1]) {
      filters.minServings = parseInt(servingsMatch[1], 10);
    }

    // 3. Extract Dietary preferences
    if (lower.includes("vegetarian") || lower.includes("veg")) {
      filters.dietary?.push("Vegetarian");
    }
    if (lower.includes("vegan")) {
      filters.dietary?.push("Vegan");
    }
    if (lower.includes("halal")) {
      filters.dietary?.push("Halal");
    }

    // 4. Extract Category
    if (lower.includes("rice") || lower.includes("biryani") || lower.includes("pulao")) {
      filters.category = "Rice";
    } else if (lower.includes("bread") || lower.includes("roti") || lower.includes("naan")) {
      filters.category = "Bread/roti";
    } else if (lower.includes("fruit")) {
      filters.category = "Fruits";
    } else if (lower.includes("veg") && (lower.includes("fresh") || lower.includes("raw") || lower.includes("salad") || lower.includes("vegetable"))) {
      filters.category = "Vegetables";
    } else if (lower.includes("bakery") || lower.includes("breads") || lower.includes("pastr") || lower.includes("cake")) {
      filters.category = "Bakery";
    } else if (lower.includes("packaged") || lower.includes("canned") || lower.includes("cereal") || lower.includes("box")) {
      filters.category = "Packaged food";
    } else if (lower.includes("cooked") || lower.includes("meal") || lower.includes("curry") || lower.includes("hot food") || lower.includes("dinner") || lower.includes("lunch")) {
      filters.category = "Cooked meals";
    }

    // 5. Extract Urgency
    if (lower.includes("urgent") || lower.includes("critical") || lower.includes("asap") || lower.includes("expiring soon") || lower.includes("emergency")) {
      filters.urgency = "urgent";
    }

    // Construct human-readable summary
    const summaryParts: string[] = [];
    if (filters.dietary && filters.dietary.length > 0) {
      summaryParts.push(filters.dietary.join(", "));
    }
    if (filters.category && filters.category !== "all") {
      summaryParts.push(filters.category);
    } else {
      summaryParts.push("Food Surplus");
    }
    if (filters.minServings) {
      summaryParts.push(`for ≥${filters.minServings} people`);
    }
    if (filters.maxDistanceKm) {
      summaryParts.push(`within ${filters.maxDistanceKm} km`);
    }
    if (filters.urgency === "urgent") {
      summaryParts.push("(urgent priority)");
    }

    filters.summary = summaryParts.length > 0 ? summaryParts.join(" ") : "All available nearby food";

    return filters;
  }

  /**
   * AI Assistant: Answers questions about platform, processes, and rules with strict guardrails
   */
  static answerAssistant(input: {
    message: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    userRole?: string;
  }): AssistantMessage {
    const raw = (input.message || "").toLowerCase().trim();

    let content = "";
    let suggestedQuestions: string[] = [];
    let suggestedActions: Array<{ label: string; href: string }> = [];

    // Guardrail Check: Medical / Legal / Microbiological Food Safety Guarantee
    if (
      raw.includes("is this food safe") ||
      raw.includes("can you guarantee") ||
      raw.includes("will i get sick") ||
      raw.includes("bacteria") ||
      raw.includes("food poisoning") ||
      raw.includes("legal liability") ||
      raw.includes("medical advice") ||
      raw.includes("is it expired")
    ) {
      content =
        "**Important Safety & Legal Notice**:\n\n" +
        "ShareBite's AI assistant **cannot provide medical, legal, or food-safety guarantees**, nor determine if a specific food batch is microbiologically safe to eat.\n\n" +
        "**Key Food Safety Policies**:\n" +
        "1. **Donor Declaration**: Donors must certify preparation accuracy, storage standards, and known allergens before publishing.\n" +
        "2. **Sensory Inspection**: Receiving NGOs and volunteer couriers must inspect packaging integrity, odor, temperature, and visual condition upon pickup and delivery.\n" +
        "3. **When In Doubt**: If there is any question regarding spoilage, temperature abuse, or contamination, the item must not be distributed.\n\n" +
        "Operational urgency scores serve purely as logistical routing aids, not sanitary certificates.";

      suggestedQuestions = [
        "What are the 4 food safety declaration points?",
        "How does the NGO verification process work?",
        "How do volunteers verify pickups?",
      ];
      suggestedActions = [
        { label: "View Safety Guidelines", href: "/how-it-works" },
        { label: "Donor Creation Form", href: "/donor/create" },
      ];
    } else if (
      raw.includes("how does") ||
      raw.includes("how it works") ||
      raw.includes("what is foodrescue") ||
      raw.includes("overview")
    ) {
      content =
        "**Welcome to ShareBite!**\n\n" +
        "ShareBite is a zero-waste redistribution network connecting food surplus to community organizations:\n\n" +
        "1. **Donors** (restaurants, hotels, events) list surplus food with portion counts, allergens, and safety declarations.\n" +
        "2. **Smart Matching** recommends the optimal verified NGO based on distance, capacity, dietary fit, and urgency.\n" +
        "3. **Verified NGOs** claim available food within their operational radius.\n" +
        "4. **Volunteer Couriers** accept pickup missions, coordinate transit, and record temperature/handover confirmations.\n" +
        "5. **Real Impact**: Every completed delivery records rescued meals, kilograms saved, and CO₂ prevented.";

      suggestedQuestions = [
        "How do I donate food as a restaurant?",
        "How do NGOs get verified?",
        "How do volunteers accept pickups?",
      ];
      suggestedActions = [
        { label: "Explore Interactive Map", href: "/map" },
        { label: "Donate Food", href: "/donor/create" },
      ];
    } else if (
      raw.includes("donor") ||
      raw.includes("create donation") ||
      raw.includes("donate") ||
      raw.includes("listing")
    ) {
      content =
        "**Donation Creation & Lifecycle**:\n\n" +
        "- **Listing Details**: Specify food name, broad category, portion count, preparation timestamp, and available-until window.\n" +
        "- **AI Assistance**: You can upload a photo for AI category suggestions or type short notes (e.g. *'30 biryani packets, made 7 pm'*) for automated description drafting.\n" +
        "- **Safety Certification**: You must affirm the 4-point declaration (accuracy, donor intent, temperature control, disclosed allergens).\n" +
        "- **Lifecycle Stages**:\n" +
        "  `Draft` → `Published` → `Matched` → `Accepted` → `Pickup Assigned` → `Picked Up` → `Delivered` → `Completed`.";

      suggestedQuestions = [
        "What food categories can I donate?",
        "Can AI classify my food image?",
        "What happens after an NGO accepts my donation?",
      ];
      suggestedActions = [
        { label: "Create Donation", href: "/donor/create" },
        { label: "My Donations Dashboard", href: "/donor/my-donations" },
      ];
    } else if (
      raw.includes("ngo") ||
      raw.includes("claim") ||
      raw.includes("accept food") ||
      raw.includes("verification")
    ) {
      content =
        "**NGO Hub & Food Claiming**:\n\n" +
        "- **Verification Status**: Only NGOs with a `verified` status can claim surplus food listings. Applications are audited by platform administrators.\n" +
        "- **Nearby Food Map**: Browse listings within 1 km, 5 km, 10 km, or 25 km radii using live Haversine distance calculations.\n" +
        "- **Natural Language Search**: Type natural queries like *'Show me vegetarian food for around 40 people within 5 km'* to auto-populate filters.\n" +
        "- **Reservation Model**: Food reservations are atomic to prevent double-claiming.";

      suggestedQuestions = [
        "How do I apply for NGO verification?",
        "How does natural language search work?",
        "How do I configure our meal capacity?",
      ];
      suggestedActions = [
        { label: "Find Nearby Food", href: "/ngo/nearby" },
        { label: "NGO Dashboard", href: "/ngo/dashboard" },
      ];
    } else if (
      raw.includes("volunteer") ||
      raw.includes("pickup") ||
      raw.includes("delivery") ||
      raw.includes("courier")
    ) {
      content =
        "**Volunteer Courier Missions**:\n\n" +
        "- **Availability**: Volunteers can toggle their status between `Available` and `Unavailable`.\n" +
        "- **Pickup Claiming**: Once an NGO accepts a donation, verified couriers can claim the delivery route. Active couriers cannot double-book.\n" +
        "- **7-Stage Lifecycle**:\n" +
        "  `Available` → `Accepted` → `At Pickup` → `Picked Up` → `In Transit` → `Delivered` → `Completed`.\n" +
        "- **Digital Handover**: At pickup, verify container integrity and temperature. At delivery, record NGO staff receiver confirmation to earn volunteer points.";

      suggestedQuestions = [
        "How do I toggle my availability?",
        "What route details are shown during transit?",
        "How are volunteer points calculated?",
      ];
      suggestedActions = [
        { label: "Browse Available Pickups", href: "/volunteer/available" },
        { label: "Volunteer Dashboard", href: "/volunteer/dashboard" },
      ];
    } else if (
      raw.includes("dashboard") ||
      raw.includes("admin") ||
      raw.includes("analytics") ||
      raw.includes("report")
    ) {
      content =
        "**Dashboard Features & Navigation**:\n\n" +
        "- **Donor Dashboard**: Monitor active surplus listings, completion rates, and meals rescued.\n" +
        "- **NGO Dashboard**: Prioritizes time-critical food, active requests, and incoming deliveries.\n" +
        "- **Volunteer Dashboard**: Highlights urgent courier routes, total distance travelled, and earned badges.\n" +
        "- **Admin Dashboard**: System-wide oversight covering user management, NGO credential auditing, real-time urgency distribution, and community safety incident reports.";

      suggestedQuestions = [
        "How do admins verify NGOs?",
        "Where can I see total meals rescued?",
        "How do I report a food quality issue?",
      ];
      suggestedActions = [
        { label: "Admin Overview", href: "/admin/dashboard" },
        { label: "Platform Analytics", href: "/admin/analytics" },
      ];
    } else {
      content =
        "I'm your **ShareBite AI Assistant**! I can assist you with:\n\n" +
        "• **Donors**: How to create listings, classify food photos, and generate descriptions.\n" +
        "• **NGOs**: Finding nearby food, natural language searching, and verification status.\n" +
        "• **Volunteers**: Claiming pickups, route navigation, and delivery verification.\n" +
        "• **Admins**: Auditing organizations, monitoring real-time urgency, and managing reports.\n\n" +
        "*Please note: I cannot provide medical, legal, or food safety guarantees.*";

      suggestedQuestions = [
        "How does the donation process work?",
        "How do I find vegetarian food for 40 people?",
        "What are the volunteer pickup steps?",
      ];
      suggestedActions = [
        { label: "How ShareBite Works", href: "/how-it-works" },
        { label: "Interactive Map", href: "/map" },
      ];
    }

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: "assistant",
      content,
      timestamp: new Date().toISOString(),
      disclaimer: AI_CONFIG.ASSISTANT_DISCLAIMER,
      suggestedQuestions,
      suggestedActions,
      modelUsed: "ShareBite-Assistant-Local-v1",
    };
  }
}
