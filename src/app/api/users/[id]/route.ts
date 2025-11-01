import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Accesso negato" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const { name, username, password, role } = await req.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username richiesto" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    // Check if username is already taken by another user
    const usernameTaken = await prisma.user.findFirst({
      where: {
        username,
        id: { not: parseInt(id) },
      },
    });

    if (usernameTaken) {
      return NextResponse.json(
        { error: "Username già utilizzato" },
        { status: 400 }
      );
    }

    // Update user
    const updateData: any = {
      name: name || null,
      username,
      role: role || existing.role,
    };

    // Only update password if provided
    if (password && password.trim()) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Errore nell'aggiornamento utente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Accesso negato" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const userId = parseInt(id);

    // Prevent deleting yourself
    if (userId === session.id) {
      return NextResponse.json(
        { error: "Non puoi eliminare il tuo stesso account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Errore nell'eliminazione utente" },
      { status: 500 }
    );
  }
}

