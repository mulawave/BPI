# Admin Dashboard Technical Specification

> **Version**: 1.0  
> **Last Updated**: January 1, 2026  
> **Purpose**: Technical blueprint for BPI Admin Dashboard implementation

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Framework**: ShadCN UI, Tailwind CSS
- **State Management**: tRPC, React Query
- **Backend**: tRPC Routers, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Auth.js (NextAuth)
- **File Storage**: Local filesystem (avatars, payment proofs)

### Directory Structure
```
app/
├── admin/
│   ├── layout.tsx                    # Admin layout with sidebar
│   ├── page.tsx                      # Admin dashboard homepage
│   ├── login/
│   │   └── page.tsx                  # Admin login page
│   ├── users/
│   │   ├── page.tsx                  # User list
│   │   └── [userId]/
│   │       ├── page.tsx              # User details
│   │       └── activate/
│   │           └── page.tsx          # Manual activation
│   ├── payments/
│   │   ├── pending/
│   │   │   └── page.tsx              # Pending verifications
│   │   ├── failed/
│   │   │   └── page.tsx              # Failed payments
│   │   └── analytics/
│   │       └── page.tsx              # Payment analytics
│   ├── settings/
│   │   ├── payment-gateways/
│   │   │   └── page.tsx              # Gateway configuration
│   │   ├── general/
│   │   │   └── page.tsx              # General settings
│   │   └── security/
│   │       └── page.tsx              # Security settings
│   ├── reports/
│   │   ├── daily-payments/
│   │   │   └── page.tsx              # Daily summary
│   │   └── transactions/
│   │       └── page.tsx              # Transaction export
│   └── audit/
│       ├── logs/
│       │   └── page.tsx              # Audit log viewer
│       └── manual-activations/
│           └── page.tsx              # Manual activation history

components/
├── admin/
│   ├── AdminSidebar.tsx              # Admin navigation
│   ├── AdminHeader.tsx               # Admin header
│   ├── UserTable.tsx                 # Reusable user table
│   ├── PaymentCard.tsx               # Payment info card
│   ├── MetricCard.tsx                # Dashboard metric card
│   ├── GatewayConfigForm.tsx         # Gateway settings form
│   ├── PaymentProofViewer.tsx        # Image/PDF viewer
│   └── AuditLogTable.tsx             # Audit log table

server/
└── trpc/
    └── router/
        ├── admin.ts                  # Existing admin endpoints
        ├── adminPayments.ts          # NEW: Payment admin endpoints
        ├── adminUsers.ts             # NEW: User admin endpoints
        └── adminReports.ts           # NEW: Reporting endpoints

prisma/
└── schema.prisma
    ├── AdminSettings                 # NEW: System settings
    ├── PaymentGatewayConfig          # NEW: Gateway configs
    ├── AuditLog                      # NEW: Audit trail
    └── PendingPayment                # NEW: Pending verifications
```

---

## 🗄️ Database Schema Extensions

### New Models Required

```prisma
// Admin Settings
model AdminSettings {
  id                    String   @id @default(cuid())
  key                   String   @unique
  value                 Json
  category              String   // "payment", "general", "security", etc.
  description           String?
  updatedBy             String
  updatedAt             DateTime @updatedAt
  admin                 User     @relation(fields: [updatedBy], references: [id])
}

// Payment Gateway Configuration
model PaymentGatewayConfig {
  id                    String   @id @default(cuid())
  gateway               String   @unique  // "paystack", "flutterwave", etc.
  enabled               Boolean  @default(false)
  mode                  String   @default("test")  // "test" or "live"
  publicKey             String?  // Encrypted
  secretKey             String?  // Encrypted
  encryptionKey         String?  // For Flutterwave
  webhookSecret         String?  // Encrypted
  config                Json?    // Additional config
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  updatedBy             String
  admin                 User     @relation(fields: [updatedBy], references: [id])
}

// Audit Log
model AuditLog {
  id                    String   @id @default(cuid())
  adminId               String
  action                String   // "MANUAL_ACTIVATION", "PAYMENT_APPROVAL", etc.
  targetUserId          String?
  targetType            String?  // "user", "payment", "package", etc.
  targetId              String?
  details               Json
  ipAddress             String?
  userAgent             String?
  createdAt             DateTime @default(now())
  admin                 User     @relation(fields: [adminId], references: [id])
  targetUser            User?    @relation("AuditLogTarget", fields: [targetUserId], references: [id])
}

// Pending Payment Verification
model PendingPayment {
  id                    String   @id @default(cuid())
  userId                String
  packageId             String
  amount                Float
  gateway               String   // "bank_transfer", "crypto", etc.
  paymentProof          String?  // File path
  paymentReference      String?
  status                String   @default("pending")  // "pending", "approved", "rejected"
  verifiedBy            String?
  verificationReason    String?
  createdAt             DateTime @default(now())
  verifiedAt            DateTime?
  user                  User     @relation(fields: [userId], references: [id])
  package               MembershipPackage @relation(fields: [packageId], references: [id])
  verifier              User?    @relation("PaymentVerifier", fields: [verifiedBy], references: [id])
}

// Update User model
model User {
  // ... existing fields ...
  role                  String   @default("user")  // "user", "admin", "super_admin"
  
  // Relations
  adminSettings         AdminSettings[]
  gatewayConfigs        PaymentGatewayConfig[]
  auditLogs             AuditLog[]
  auditLogsAsTarget     AuditLog[] @relation("AuditLogTarget")
  pendingPayments       PendingPayment[]
  verifiedPayments      PendingPayment[] @relation("PaymentVerifier")
}
```

