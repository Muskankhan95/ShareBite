import { FoodCategory } from "@/types/donation";

export type AiImageCategory =
  | "Rice"
  | "Bread"
  | "Vegetables"
  | "Fruits"
  | "Cooked meal"
  | "Bakery"
  | "Packaged food"
  | "Unknown";

export interface ImageClassificationResult {
  category: AiImageCategory;
  mappedDonationCategory: FoodCategory;
  confidence: number;
  suggestionText: string; // e.g. "AI suggestion: Cooked meal"
  explanation: string;
  disclaimer: string;
  isFallback: boolean;
  modelUsed: string;
}

export interface DescriptionAssistantResult {
  suggestedDescription: string;
  extractedQuantity?: number;
  extractedServings?: number;
  extractedTime?: string;
  foodName?: string;
  label: string;
  disclaimer: string;
  isFallback: boolean;
  modelUsed: string;
}

export interface SmartCategorizationResult {
  category: FoodCategory;
  suggestedDescription: string;
  suggestedAllergens: string[];
  storageRecommendation?: string;
  perishabilityLevel?: "low" | "medium" | "high";
  confidence: number;
  label: string;
  disclaimer: string;
  isFallback: boolean;
  modelUsed: string;
}

export interface StructuredSearchFilters {
  category?: string; // "all" or specific FoodCategory
  minServings?: number;
  maxDistanceKm?: number;
  dietary?: string[]; // e.g. ["Vegetarian", "Vegan", "Halal"]
  urgency?: "urgent" | "standard" | "all";
  maxHoursRemaining?: number;
  keywords?: string[];
  summary: string;
  rawQuery: string;
  confidence: number;
  isFallback: boolean;
  modelUsed: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  disclaimer?: string;
  suggestedQuestions?: string[];
  suggestedActions?: Array<{ label: string; href: string }>;
  modelUsed?: string;
}
