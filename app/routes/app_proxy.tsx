import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "../db.server";

// This route handles the app proxy for storefront integration
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  // Find the shop
  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      barbers: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!shopRecord) {
    return json({ error: "Shop not found" }, { status: 404 });
  }

  return json({
    shop: shopRecord,
    services: shopRecord.services,
    barbers: shopRecord.barbers,
  });
};

// Handle appointment booking from storefront
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (!shopRecord) {
    return json({ error: "Shop not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const customerName = formData.get("customerName") as string;
  const customerEmail = formData.get("customerEmail") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const serviceId = formData.get("serviceId") as string;
  const barberId = formData.get("barberId") as string;
  const appointmentDate = formData.get("appointmentDate") as string;
  const notes = formData.get("notes") as string;

  // Validate required fields
  if (!customerName || !customerEmail || !customerPhone || !serviceId || !appointmentDate) {
    return json({ 
      error: "Missing required fields",
      details: "Name, email, phone, service, and appointment date are required"
    }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        barberId: barberId || null,
        appointmentDate: new Date(appointmentDate),
        notes: notes || null,
        shopId: shopRecord.id,
        status: "scheduled",
      },
      include: {
        service: true,
        barber: true,
      },
    });

    return json({ 
      success: true, 
      appointment: {
        id: appointment.id,
        customerName: appointment.customerName,
        service: appointment.service.name,
        barber: appointment.barber?.name,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
      }
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return json({ 
      error: "Failed to create appointment",
      details: "Please try again or contact the shop directly"
    }, { status: 500 });
  }
};