
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodItemsTable } from '../db/schema';
import { deleteFoodItem } from '../handlers/delete_food_item';
import { eq } from 'drizzle-orm';

describe('deleteFoodItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a food item and return the deleted item', async () => {
    // Create a food item first
    const insertResult = await db.insert(foodItemsTable)
      .values({
        name: 'Test Food',
        calories_per_serving: 150,
        servings: 2,
        total_calories: 300
      })
      .returning()
      .execute();

    const createdItem = insertResult[0];

    // Delete the food item
    const result = await deleteFoodItem(createdItem.id);

    // Verify the returned data
    expect(result.id).toEqual(createdItem.id);
    expect(result.name).toEqual('Test Food');
    expect(result.calories_per_serving).toEqual(150);
    expect(result.servings).toEqual(2);
    expect(result.total_calories).toEqual(300);
    expect(result.logged_at).toBeInstanceOf(Date);
  });

  it('should remove the food item from the database', async () => {
    // Create a food item first
    const insertResult = await db.insert(foodItemsTable)
      .values({
        name: 'Test Food',
        calories_per_serving: 100,
        servings: 1,
        total_calories: 100
      })
      .returning()
      .execute();

    const createdItem = insertResult[0];

    // Delete the food item
    await deleteFoodItem(createdItem.id);

    // Verify the item is removed from database
    const remainingItems = await db.select()
      .from(foodItemsTable)
      .where(eq(foodItemsTable.id, createdItem.id))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should throw error when food item does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteFoodItem(nonExistentId))
      .rejects.toThrow(/food item with id 999 not found/i);
  });

  it('should verify numeric field types are correct', async () => {
    // Create a food item with decimal values
    const insertResult = await db.insert(foodItemsTable)
      .values({
        name: 'Decimal Food',
        calories_per_serving: 123.45,
        servings: 1.5,
        total_calories: 185.175
      })
      .returning()
      .execute();

    const createdItem = insertResult[0];

    // Delete and verify numeric types
    const result = await deleteFoodItem(createdItem.id);

    expect(typeof result.calories_per_serving).toBe('number');
    expect(typeof result.servings).toBe('number');
    expect(typeof result.total_calories).toBe('number');
    expect(result.calories_per_serving).toEqual(123.45);
    expect(result.servings).toEqual(1.5);
    expect(result.total_calories).toEqual(185.175);
  });
});
