
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type DailySummary } from '../schema';
import { sql } from 'drizzle-orm';

export const getDailySummary = async (): Promise<DailySummary[]> => {
  try {
    // Query to group by date and calculate daily totals
    const results = await db
      .select({
        date: sql<string>`DATE(${foodItemsTable.logged_at})`.as('date'),
        total_calories: sql<number>`SUM(${foodItemsTable.total_calories})`.as('total_calories'),
        items_count: sql<number>`COUNT(*)`.as('items_count')
      })
      .from(foodItemsTable)
      .groupBy(sql`DATE(${foodItemsTable.logged_at})`)
      .orderBy(sql`DATE(${foodItemsTable.logged_at}) DESC`)
      .execute();

    // Convert results to proper types
    return results.map(result => ({
      date: result.date,
      total_calories: Number(result.total_calories),
      items_count: Number(result.items_count)
    }));
  } catch (error) {
    console.error('Daily summary retrieval failed:', error);
    throw error;
  }
};
