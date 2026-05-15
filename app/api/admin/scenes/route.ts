import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Sửa đường dẫn theo project của bạn

export async function GET() {
  const days = await prisma.day.findMany({
    include: {
      stages: {
        include: { scene: true },
        orderBy: { order: "asc" }
      }
    },
    orderBy: { order: "asc" }
  });
  return NextResponse.json(days);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { stageId, title, content, image, audioUrl, buttonText } = body;

  const scene = await prisma.stageScene.upsert({
    where: { stageId: Number(stageId) },
    update: { title, content, image, audioUrl, buttonText },
    create: { stageId: Number(stageId), title, content, image, audioUrl, buttonText },
  });

  return NextResponse.json(scene);
}