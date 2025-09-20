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

  const services = await prisma.service.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  return json({ services, shop });
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

  if (action === "create") {
    const service = await prisma.service.create({
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: formData.get("price") as string,
        duration: formData.get("duration") as string,
        shopId: shop.id,
      },
    });
    return json({ success: true, service });
  }

  if (action === "update") {
    const id = formData.get("id") as string;
    const service = await prisma.service.update({
      where: { id },
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: formData.get("price") as string,
        duration: formData.get("duration") as string,
        isActive: formData.get("isActive") === "true",
      },
    });
    return json({ success: true, service });
  }

  if (action === "delete") {
    const id = formData.get("id") as string;
    await prisma.service.delete({
      where: { id },
    });
    return json({ success: true });
  }

  return json({ success: false }, { status: 400 });
};

export default function Services() {
  const { services } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [modalActive, setModalActive] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    isActive: true,
  });

  const isLoading = navigation.state === "submitting";

  const handleModalClose = useCallback(() => {
    setModalActive(false);
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      isActive: true,
    });
  }, []);

  const handleEdit = useCallback((service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration || "",
      isActive: service.isActive,
    });
    setModalActive(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const data = new FormData();
    data.append("action", editingService ? "update" : "create");
    if (editingService) {
      data.append("id", editingService.id);
    }
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("duration", formData.duration);
    data.append("isActive", formData.isActive.toString());

    submit(data, { method: "post" });
    handleModalClose();
  }, [editingService, formData, submit, handleModalClose]);

  const handleDelete = useCallback((serviceId: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      const data = new FormData();
      data.append("action", "delete");
      data.append("id", serviceId);
      submit(data, { method: "post" });
    }
  }, [submit]);

  const rows = services.map((service) => [
    service.name,
    service.description || "No description",
    service.price,
    service.duration || "Not specified",
    <Badge key={service.id} tone={service.isActive ? "success" : "critical"}>
      {service.isActive ? "Active" : "Inactive"}
    </Badge>,
    <InlineStack key={service.id} gap="200">
      <Button variant="tertiary" onClick={() => handleEdit(service)}>
        Edit
      </Button>
      <Button 
        variant="tertiary" 
        tone="critical"
        onClick={() => handleDelete(service.id)}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page title="Service Management">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Your Services
                </Text>
                <Button 
                  variant="primary" 
                  onClick={() => setModalActive(true)}
                  loading={isLoading}
                >
                  Add Service
                </Button>
              </InlineStack>
              
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text", "text"]}
                headings={["Name", "Description", "Price", "Duration", "Status", "Actions"]}
                rows={rows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={modalActive}
        onClose={handleModalClose}
        title={editingService ? "Edit Service" : "Add New Service"}
        primaryAction={{
          content: editingService ? "Update Service" : "Add Service",
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
              label="Service Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              autoComplete="off"
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              multiline={3}
              autoComplete="off"
              helpText="Brief description of the service"
            />
            
            <TextField
              label="Price"
              value={formData.price}
              onChange={(value) => setFormData({ ...formData, price: value })}
              autoComplete="off"
              helpText="e.g., $25, $30-40, Starting at $35"
            />
            
            <TextField
              label="Duration"
              value={formData.duration}
              onChange={(value) => setFormData({ ...formData, duration: value })}
              autoComplete="off"
              helpText="e.g., 30 minutes, 45-60 minutes, 1 hour"
            />
            
            <Select
              label="Status"
              options={[
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ]}
              value={formData.isActive.toString()}
              onChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}