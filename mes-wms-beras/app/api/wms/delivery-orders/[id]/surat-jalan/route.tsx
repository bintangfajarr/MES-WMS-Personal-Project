import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import SuratJalanPDF from "@/components/wms/SuratJalanPDF";

// Route Handler
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "DRIVER"]);
  if (error) return error;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        driver: { select: { name: true } },
        createdBy: { select: { name: true } },
        items: {
          include: {
            batch: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { success: false, error: "Delivery Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Render PDF dynamically to a Buffer
    const pdfBuffer = await renderToBuffer(<SuratJalanPDF deliveryOrder={deliveryOrder} />);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="surat-jalan-${deliveryOrder.doNumber}.pdf"`,
      },
    });
  } catch (e) {
    console.error("GET Surat Jalan PDF Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to generate Surat Jalan PDF" },
      { status: 500 }
    );
  }
}