---

## 🔌 API Endpoints Specification

### Admin Authentication

#### `server/trpc/router/adminAuth.ts` (NEW)

```typescript
export const adminAuthRouter = createTRPCRouter({
  // Check if user is admin
  checkAdminAccess: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true }
      });
      
      return {
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
        role: user?.role
      };
    }),

  // Get admin profile
  getAdminProfile: protectedProcedure
    .query(async ({ ctx }) => {
      // Verify admin role
      if (!isAdmin(ctx.session.user)) {
        throw new Error("UNAUTHORIZED");
      }
      
      return await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true
        }
      });
    })
});
```

### Payment Gateway Management

#### `server/trpc/router/adminPayments.ts` (NEW)

```typescript
export const adminPaymentsRouter = createTRPCRouter({
  // Get gateway configuration
  getGatewayConfig: protectedProcedure
    .input(z.object({
      gateway: z.enum(['paystack', 'flutterwave', 'bank_transfer', 'crypto'])
    }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const config = await ctx.prisma.paymentGatewayConfig.findUnique({
        where: { gateway: input.gateway },
        select: {
          id: true,
          gateway: true,
          enabled: true,
          mode: true,
          // Don't return encrypted keys
          config: true,
          updatedAt: true
        }
      });
      
      return config;
    }),

  // Update gateway configuration
  updateGatewayConfig: protectedProcedure
    .input(z.object({
      gateway: z.enum(['paystack', 'flutterwave', 'bank_transfer', 'crypto']),
      enabled: z.boolean().optional(),
      mode: z.enum(['test', 'live']).optional(),
      publicKey: z.string().optional(),
      secretKey: z.string().optional(),
      encryptionKey: z.string().optional(),
      webhookSecret: z.string().optional(),
      config: z.any().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const { gateway, ...updateData } = input;
      
      // Encrypt sensitive keys before storing
      if (updateData.publicKey) {
        updateData.publicKey = encrypt(updateData.publicKey);
      }
      if (updateData.secretKey) {
        updateData.secretKey = encrypt(updateData.secretKey);
      }
      if (updateData.encryptionKey) {
        updateData.encryptionKey = encrypt(updateData.encryptionKey);
      }
      if (updateData.webhookSecret) {
        updateData.webhookSecret = encrypt(updateData.webhookSecret);
      }
      
      const config = await ctx.prisma.paymentGatewayConfig.upsert({
        where: { gateway },
        create: {
          gateway,
          ...updateData,
          updatedBy: ctx.session.user.id
        },
        update: {
          ...updateData,
          updatedBy: ctx.session.user.id
        }
      });
      
      // Create audit log
      await createAuditLog(ctx, {
        action: 'GATEWAY_CONFIG_UPDATE',
        details: { gateway, fieldsUpdated: Object.keys(updateData) }
      });
      
      return { success: true };
    }),

  // Get pending payments for verification
  getPendingPayments: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      gateway: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const where = {
        status: 'pending',
        ...(input.gateway && { gateway: input.gateway })
      };
      
      const [payments, total] = await Promise.all([
        ctx.prisma.pendingPayment.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                mobile: true
              }
            },
            package: {
              select: {
                id: true,
                name: true,
                price: true,
                vat: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit
        }),
        ctx.prisma.pendingPayment.count({ where })
      ]);
      
      return {
        payments,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit)
      };
    }),

  // Approve payment
  approvePayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const payment = await ctx.prisma.pendingPayment.findUnique({
        where: { id: input.paymentId },
        include: {
          user: true,
          package: true
        }
      });
      
      if (!payment) {
        throw new Error("Payment not found");
      }
      
      if (payment.status !== 'pending') {
        throw new Error("Payment already processed");
      }
      
      // Update payment status
      await ctx.prisma.pendingPayment.update({
        where: { id: input.paymentId },
        data: {
          status: 'approved',
          verifiedBy: ctx.session.user.id,
          verifiedAt: new Date(),
          verificationReason: input.reason
        }
      });
      
      // Activate membership (reuse existing logic)
      await activateMembership(payment.userId, payment.packageId, ctx.prisma);
      
      // Create audit log
      await createAuditLog(ctx, {
        action: 'PAYMENT_APPROVED',
        targetUserId: payment.userId,
        details: {
          paymentId: payment.id,
          packageId: payment.packageId,
          amount: payment.amount,
          reason: input.reason
        }
      });
      
      // Send notification to user
      await notifyPaymentApproved(payment.userId, payment.package.name);
      
      return { success: true };
    }),

  // Reject payment
  rejectPayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      reason: z.string().min(10)
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const payment = await ctx.prisma.pendingPayment.findUnique({
        where: { id: input.paymentId },
        include: { user: true }
      });
      
      if (!payment) {
        throw new Error("Payment not found");
      }
      
      await ctx.prisma.pendingPayment.update({
        where: { id: input.paymentId },
        data: {
          status: 'rejected',
          verifiedBy: ctx.session.user.id,
          verifiedAt: new Date(),
          verificationReason: input.reason
        }
      });
      
      // Create audit log
      await createAuditLog(ctx, {
        action: 'PAYMENT_REJECTED',
        targetUserId: payment.userId,
        details: {
          paymentId: payment.id,
          reason: input.reason
        }
      });
      
      // Send notification to user
      await notifyPaymentRejected(payment.userId, input.reason);
      
      return { success: true };
    }),

  // Get payment analytics
  getPaymentAnalytics: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          transactionType: 'MEMBERSHIP_ACTIVATION',
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        },
        select: {
          amount: true,
          status: true,
          createdAt: true
        }
      });
      
      const successful = transactions.filter(t => t.status === 'completed');
      const failed = transactions.filter(t => t.status === 'failed');
      
      return {
        totalTransactions: transactions.length,
        successfulTransactions: successful.length,
        failedTransactions: failed.length,
        totalVolume: successful.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        successRate: transactions.length > 0 
          ? (successful.length / transactions.length * 100).toFixed(2)
          : 0
      };
    })
});
```

