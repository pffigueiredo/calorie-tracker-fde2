
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { getDailySummary } from '../handlers/get_daily_summary';

describe('getDailySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no food items exist', async () => {
    const result = await getDailySummary();
    expect(result).toEqual([]);
  });

  it('should return daily summary for single day', async () => {
    // Create test food items for today
    const today = new Date();
    await db.insert(foodItemsTable).values([
      {
        name: 'Apple',
        calories_per_serving: 80,
        servings: 1,
        total_calories: 80,
        logged_at: today
      },
      {
        name: 'Banana',
        calories_per_serving: 105,
        servings: 2,
        total_calories: 210,
        logged_at: today
      }
    ]).execute();

    const result = await getDailySummary();

    expect(result).toHaveLength(1);
    expect(result[0].total_calories).toEqual(290);
    expect(result[0].items_count).toEqual(2);
    expect(result[0].date).toBeDefined();
  });

  it('should return summaries for multiple days ordered by date descending', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Create food items across multiple days
    await db.insert(foodItemsTable).values([
      // Today - 2 items, 300 calories
      {
        name: 'Lunch',
        calories_per_serving: 150,
        servings: 2,
        total_calories: 300,
        logged_at: today
      },
      // Yesterday - 1 item, 200 calories
      {
        name: 'Dinner',
        calories_per_serving: 200,
        servings: 1,
        total_calories: 200,
        logged_at: yesterday
      },
      // Two days ago - 3 items, 450 calories
      {
        name: 'Breakfast',
        calories_per_serving: 100,
        servings: 1,
        total_calories: 100,
        logged_at: twoDaysAgo
      },
      {
        name: 'Snack',
        calories_per_serving: 175,
        servings: 2,
        total_calories: 350,
        logged_at: twoDaysAgo
      }
    ]).execute();

    const result = await getDailySummary();

    expect(result).toHaveLength(3);
    
    // Should be ordered by date descending (most recent first)
    expect(result[0].total_calories).toEqual(300); // Today
    expect(result[0].items_count).toEqual(1);
    
    expect(result[1].total_calories).toEqual(200); // Yesterday
    expect(result[1].items_count).toEqual(1);
    
    expect(result[2].total_calories).toEqual(450); // Two days ago
    expect(result[2].items_count).toEqual(2);

    // Verify dates are in descending order
    expect(result[0].date > result[1].date).toBe(true);
    expect(result[1].date > result[2].date).toBe(true);
  });

  it('should handle fractional calories correctly', async () => {
    const today = new Date();
    await db.insert(foodItemsTable).values({
      name: 'Half Portion',
      calories_per_serving: 150.5,
      servings: 1.5,
      total_calories: 225.75,
      logged_at: today
    }).execute();

    const result = await getDailySummary();

    expect(result).toHaveLength(1);
    expect(result[0].total_calories).toEqual(225.75);
    expect(result[0].items_count).toEqual(1);
  });
});
