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
  Toast,
  Frame,
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

  const barbers = await prisma.barber.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  return json({ barbers, shop });
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
    const barber = await prisma.barber.create({
      data: {
        name: formData.get("name") as string,
        specialty: formData.get("specialty") as string,
        bio: formData.get("bio") as string,
        imageUrl: formData.get("imageUrl") as string,
        shopId: shop.id,
      },
    });
    return json({ success: true, barber });
  }

  if (action === "update") {
    const id = formData.get("id") as string;
    const barber = await prisma.barber.update({
      where: { id },
      data: {
        name: formData.get("name") as string,
        specialty: formData.get("specialty") as string,
        bio: formData.get("bio") as string,
        imageUrl: formData.get("imageUrl") as string,
        isActive: formData.get("isActive") === "true",
      },
    });
    return json({ success: true, barber });
  }

  if (action === "delete") {
    const id = formData.get("id") as string;
    await prisma.barber.delete({
      where: { id },
    });
    return json({ success: true });
  }

  return json({ success: false }, { status: 400 });
};

export default function Barbers() {
  const { barbers } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [modalActive, setModalActive] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    bio: "",
    imageUrl: "",
    isActive: true,
  });

  const isLoading = navigation.state === "submitting";

  const handleModalClose = useCallback(() => {
    setModalActive(false);
    setEditingBarber(null);
    setFormData({
      name: "",
      specialty: "",
      bio: "",
      imageUrl: "",
      isActive: true,
    });
  }, []);

  const handleEdit = useCallback((barber: any) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name,
      specialty: barber.specialty || "",
      bio: barber.bio || "",
      imageUrl: barber.imageUrl || "",
      isActive: barber.isActive,
    });
    setModalActive(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const data = new FormData();
    data.append("action", editingBarber ? "update" : "create");
    if (editingBarber) {
      data.append("id", editingBarber.id);
    }
    data.append("name", formData.name);
    data.append("specialty", formData.specialty);
    data.append("bio", formData.bio);
    data.append("imageUrl", formData.imageUrl);
    data.append("isActive", formData.isActive.toString());

    submit(data, { method: "post" });
    handleModalClose();
  }, [editingBarber, formData, submit, handleModalClose]);

  const handleDelete = useCallback((barberId: string) => {
    if (confirm("Are you sure you want to delete this barber?")) {
      const data = new FormData();
      data.append("action", "delete");
      data.append("id", barberId);
      submit(data, { method: "post" });
    }
  }, [submit]);

  const rows = barbers.map((barber) => [
    barber.name,
    barber.specialty || "General",
    <Badge key={barber.id} tone={barber.isActive ? "success" : "critical"}>
      {barber.isActive ? "Active" : "Inactive"}
    </Badge>,
    <InlineStack key={barber.id} gap="200">
      <Button variant="tertiary" onClick={() => handleEdit(barber)}>
        Edit
      </Button>
      <Button 
        variant="tertiary" 
        tone="critical"
        onClick={() => handleDelete(barber.id)}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page title="Barber Management">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Your Barbers
                </Text>
                <Button 
                  variant="primary" 
                  onClick={() => setModalActive(true)}
                  loading={isLoading}
                >
                  Add Barber
                </Button>
              </InlineStack>
              
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Name", "Specialty", "Status", "Actions"]}
                rows={rows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={modalActive}
        onClose={handleModalClose}
        title={editingBarber ? "Edit Barber" : "Add New Barber"}
        primaryAction={{
          content: editingBarber ? "Update Barber" : "Add Barber",
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
              label="Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              autoComplete="off"
            />
            
            <TextField
              label="Specialty"
              value={formData.specialty}
              onChange={(value) => setFormData({ ...formData, specialty: value })}
              autoComplete="off"
              helpText="e.g., Hair cutting, Beard trimming, Hair styling"
            />
            
            <TextField
              label="Bio"
              value={formData.bio}
              onChange={(value) => setFormData({ ...formData, bio: value })}
              multiline={4}
              autoComplete="off"
              helpText="Brief description about the barber"
            />
            
            <TextField
              label="Image URL"
              value={formData.imageUrl}
              onChange={(value) => setFormData({ ...formData, imageUrl: value })}
              autoComplete="off"
              helpText="URL to the barber's profile image"
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