### User Management

#### `server/trpc/router/adminUsers.ts` (NEW)

```typescript
export const adminUsersRouter = createTRPCRouter({
  // Get all users (paginated)
  getAllUsers: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      search: z.string().optional(),
      packageId: z.string().optional(),
      status: z.enum(['active', 'suspended', 'all']).optional()
    }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const where: any = {};
      
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } }
        ];
      }
      
      if (input.packageId) {
        where.activeMembershipPackageId = input.packageId;
      }
      
      if (input.status !== 'all') {
        where.activated = input.status === 'active';
      }
      
      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            activated: true,
            emailVerified: true,
            membershipActivatedAt: true,
            membershipExpiresAt: true,
            wallet: true,
            createdAt: true,
            activeMembershipPackage: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit
        }),
        ctx.prisma.user.count({ where })
      ]);
      
      return {
        users,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit)
      };
    }),

  // Get user details
  getUserDetails: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          activeMembershipPackage: true,
          transactions: {
            take: 20,
            orderBy: { createdAt: 'desc' }
          },
          referredBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      return user;
    }),

  // Manual membership activation
  manualActivation: protectedProcedure
    .input(z.object({
      userId: z.string(),
      packageId: z.string(),
      bypassPayment: z.boolean().default(false),
      distributeBonuses: z.boolean().default(true),
      reason: z.string().min(20)
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId }
      });
      
      const package_ = await ctx.prisma.membershipPackage.findUnique({
        where: { id: input.packageId }
      });
      
      if (!user || !package_) {
        throw new Error("User or package not found");
      }
      
      // Activate membership
      const activatedAt = new Date();
      const expiresAt = new Date(activatedAt);
      expiresAt.setDate(expiresAt.getDate() + 365);
      
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          activeMembershipPackageId: input.packageId,
          membershipActivatedAt: activatedAt,
          membershipExpiresAt: expiresAt,
          activated: true
        }
      });
      
      // Distribute bonuses if requested
      if (input.distributeBonuses) {
        await distributeReferralBonuses(input.userId, input.packageId, ctx.prisma);
      }
      
      // Create audit log
      await createAuditLog(ctx, {
        action: 'MANUAL_ACTIVATION',
        targetUserId: input.userId,
        details: {
          packageId: input.packageId,
          bypassPayment: input.bypassPayment,
          distributeBonuses: input.distributeBonuses,
          reason: input.reason
        }
      });
      
      // Send notification
      await notifyManualActivation(input.userId, package_.name);
      
      return { success: true };
    }),

  // Suspend/activate user
  toggleUserStatus: protectedProcedure
    .input(z.object({
      userId: z.string(),
      activate: z.boolean(),
      reason: z.string().min(10)
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { activated: input.activate }
      });
      
      // Create audit log
      await createAuditLog(ctx, {
        action: input.activate ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
        targetUserId: input.userId,
        details: { reason: input.reason }
      });
      
      // Send notification
      await notifyAccountStatusChange(input.userId, input.activate, input.reason);
      
      return { success: true };
    })
});
```

