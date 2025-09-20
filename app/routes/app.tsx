import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Initialize shop in database if it doesn't exist
  const existingShop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!existingShop) {
    await prisma.shop.create({
      data: {
        shopDomain: session.shop,
        shopName: session.shop.replace('.myshopify.com', ''),
        isActive: true,
        subscriptionStatus: 'trial',
      },
    });
  } else if (!existingShop.isActive) {
    // Reactivate shop if it was previously uninstalled
    await prisma.shop.update({
      where: { shopDomain: session.shop },
      data: { isActive: true },
    });
  }

  return redirect("/app");
};