
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { FoodItem, AddFoodItemInput, DailySummary } from '../../server/src/schema';

function App() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const [formData, setFormData] = useState<AddFoodItemInput>({
    name: '',
    calories_per_serving: 0,
    servings: 1
  });

  const loadFoodItems = useCallback(async () => {
    try {
      const result = await trpc.getFoodItems.query();
      setFoodItems(result);
    } catch (error) {
      console.error('Failed to load food items:', error);
    }
  }, []);

  const loadDailySummary = useCallback(async () => {
    try {
      const result = await trpc.getDailySummary.query();
      setDailySummaries(result);
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    }
  }, []);

  useEffect(() => {
    loadFoodItems();
    loadDailySummary();
  }, [loadFoodItems, loadDailySummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.addFoodItem.mutate(formData);
      setFoodItems((prev: FoodItem[]) => [response, ...prev]);
      setFormData({
        name: '',
        calories_per_serving: 0,
        servings: 1
      });
      // Reload daily summary to reflect changes
      await loadDailySummary();
    } catch (error) {
      console.error('Failed to add food item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteLoading(id);
    try {
      await trpc.deleteFoodItem.mutate(id);
      setFoodItems((prev: FoodItem[]) => prev.filter(item => item.id !== id));
      // Reload daily summary to reflect changes
      await loadDailySummary();
    } catch (error) {
      console.error('Failed to delete food item:', error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const todayTotal = foodItems
    .filter(item => {
      const itemDate = new Date(item.logged_at).toDateString();
      const today = new Date().toDateString();
      return itemDate === today;
    })
    .reduce((sum: number, item: FoodItem) => sum + item.total_calories, 0);

  const todayItems = foodItems.filter(item => {
    const itemDate = new Date(item.logged_at).toDateString();
    const today = new Date().toDateString();
    return itemDate === today;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍎 Calorie Tracker
          </h1>
          <p className="text-gray-600">Track your daily nutrition and reach your goals!</p>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="today">📊 Today</TabsTrigger>
            <TabsTrigger value="add">➕ Add Food</TabsTrigger>
            <TabsTrigger value="history">📈 History</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  🎯 Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">{todayTotal} calories</div>
                <div className="text-blue-100">{todayItems.length} items logged</div>
              </CardContent>
            </Card>

            {todayItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-gray-500 text-lg">No food logged today yet!</p>
                  <p className="text-gray-400">Start tracking your nutrition by adding your first meal.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  🍴 Today's Food Log
                </h3>
                {todayItems.map((item: FoodItem) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-gray-800">{item.name}</h4>
                          <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            <span>🔥 {item.calories_per_serving} cal/serving</span>
                            <span>🥄 {item.servings} servings</span>
                            <span className="text-xs text-gray-400">
                              {new Date(item.logged_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <Badge variant="secondary" className="text-lg font-bold">
                            {item.total_calories} cal
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                                🗑️
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deleteLoading === item.id}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleteLoading === item.id ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  ➕ Add New Food Item
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🍎 Food Name
                    </label>
                    <Input
                      placeholder="e.g., Grilled Chicken Breast, Apple, etc."
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: AddFoodItemInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                      className="text-lg"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔥 Calories per Serving
                      </label>
                      <Input
                        type="number"
                        placeholder="120"
                        value={formData.calories_per_serving || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: AddFoodItemInput) => ({ 
                            ...prev, 
                            calories_per_serving: parseFloat(e.target.value) || 0 
                          }))
                        }
                        min="1"
                        required
                        className="text-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🥄 Number of Servings
                      </label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={formData.servings || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: AddFoodItemInput) => ({ 
                            ...prev, 
                            servings: parseFloat(e.target.value) || 1 
                          }))
                        }
                        min="0.1"
                        step="0.1"
                        required
                        className="text-lg"
                      />
                    </div>
                  </div>

                  {formData.calories_per_serving > 0 && formData.servings > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-center">
                        <span className="text-sm text-green-700">Total Calories:</span>
                        <div className="text-2xl font-bold text-green-800">
                          {(formData.calories_per_serving * formData.servings).toFixed(0)} calories
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full text-lg py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    {isLoading ? '⏳ Adding...' : '✅ Add Food Item'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  📈 Daily Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailySummaries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-500">No data available yet.</p>
                    <p className="text-gray-400">Start logging food to see your daily summaries!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailySummaries.map((summary: DailySummary) => (
                      <div key={summary.date} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold text-gray-800">
                            {new Date(summary.date).toLocaleDateString([], {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-600">{summary.items_count} items logged</div>
                        </div>
                        <Badge variant="outline" className="text-lg font-bold">
                          {summary.total_calories} cal
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  📝 All Food Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {foodItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🍽️</div>
                    <p className="text-gray-500">No food items logged yet.</p>
                    <p className="text-gray-400">Start tracking your nutrition by adding your first meal!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {foodItems.map((item: FoodItem) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.servings} × {item.calories_per_serving} cal/serving
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(item.logged_at).toLocaleDateString()} at{' '}
                            {new Date(item.logged_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-bold">
                            {item.total_calories} cal
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                                🗑️
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deleteLoading === item.id}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleteLoading === item.id ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
