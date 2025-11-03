export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  nameTurkish?: string;
  portion: string;
  nutrition: NutritionInfo;
  category: string;
}

export interface MealEntry {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  timestamp: Date;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface DailyLog {
  date: string;
  meals: MealEntry[];
  totalNutrition: NutritionInfo;
  waterIntake: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: "male" | "female" | "other";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goals: UserGoals;
}

export interface UserGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailyWater: number;
  weightGoal?: number;
  goalType?: "lose" | "maintain" | "gain";
}
