
import { z } from 'zod';

// Food item schema
export const foodItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  calories_per_serving: z.number(),
  servings: z.number(),
  total_calories: z.number(),
  logged_at: z.coerce.date()
});

export type FoodItem = z.infer<typeof foodItemSchema>;

// Input schema for adding food items
export const addFoodItemInputSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  calories_per_serving: z.number().positive("Calories per serving must be positive"),
  servings: z.number().positive("Servings must be positive")
});

export type AddFoodItemInput = z.infer<typeof addFoodItemInputSchema>;

// Query schema for getting food items by date range
export const getFoodItemsInputSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional()
}).optional();

export type GetFoodItemsInput = z.infer<typeof getFoodItemsInputSchema>;

// Daily summary schema
export const dailySummarySchema = z.object({
  date: z.string(),
  total_calories: z.number(),
  items_count: z.number()
});

export type DailySummary = z.infer<typeof dailySummarySchema>;
