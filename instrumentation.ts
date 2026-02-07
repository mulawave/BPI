export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { prisma } = await import('./lib/prisma');
    
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
