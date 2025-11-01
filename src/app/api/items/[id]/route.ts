import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
const id = Number(params.id);
const data = await req.json();
const item = await prisma.item.update({ where: { id }, data });
return NextResponse.json(item);
}


export async function DELETE(_: Request, { params }: { params: { id: string } }) {
const id = Number(params.id);
await prisma.item.delete({ where: { id } });
return NextResponse.json({ ok: true });
}