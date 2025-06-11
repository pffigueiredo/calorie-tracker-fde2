
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type FoodItem } from '../schema';

export const deleteFoodItem = async (id: number): Promise<FoodItem> => {
  try {
    // Delete the food item and return the deleted record
    const result = await db.delete(foodItemsTable)
      .where(eq(foodItemsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Food item with ID ${id} not found`);
    }

    // No numeric conversion needed for real columns - they maintain their numeric type
    const deletedItem = result[0];
    return {
      id: deletedItem.id,
      name: deletedItem.name,
      calories_per_serving: deletedItem.calories_per_serving,
      servings: deletedItem.servings,
      total_calories: deletedItem.total_calories,
      logged_at: deletedItem.logged_at
    };
  } catch (error) {
    console.error('Food item deletion failed:', error);
    throw error;
  }
};
