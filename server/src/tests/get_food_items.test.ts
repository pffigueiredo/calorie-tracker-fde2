
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type GetFoodItemsInput } from '../schema';
import { getFoodItems } from '../handlers/get_food_items';

describe('getFoodItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all food items when no filters provided', async () => {
    // Insert test data with explicit timestamps to ensure deterministic ordering
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000); // 1 second earlier

    await db.insert(foodItemsTable).values([
      {
        name: 'Apple',
        calories_per_serving: 80,
        servings: 1,
        total_calories: 80,
        logged_at: earlier
      },
      {
        name: 'Banana',
        calories_per_serving: 105,
        servings: 2,
        total_calories: 210,
        logged_at: now
      }
    ]).execute();

    const result = await getFoodItems();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Banana'); // Should be first due to desc order
    expect(result[1].name).toEqual('Apple');
    expect(result[0].calories_per_serving).toEqual(105);
    expect(result[0].servings).toEqual(2);
    expect(result[0].total_calories).toEqual(210);
    expect(result[0].logged_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no food items exist', async () => {
    const result = await getFoodItems();

    expect(result).toHaveLength(0);
  });

  it('should filter by start date', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const today = new Date();

    // Insert items with specific dates
    await db.insert(foodItemsTable).values([
      {
        name: 'Old Apple',
        calories_per_serving: 80,
        servings: 1,
        total_calories: 80,
        logged_at: yesterday
      },
      {
        name: 'Fresh Banana',
        calories_per_serving: 105,
        servings: 1,
        total_calories: 105,
        logged_at: today
      }
    ]).execute();

    const input: GetFoodItemsInput = {
      start_date: today.toISOString().split('T')[0] // Today's date as YYYY-MM-DD
    };

    const result = await getFoodItems(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Fresh Banana');
  });

  it('should filter by end date', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Insert items with specific dates
    await db.insert(foodItemsTable).values([
      {
        name: 'Yesterday Apple',
        calories_per_serving: 80,
        servings: 1,
        total_calories: 80,
        logged_at: yesterday
      },
      {
        name: 'Tomorrow Banana',
        calories_per_serving: 105,
        servings: 1,
        total_calories: 105,
        logged_at: tomorrow
      }
    ]).execute();

    const input: GetFoodItemsInput = {
      end_date: yesterday.toISOString().split('T')[0] // Yesterday's date as YYYY-MM-DD
    };

    const result = await getFoodItems(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Yesterday Apple');
  });

  it('should filter by date range', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const today = new Date();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Insert items across multiple dates
    await db.insert(foodItemsTable).values([
      {
        name: 'Too Old Apple',
        calories_per_serving: 80,
        servings: 1,
        total_calories: 80,
        logged_at: twoDaysAgo
      },
      {
        name: 'Yesterday Banana',
        calories_per_serving: 105,
        servings: 1,
        total_calories: 105,
        logged_at: yesterday
      },
      {
        name: 'Today Orange',
        calories_per_serving: 60,
        servings: 1,
        total_calories: 60,
        logged_at: today
      },
      {
        name: 'Future Grape',
        calories_per_serving: 30,
        servings: 1,
        total_calories: 30,
        logged_at: tomorrow
      }
    ]).execute();

    const input: GetFoodItemsInput = {
      start_date: yesterday.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    };

    const result = await getFoodItems(input);

    expect(result).toHaveLength(2);
    // Results should be ordered by logged_at desc (most recent first)
    expect(result[0].name).toEqual('Today Orange');
    expect(result[1].name).toEqual('Yesterday Banana');
  });

  it('should handle undefined input gracefully', async () => {
    // Insert test data
    await db.insert(foodItemsTable).values({
      name: 'Test Apple',
      calories_per_serving: 80,
      servings: 1,
      total_calories: 80
    }).execute();

    const result = await getFoodItems(undefined);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Apple');
  });

  it('should return items ordered by logged_at descending', async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    // Insert items with specific times
    await db.insert(foodItemsTable).values([
      {
        name: 'Earlier Item',
        calories_per_serving: 80,
        servings: 1,
        total_calories: 80,
        logged_at: earlier
      },
      {
        name: 'Later Item',
        calories_per_serving: 105,
        servings: 1,
        total_calories: 105,
        logged_at: now
      }
    ]).execute();

    const result = await getFoodItems();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Later Item'); // Most recent first
    expect(result[1].name).toEqual('Earlier Item');
    expect(result[0].logged_at.getTime()).toBeGreaterThan(result[1].logged_at.getTime());
  });
});
