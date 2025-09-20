import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Modal,
  FormLayout,
  TextField,
  Select,
  Badge,
  BlockStack,
  InlineStack,
  Text,
  DatePicker,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../../shopify.server";
import { prisma } from "../../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  const appointments = await prisma.appointment.findMany({
    where: { shopId: shop.id },
    include: {
      service: true,
      barber: true,
    },
    orderBy: { appointmentDate: "desc" },
  });

  const services = await prisma.service.findMany({
    where: { shopId: shop.id, isActive: true },
  });

  const barbers = await prisma.barber.findMany({
    where: { shopId: shop.id, isActive: true },
  });

  return json({ appointments, services, barbers, shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (action === "updateStatus") {
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });
    return json({ success: true, appointment });
  }

  if (action === "create") {
    const appointment = await prisma.appointment.create({
      data: {
        customerName: formData.get("customerName") as string,
        customerEmail: formData.get("customerEmail") as string,
        customerPhone: formData.get("customerPhone") as string,
        serviceId: formData.get("serviceId") as string,
        barberId: formData.get("barberId") as string || null,
        appointmentDate: new Date(formData.get("appointmentDate") as string),
        notes: formData.get("notes") as string,
        shopId: shop.id,
      },
      include: {
        service: true,
        barber: true,
      },
    });
    return json({ success: true, appointment });
  }

  return json({ success: false }, { status: 400 });
};

export default function Appointments() {
  const { appointments, services, barbers } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [modalActive, setModalActive] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceId: "",
    barberId: "",
    appointmentDate: "",
    notes: "",
  });

  const isLoading = navigation.state === "submitting";

  const handleModalClose = useCallback(() => {
    setModalActive(false);
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      serviceId: "",
      barberId: "",
      appointmentDate: "",
      notes: "",
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const data = new FormData();
    data.append("action", "create");
    data.append("customerName", formData.customerName);
    data.append("customerEmail", formData.customerEmail);
    data.append("customerPhone", formData.customerPhone);
    data.append("serviceId", formData.serviceId);
    data.append("barberId", formData.barberId);
    data.append("appointmentDate", formData.appointmentDate);
    data.append("notes", formData.notes);

    submit(data, { method: "post" });
    handleModalClose();
  }, [formData, submit, handleModalClose]);

  const handleStatusChange = useCallback((appointmentId: string, status: string) => {
    const data = new FormData();
    data.append("action", "updateStatus");
    data.append("id", appointmentId);
    data.append("status", status);
    submit(data, { method: "post" });
  }, [submit]);

  const getStatusTone = (status: string) => {
    switch (status) {
      case "confirmed": return "success";
      case "completed": return "info";
      case "cancelled": return "critical";
      default: return "warning";
    }
  };

  const rows = appointments.map((appointment) => [
    appointment.customerName,
    appointment.customerEmail,
    appointment.service.name,
    appointment.barber?.name || "Any barber",
    new Date(appointment.appointmentDate).toLocaleDateString(),
    <Badge key={appointment.id} tone={getStatusTone(appointment.status)}>
      {appointment.status}
    </Badge>,
    <Select
      key={appointment.id}
      options={[
        { label: "Scheduled", value: "scheduled" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ]}
      value={appointment.status}
      onChange={(value) => handleStatusChange(appointment.id, value)}
    />,
  ]);

  return (
    <Page title="Appointment Management">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Appointments
                </Text>
                <Button 
                  variant="primary" 
                  onClick={() => setModalActive(true)}
                  loading={isLoading}
                >
                  Book Appointment
                </Button>
              </InlineStack>
              
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text", "text", "text"]}
                headings={["Customer", "Email", "Service", "Barber", "Date", "Status", "Actions"]}
                rows={rows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={modalActive}
        onClose={handleModalClose}
        title="Book New Appointment"
        primaryAction={{
          content: "Book Appointment",
          onAction: handleSubmit,
          loading: isLoading,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalClose,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Customer Name"
              value={formData.customerName}
              onChange={(value) => setFormData({ ...formData, customerName: value })}
              autoComplete="off"
            />
            
            <TextField
              label="Customer Email"
              type="email"
              value={formData.customerEmail}
              onChange={(value) => setFormData({ ...formData, customerEmail: value })}
              autoComplete="off"
            />
            
            <TextField
              label="Customer Phone"
              type="tel"
              value={formData.customerPhone}
              onChange={(value) => setFormData({ ...formData, customerPhone: value })}
              autoComplete="off"
            />
            
            <Select
              label="Service"
              options={[
                { label: "Select a service", value: "" },
                ...services.map((service) => ({ 
                  label: `${service.name} - ${service.price}`, 
                  value: service.id 
                })),
              ]}
              value={formData.serviceId}
              onChange={(value) => setFormData({ ...formData, serviceId: value })}
            />
            
            <Select
              label="Barber (Optional)"
              options={[
                { label: "Any available barber", value: "" },
                ...barbers.map((barber) => ({ 
                  label: barber.name, 
                  value: barber.id 
                })),
              ]}
              value={formData.barberId}
              onChange={(value) => setFormData({ ...formData, barberId: value })}
            />
            
            <TextField
              label="Appointment Date & Time"
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(value) => setFormData({ ...formData, appointmentDate: value })}
              autoComplete="off"
            />
            
            <TextField
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(value) => setFormData({ ...formData, notes: value })}
              multiline={3}
              autoComplete="off"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}