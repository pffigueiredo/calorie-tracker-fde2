
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { addFoodItemInputSchema, getFoodItemsInputSchema } from './schema';
import { addFoodItem } from './handlers/add_food_item';
import { getFoodItems } from './handlers/get_food_items';
import { getDailySummary } from './handlers/get_daily_summary';
import { deleteFoodItem } from './handlers/delete_food_item';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  addFoodItem: publicProcedure
    .input(addFoodItemInputSchema)
    .mutation(({ input }) => addFoodItem(input)),
  getFoodItems: publicProcedure
    .input(getFoodItemsInputSchema)
    .query(({ input }) => getFoodItems(input)),
  getDailySummary: publicProcedure
    .query(() => getDailySummary()),
  deleteFoodItem: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteFoodItem(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
