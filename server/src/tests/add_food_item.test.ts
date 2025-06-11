
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { type AddFoodItemInput } from '../schema';
import { addFoodItem } from '../handlers/add_food_item';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: AddFoodItemInput = {
  name: 'Apple',
  calories_per_serving: 95,
  servings: 2
};

describe('addFoodItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a food item', async () => {
    const result = await addFoodItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Apple');
    expect(result.calories_per_serving).toEqual(95);
    expect(result.servings).toEqual(2);
    expect(result.total_calories).toEqual(190); // 95 * 2
    expect(result.id).toBeDefined();
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should save food item to database', async () => {
    const result = await addFoodItem(testInput);

    // Query using proper drizzle syntax
    const foodItems = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.id, result.id))
      .execute();

    expect(foodItems).toHaveLength(1);
    expect(foodItems[0].name).toEqual('Apple');
    expect(foodItems[0].calories_per_serving).toEqual(95);
    expect(foodItems[0].servings).toEqual(2);
    expect(foodItems[0].total_calories).toEqual(190);
    expect(foodItems[0].logged_at).toBeInstanceOf(Date);
  });

  it('should calculate total calories correctly', async () => {
    const highCalorieInput: AddFoodItemInput = {
      name: 'Pizza Slice',
      calories_per_serving: 285,
      servings: 3.5
    };

    const result = await addFoodItem(highCalorieInput);

    expect(result.total_calories).toEqual(997.5); // 285 * 3.5
    expect(typeof result.total_calories).toBe('number');
  });

  it('should handle decimal servings', async () => {
    const decimalInput: AddFoodItemInput = {
      name: 'Banana',
      calories_per_serving: 105,
      servings: 0.5
    };

    const result = await addFoodItem(decimalInput);

    expect(result.servings).toEqual(0.5);
    expect(result.total_calories).toEqual(52.5); // 105 * 0.5
    expect(typeof result.servings).toBe('number');
    expect(typeof result.total_calories).toBe('number');
  });

  it('should set logged_at timestamp automatically', async () => {
    const beforeTime = new Date();
    const result = await addFoodItem(testInput);
    const afterTime = new Date();

    expect(result.logged_at).toBeInstanceOf(Date);
    expect(result.logged_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.logged_at.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});
