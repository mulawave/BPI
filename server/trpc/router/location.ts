import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { 
  getAllCountries, 
  getStatesByCountry, 
  getCitiesByState 
} from "@/lib/locations";

export const locationRouter = createTRPCRouter({
  getCountries: publicProcedure.query(async () => {
    return await getAllCountries();
  }),

  getStates: publicProcedure
    .input(z.object({ countryId: z.number() }))
    .query(async ({ input }) => {
      return await getStatesByCountry(input.countryId);
    }),

  getCities: publicProcedure
    .input(z.object({ stateId: z.number() }))
    .query(async ({ input }) => {
      return await getCitiesByState(input.stateId);
    }),
});
