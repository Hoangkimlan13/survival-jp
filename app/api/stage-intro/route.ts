import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stageId = Number(searchParams.get("stageId"));

  if (!stageId) {
    return NextResponse.json(
      { error: "Missing stageId" },
      { status: 400 }
    );
  }

  const intro = await prisma.stageScene.findUnique({
    where: { stageId },
  });

  return NextResponse.json(intro);
}