import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { subDays, isAfter } from "date-fns";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        defaultWorkspace: true,
        memberships: {
          include: { workspace: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resolvedWorkspaceId =
      session.user.workspaceId ??
      user.defaultWorkspaceId ??
      user.memberships[0]?.workspaceId ??
      null;

    if (!resolvedWorkspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Get ALL payments for this workspace
    const allPayments = await prisma.payment.findMany({
      where: { invoice: { workspaceId: resolvedWorkspaceId } },
      orderBy: [
        { processedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            issueDate: true,
            status: true,
            customer: {
              select: {
                businessName: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    // Debug info
    const debug = {
      totalPayments: allPayments.length,
      now: now.toISOString(),
      sevenDaysAgo: sevenDaysAgo.toISOString(),
      payments: allPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        processedAt: p.processedAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        invoiceNumber: p.invoice.number,
        customer: p.invoice.customer.businessName,
        isAfterSevenDaysAgo: p.processedAt ? isAfter(p.processedAt, sevenDaysAgo) : false,
        isSucceeded: p.status === "SUCCEEDED",
        shouldCountInPaidThisWeek: p.status === "SUCCEEDED" && p.processedAt && isAfter(p.processedAt, sevenDaysAgo),
      })),
    };

    const paidThisWeek = allPayments
      .filter((payment) =>
        payment.status === "SUCCEEDED" && payment.processedAt && isAfter(payment.processedAt, sevenDaysAgo),
      )
      .reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0);

    return NextResponse.json({
      debug,
      paidThisWeek,
      paidThisWeekCount: allPayments.filter((payment) =>
        payment.status === "SUCCEEDED" && payment.processedAt && isAfter(payment.processedAt, sevenDaysAgo),
      ).length,
    });

  } catch (error) {
    console.error("Debug payments API error:", error);
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
