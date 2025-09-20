import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineGrid,
  Badge,
  Button,
  Icon,
} from "@shopify/polaris";
import { 
  CalendarIcon, 
  PersonIcon, 
  ProductIcon,
  EmailIcon 
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Get shop statistics
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
    include: {
      _count: {
        select: {
          barbers: true,
          services: true,
          appointments: true,
          inquiries: true,
        },
      },
    },
  });

  // Get recent appointments
  const recentAppointments = await prisma.appointment.findMany({
    where: { shopId: shop?.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      service: true,
      barber: true,
    },
  });

  // Get pending inquiries
  const pendingInquiries = await prisma.inquiry.findMany({
    where: { 
      shopId: shop?.id,
      status: "new"
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return json({
    shop,
    stats: shop?._count || { barbers: 0, services: 0, appointments: 0, inquiries: 0 },
    recentAppointments,
    pendingInquiries,
  });
};

export default function AppIndex() {
  const { shop, stats, recentAppointments, pendingInquiries } = useLoaderData<typeof loader>();

  return (
    <Page title="Barber Shop Dashboard">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Text as="h2" variant="headingLg">
              Welcome to your Barber Shop Management App
            </Text>
            
            <InlineGrid columns={4} gap="400">
              <Card>
                <BlockStack gap="200">
                  <InlineGrid columns={2} alignItems="center">
                    <Icon source={PersonIcon} tone="base" />
                    <Text as="h3" variant="headingMd">Barbers</Text>
                  </InlineGrid>
                  <Text as="p" variant="heading2xl" tone="success">
                    {stats.barbers}
                  </Text>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <InlineGrid columns={2} alignItems="center">
                    <Icon source={ProductIcon} tone="base" />
                    <Text as="h3" variant="headingMd">Services</Text>
                  </InlineGrid>
                  <Text as="p" variant="heading2xl" tone="success">
                    {stats.services}
                  </Text>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <InlineGrid columns={2} alignItems="center">
                    <Icon source={CalendarIcon} tone="base" />
                    <Text as="h3" variant="headingMd">Appointments</Text>
                  </InlineGrid>
                  <Text as="p" variant="heading2xl" tone="success">
                    {stats.appointments}
                  </Text>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="200">
                  <InlineGrid columns={2} alignItems="center">
                    <Icon source={EmailIcon} tone="base" />
                    <Text as="h3" variant="headingMd">Inquiries</Text>
                  </InlineGrid>
                  <Text as="p" variant="heading2xl" tone="critical">
                    {stats.inquiries}
                  </Text>
                </BlockStack>
              </Card>
            </InlineGrid>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Recent Appointments</Text>
              {recentAppointments.length > 0 ? (
                <BlockStack gap="200">
                  {recentAppointments.map((appointment) => (
                    <div key={appointment.id} style={{ padding: "8px", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
                      <InlineGrid columns={2}>
                        <Text as="p" variant="bodyMd" fontWeight="bold">
                          {appointment.customerName}
                        </Text>
                        <Badge tone={appointment.status === "confirmed" ? "success" : "info"}>
                          {appointment.status}
                        </Badge>
                      </InlineGrid>
                      <Text as="p" variant="bodySm">
                        {appointment.service.name} with {appointment.barber?.name || "Any barber"}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </Text>
                    </div>
                  ))}
                </BlockStack>
              ) : (
                <Text as="p" tone="subdued">No appointments yet</Text>
              )}
              <Button url="/app/appointments" variant="plain">
                View all appointments
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Pending Inquiries</Text>
              {pendingInquiries.length > 0 ? (
                <BlockStack gap="200">
                  {pendingInquiries.map((inquiry) => (
                    <div key={inquiry.id} style={{ padding: "8px", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
                      <Text as="p" variant="bodyMd" fontWeight="bold">
                        {inquiry.name}
                      </Text>
                      <Text as="p" variant="bodySm">
                        {inquiry.message.substring(0, 100)}...
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  ))}
                </BlockStack>
              ) : (
                <Text as="p" tone="subdued">No pending inquiries</Text>
              )}
              <Button url="/app/inquiries" variant="plain">
                View all inquiries
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}