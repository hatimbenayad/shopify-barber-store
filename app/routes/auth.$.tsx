import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw new Response("", {
      status: 302,
      headers: { Location: `/auth/shopify?${url.searchParams.toString()}` },
    });
  }

  return new Response("", {
    status: 302,
    headers: { Location: "/auth/shopify" },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return new Response("", {
    status: 302,
    headers: { Location: `/app?shop=${session.shop}` },
  });
};