
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type AddFoodItemInput, type FoodItem } from '../schema';

export const addFoodItem = async (input: AddFoodItemInput): Promise<FoodItem> => {
  try {
    // Calculate total calories
    const total_calories = input.calories_per_serving * input.servings;

    // Insert food item record
    const result = await db.insert(foodItemsTable)
      .values({
        name: input.name,
        calories_per_serving: input.calories_per_serving,
        servings: input.servings,
        total_calories: total_calories
      })
      .returning()
      .execute();

    // Return the created food item
    const foodItem = result[0];
    return {
      ...foodItem,
      // Note: real columns are already numbers, no conversion needed
      calories_per_serving: foodItem.calories_per_serving,
      servings: foodItem.servings,
      total_calories: foodItem.total_calories
    };
  } catch (error) {
    console.error('Food item creation failed:', error);
    throw error;
  }
};
