import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return NextResponse.json({ hasAccess: false }, { status: 401 });
    }

    const activeSubscription = await prisma.operatorSubscription.findFirst({
        where: {
            userId,
            status: {
                in: ["ACTIVE", "TRIALING"],
            },
        },
        select: { id: true },
    });

    return NextResponse.json({ hasAccess: Boolean(activeSubscription) });
}
