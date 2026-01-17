import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { promises as fs } from "fs";
import path from "path";
import { requireAdmin } from "../../utils/adminAuth";

export const documentationRouter = createTRPCRouter({
  /**
   * Get document content by file path
   */
  getDocument: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Security: Only admins can access documentation
      try {
        requireAdmin(ctx);
      } catch (error) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required to view documentation",
        });
      }

      try {
        // Construct absolute path from workspace root
        const workspaceRoot = process.cwd();
        const absolutePath = path.join(workspaceRoot, input.filePath);

        // Security: Prevent path traversal attacks
        if (!absolutePath.startsWith(workspaceRoot)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid file path",
          });
        }

        // Read file content
        const content = await fs.readFile(absolutePath, "utf-8");

        // Get file stats
        const stats = await fs.stat(absolutePath);

        return {
          content,
          size: `${Math.round(stats.size / 1024)} KB`,
          lastModified: stats.mtime.toISOString(),
        };
      } catch (error) {
        console.error("Error reading documentation file:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load documentation file",
        });
      }
    }),

  /**
   * List all available documentation files
   */
  listDocuments: protectedProcedure.query(async ({ ctx }) => {
    // Security: Only admins can list documentation
    try {
      requireAdmin(ctx);
    } catch (error) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required to view documentation",
      });
    }

    const workspaceRoot = process.cwd();
    const documentPaths = [
      // Root level
      "/README.md",
      "/ADMIN_HANDOFF.md",
      "/BANK_WITHDRAWAL_IMPLEMENTATION.md",
      "/BPI_Project_Analysis_Report.md",
      "/DATABASE_SEEDER_SETUP.md",
      "/DATABASE_SEEDER_QUICKREF.md",
      "/IMPLEMENTATION_STATUS.md",
      "/IMPLEMENTATION_STATUS_AND_TESTING.md",
      "/MIGRATION.md",
      "/PALLIATIVE_MIGRATION.md",
      "/TESTING_CHECKLIST.md",
      "/YOUTUBE_SETUP.md",
      // Docs folder
      "/docs/admin-dashboard-quickstart.md",
      "/docs/admin-dashboard-technical-spec.md",
      "/docs/admin-settings-requirements.md",
      "/docs/backup-scheduling.md",
      "/docs/corrected-membership-architecture.md",
      "/docs/membership-activation-flow.md",
      "/docs/membership-implementation-plan.md",
      "/docs/progress-snapshot-2025-12-08.md",
      "/docs/receipt-locations-guide.md",
      "/docs/suggestions-improvements.md",
      "/docs/user-flow-db-audit-coverage.md",
      "/docs/vat-settings-addon.md",
      // Prisma
      "/prisma/SEEDER_README.md",
      "/prisma/MIGRATION_GUIDE.md",
      // Membership
      "/membership_docs/BPI Membership Package System.txt",
      "/membership_docs/bpitokenmodel.txt",
    ];

    const documents = await Promise.all(
      documentPaths.map(async (filePath) => {
        try {
          const absolutePath = path.join(workspaceRoot, filePath);
          const stats = await fs.stat(absolutePath);
          return {
            path: filePath,
            exists: true,
            size: `${Math.round(stats.size / 1024)} KB`,
            lastModified: stats.mtime.toISOString(),
          };
        } catch {
          return {
            path: filePath,
            exists: false,
            size: "0 KB",
            lastModified: "",
          };
        }
      })
    );

    return documents.filter(doc => doc.exists);
  }),
});
