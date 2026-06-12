export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateCriticalEnvironment } = await import('./lib/startupValidation');
    validateCriticalEnvironment();

    const { prisma } = await import('./lib/prisma');

    // Warm the maintenance-mode cache at startup so the middleware can gate
    // traffic immediately (before any user request hits /api/internal/maintenance).
    try {
      const { updateMaintenanceCache } = await import('./lib/maintenance');
      const row = await prisma.adminSettings.findUnique({
        where: { settingKey: "maintenance_mode" },
      });
      const untilRow = await prisma.adminSettings.findUnique({
        where: { settingKey: "maintenance_until" },
      });
      const enabled = row?.settingValue === "true";
      const until = untilRow?.settingValue ?? null;
      updateMaintenanceCache(enabled, until);
    } catch {
      // Non-fatal: middleware will fall through if cache is empty
    }
    
    // Ensure cleanup on exit during build
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
      const cleanup = async () => {
        await prisma.$disconnect();
      };

      process.on('beforeExit', cleanup);
      process.on('exit', cleanup);
    }
  }
}
