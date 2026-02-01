import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return new NextResponse(
        `<html><body><script>
          alert("Invalid impersonation token");
          window.close();
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Verify the impersonation token
    const impToken = await prisma.impersonationToken.findUnique({
      where: { token },
      include: {
        Admin: { select: { id: true, email: true, role: true } },
        TargetUser: { 
          select: { 
            id: true, 
            email: true, 
            name: true, 
            role: true,
            firstname: true,
            lastname: true,
          } 
        },
      },
    });

    if (!impToken) {
      return new NextResponse(
        `<html><body><script>
          alert("Invalid impersonation token");
          window.close();
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (impToken.used) {
      return new NextResponse(
        `<html><body><script>
          alert("Token already used");
          window.close();
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (new Date() > impToken.expiresAt) {
      return new NextResponse(
        `<html><body><script>
          alert("Token expired");
          window.close();
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Mark token as used
    await prisma.impersonationToken.update({
      where: { id: impToken.id },
      data: { used: true, usedAt: new Date() },
    });

    // Create JWT token for the target user with impersonation flag
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const jwtToken = await new SignJWT({
      id: impToken.TargetUser.id,
      email: impToken.TargetUser.email,
      name: impToken.TargetUser.name || 
            [impToken.TargetUser.firstname, impToken.TargetUser.lastname].filter(Boolean).join(" "),
      role: impToken.TargetUser.role,
      impersonatedBy: impToken.Admin.id,
      impersonatedByEmail: impToken.Admin.email,
      isImpersonation: true,
      hasActiveMembership: false,
      hasActiveEmpowerment: false,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("4h")
      .sign(secret);

    // Log successful impersonation
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: impToken.adminId,
        action: "ADMIN_IMPERSONATION_LOGIN",
        entity: "User",
        entityId: impToken.targetUserId,
        status: "success",
        metadata: {
          targetUserEmail: impToken.TargetUser.email,
          targetUserName: impToken.TargetUser.name,
          impersonatedBy: impToken.Admin.email,
        },
      },
    });

    // Set the impersonation session cookie SERVER-SIDE before redirect
    // This ensures the new window gets the correct session from the start
    const cookieStore = cookies();
    const sessionTokenName = process.env.NODE_ENV === "production" 
      ? "__Secure-next-auth.session-token" 
      : "next-auth.session-token";
    
    const maxAge = 4 * 60 * 60; // 4 hours
    
    // Clear any existing session first
    cookieStore.set(sessionTokenName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    
    // Set new impersonation session
    cookieStore.set(sessionTokenName, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    
    const dashboardUrl = new URL("/dashboard", req.url);
    
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Logging in as ${impToken.TargetUser.email}...</title>
  <meta http-equiv="refresh" content="1;url=${dashboardUrl.toString()}">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 1rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1rem;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    p { margin: 0; opacity: 0.9; font-size: 0.9rem; }
    .info { margin-top: 1rem; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 0.5rem; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Logging in as user...</h1>
    <p><strong>${impToken.TargetUser.email}</strong></p>
    <p class="info">🔐 Impersonated by: ${impToken.Admin.email}</p>
  </div>
  <script>
    // Redirect to dashboard after brief delay
    setTimeout(() => {
      window.location.href = ${JSON.stringify(dashboardUrl.toString())};
    }, 1000);
  </script>
</body>
</html>`,
      { 
        headers: { 
          "Content-Type": "text/html",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        } 
      }
    );
  } catch (error: any) {
    console.error("Impersonation error:", error);
    return new NextResponse(
      `<html><body><script>
        alert("Failed to impersonate user: ${error.message}");
        window.close();
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify the impersonation token
    const impToken = await prisma.impersonationToken.findUnique({
      where: { token },
      include: {
        Admin: { select: { id: true, email: true, role: true } },
        TargetUser: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    if (!impToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (impToken.used) {
      return NextResponse.json({ error: "Token already used" }, { status: 401 });
    }

    if (new Date() > impToken.expiresAt) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Verify the requesting admin session
    const session = await getServerSession(authConfig);
    if (!session?.user || (session.user as any).id !== impToken.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark token as used
    await prisma.impersonationToken.update({
      where: { id: impToken.id },
      data: { used: true, usedAt: new Date() },
    });

    // Create JWT token for the target user with impersonation flag
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const impersonationToken = await new SignJWT({
      id: impToken.TargetUser.id,
      email: impToken.TargetUser.email,
      name: impToken.TargetUser.name,
      role: impToken.TargetUser.role,
      impersonatedBy: impToken.Admin.id,
      impersonatedByEmail: impToken.Admin.email,
      isImpersonation: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("4h")
      .sign(secret);

    // Log successful impersonation
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: impToken.adminId,
        action: "ADMIN_IMPERSONATION_LOGIN",
        entity: "User",
        entityId: impToken.targetUserId,
        status: "success",
        metadata: {
          targetUserEmail: impToken.TargetUser.email,
          targetUserName: impToken.TargetUser.name,
          impersonatedBy: impToken.Admin.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      impersonationToken,
      targetUser: {
        id: impToken.TargetUser.id,
        email: impToken.TargetUser.email,
        name: impToken.TargetUser.name,
      },
    });
  } catch (error: any) {
    console.error("Impersonation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to impersonate user" },
      { status: 500 }
    );
  }
}