---

## 🎨 UI Component Specifications

### Admin Layout Component

```typescript
// components/admin/AdminLayout.tsx

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: adminProfile } = api.adminAuth.getAdminProfile.useQuery();
  const router = useRouter();

  if (!adminProfile) {
    router.push('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      
      <div className="lg:pl-64">
        <AdminHeader profile={adminProfile} />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Payment Verification Component

```typescript
// components/admin/PaymentVerificationCard.tsx

export function PaymentVerificationCard({ payment }: { payment: PendingPayment }) {
  const approvePayment = api.adminPayments.approvePayment.useMutation();
  const rejectPayment = api.adminPayments.rejectPayment.useMutation();
  const [showProof, setShowProof] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = async () => {
    if (!confirm(`Approve payment for ${payment.user.name}?`)) return;
    
    await approvePayment.mutateAsync({
      paymentId: payment.id,
      reason: 'Payment verified by admin'
    });
  };

  const handleReject = async () => {
    if (!rejectReason || rejectReason.length < 10) {
      alert('Please provide a detailed reason for rejection');
      return;
    }
    
    await rejectPayment.mutateAsync({
      paymentId: payment.id,
      reason: rejectReason
    });
    
    setShowRejectDialog(false);
    setRejectReason('');
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{payment.user.name}</h3>
          <p className="text-sm text-gray-500">{payment.user.email}</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Package:</span>
              <span className="font-medium">{payment.package.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">₦{payment.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gateway:</span>
              <span className="font-medium capitalize">{payment.gateway}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Submitted:</span>
              <span className="font-medium">
                {formatDistanceToNow(payment.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="ml-4">
          {payment.paymentProof && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProof(true)}
            >
              View Proof
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex gap-3">
        <Button
          onClick={handleApprove}
          disabled={approvePayment.isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {approvePayment.isLoading ? 'Approving...' : 'Approve'}
        </Button>
        
        <Button
          onClick={() => setShowRejectDialog(true)}
          disabled={rejectPayment.isLoading}
          variant="destructive"
          className="flex-1"
        >
          Reject
        </Button>
      </div>
      
      {/* Payment Proof Modal */}
      {showProof && (
        <PaymentProofViewer
          proofUrl={payment.paymentProof!}
          onClose={() => setShowProof(false)}
        />
      )}
      
      {/* Reject Reason Dialog */}
      {showRejectDialog && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Payment</DialogTitle>
            </DialogHeader>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide detailed reason for rejection..."
              className="w-full h-32 p-3 border rounded-lg"
              required
            />
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectReason.length < 10}
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
```

---

## 🔒 Security Implementation

### Helper Functions

```typescript
// server/utils/adminAuth.ts

export function requireAdmin(ctx: any) {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  
  const user = ctx.session.user as any;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new Error("FORBIDDEN - Admin access required");
  }
}

export function requireSuperAdmin(ctx: any) {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  
  const user = ctx.session.user as any;
  if (user.role !== 'super_admin') {
    throw new Error("FORBIDDEN - Super admin access required");
  }
}

export function isAdmin(user: any): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}
```

### Encryption Utilities

```typescript
// server/utils/encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // Must be 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Audit Logging

```typescript
// server/utils/audit.ts

export async function createAuditLog(
  ctx: any,
  data: {
    action: string;
    targetUserId?: string;
    targetType?: string;
    targetId?: string;
    details: any;
  }
) {
  return await ctx.prisma.auditLog.create({
    data: {
      adminId: ctx.session.user.id,
      ipAddress: ctx.req?.headers['x-forwarded-for'] || ctx.req?.socket.remoteAddress,
      userAgent: ctx.req?.headers['user-agent'],
      ...data
    }
  });
}
```

---

## 📝 Environment Variables

```bash
# Admin Authentication
ADMIN_SECRET_KEY="your-admin-secret-key-here"

# Encryption
ENCRYPTION_KEY="64-character-hex-string-here"  # 32 bytes

# Payment Gateways
PAYSTACK_PUBLIC_KEY="pk_test_xxxx"
PAYSTACK_SECRET_KEY="sk_test_xxxx"
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-xxxx"
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-xxxx"
FLUTTERWAVE_ENCRYPTION_KEY="FLWSECK_TESTxxxx"

# Webhook URLs (auto-configured in production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

**Status**: Ready for implementation  
**Next Steps**: Begin with Phase 1 (Admin Authentication & Layout)  
**Timeline**: 10-14 working days for MVP
