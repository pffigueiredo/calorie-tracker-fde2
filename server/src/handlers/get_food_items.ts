
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type GetFoodItemsInput, type FoodItem } from '../schema';
import { gte, lte, and, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getFoodItems = async (input?: GetFoodItemsInput): Promise<FoodItem[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    // Apply date filters if provided
    if (input?.start_date) {
      const startDate = new Date(input.start_date);
      conditions.push(gte(foodItemsTable.logged_at, startDate));
    }

    if (input?.end_date) {
      const endDate = new Date(input.end_date);
      // Set to end of day for inclusive end date
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(foodItemsTable.logged_at, endDate));
    }

    // Build the final query
    const results = conditions.length === 0
      ? await db.select()
          .from(foodItemsTable)
          .orderBy(desc(foodItemsTable.logged_at))
          .execute()
      : await db.select()
          .from(foodItemsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(foodItemsTable.logged_at))
          .execute();

    // Return results directly - real columns are already the correct types
    return results;
  } catch (error) {
    console.error('Failed to get food items:', error);
    throw error;
  }
};
