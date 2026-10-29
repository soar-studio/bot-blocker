import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Badge,
  Banner,
  List,
  Link,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

type Settings = {
  shop: string;
  blockZeroPrice: boolean;
};

async function loadSettings(shop: string): Promise<Settings> {
  const existing = await prisma.shopSettings.upsert({
    where: { shop },
    update: {},
    create: { shop, blockZeroPrice: true },
  });
  return { shop: existing.shop, blockZeroPrice: existing.blockZeroPrice };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await loadSettings(session.shop);
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "toggleZeroPrice") {
    const next = form.get("value") === "true";
    const updated = await prisma.shopSettings.upsert({
      where: { shop: session.shop },
      update: { blockZeroPrice: next },
      create: { shop: session.shop, blockZeroPrice: next },
    });
    return { settings: { shop: updated.shop, blockZeroPrice: updated.blockZeroPrice } };
  }

  return null;
};

export default function Index() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const current = fetcher.data?.settings ?? settings;
  const isSubmitting = fetcher.state !== "idle";

  const toggleZeroPrice = () =>
    fetcher.submit(
      { intent: "toggleZeroPrice", value: String(!current.blockZeroPrice) },
      { method: "POST" },
    );

  return (
    <Page>
      <TitleBar title="Bot Blocker" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Banner tone="info" title="Why Bot Blocker exists">
              <p>
                Card-testing bots probe stolen credit cards by abusing free or
                $0-priced products — sample bottles, gift-with-purchase items,
                mis-priced variants. Bot Blocker runs on Shopify's own servers
                at checkout, so these carts never reach the payment step.
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      Block $0 cart checkout
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Shoppers can't check out while any line item is priced at
                      $0. Blocks per-unit, line total, and variant price.
                    </Text>
                  </BlockStack>
                  <InlineStack gap="300" blockAlign="center">
                    <Badge tone={current.blockZeroPrice ? "success" : "attention"}>
                      {current.blockZeroPrice ? "Active" : "Off"}
                    </Badge>
                    <button
                      className="Polaris-Button Polaris-Button--primary"
                      onClick={toggleZeroPrice}
                      disabled={isSubmitting}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid #000",
                        background: current.blockZeroPrice ? "#fff" : "#000",
                        color: current.blockZeroPrice ? "#000" : "#fff",
                        cursor: isSubmitting ? "wait" : "pointer",
                      }}
                    >
                      {current.blockZeroPrice ? "Disable" : "Enable"}
                    </button>
                  </InlineStack>
                </InlineStack>

                <Divider />

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    How it blocks
                  </Text>
                  <List>
                    <List.Item>
                      Runs as a Shopify cart & checkout validation function —
                      server-side, bots can't bypass it with scripted requests.
                    </List.Item>
                    <List.Item>
                      Triggers on both <code>CHECKOUT_INTERACTION</code> and{" "}
                      <code>CHECKOUT_COMPLETION</code>.
                    </List.Item>
                    <List.Item>
                      Flags a line as $0 if any of per-unit cost, line total, or
                      variant price is ≤ 0.
                    </List.Item>
                  </List>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Shop
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {current.shop}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Roadmap
                  </Text>
                  <List>
                    <List.Item>Block carts above risk-score threshold</List.Item>
                    <List.Item>Rate-limit new-customer checkouts by IP</List.Item>
                    <List.Item>
                      Block checkout from{" "}
                      <Link
                        url="https://shopify.dev/docs/api/functions/reference/cart-checkout-validation"
                        target="_blank"
                        removeUnderline
                      >
                        high-risk BIN ranges
                      </Link>
                    </List.Item>
                    <List.Item>Allowlist for staff/test accounts</List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
