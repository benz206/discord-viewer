import { notFound } from "next/navigation";

import { getUser } from "@/lib/data/meta";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { FieldList } from "@/components/account/field-list";
import { Card, Mono, Pill, Section, SettingsPage } from "@/components/account/section";
import {
  ENTITLEMENT_TYPES,
  PAYMENT_GATEWAYS,
  PAYMENT_SOURCE_TYPES,
  PAYMENT_STATUS,
  SUBSCRIPTION_TYPES,
  enumName,
} from "@/components/account/enums";
import { asRecord, asRecords, formatDateTime, formatMoney, type Rec } from "@/components/account/format";

function EnumValue({ map, value }: { map: Record<number, string>; value: unknown }) {
  return (
    <span>
      {enumName(map, value)} <span className="text-faint">({String(value)})</span>
    </span>
  );
}

function Nested({ value, overrides }: { value: Rec; overrides?: Record<string, React.ReactNode> }) {
  return (
    <div className="rounded-md bg-surface-3 p-3">
      <FieldList value={value} overrides={overrides} compact />
    </div>
  );
}

function paymentSourceOverrides(source: Rec) {
  return {
    id: <Mono>{String(source.id)}</Mono>,
    type: <EnumValue map={PAYMENT_SOURCE_TYPES} value={source.type} />,
    payment_gateway: <EnumValue map={PAYMENT_GATEWAYS} value={source.payment_gateway} />,
    email: <Mono>{String(source.email ?? "—")}</Mono>,
    billing_address: <Nested value={asRecord(source.billing_address)} />,
  };
}

export default function BillingPage() {
  const user = getUser();
  if (!user) notFound();

  const payments = asRecords(user.payments);
  const sources = asRecords(user.payment_sources);
  const entitlements = asRecords(user.entitlements);

  return (
    <SettingsPage title="Billing" description="Payments, payment sources, and entitlements from account/user.json.">
      <Section title="Payments" count={payments.length}>
        {payments.length === 0 ? <EmptyState title="No payments" description="payments is empty." /> : null}
        {payments.map((payment) => {
          const currency = String(payment.currency ?? "usd");
          const subscription = asRecord(payment.subscription);
          const source = asRecord(payment.payment_source);
          return (
            <Card key={String(payment.id)} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold text-header">
                  {formatMoney(Number(payment.amount ?? 0), currency)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-normal">{String(payment.description ?? "")}</span>
                <Pill tone={Number(payment.status) === 1 ? "positive" : "warning"}>
                  {enumName(PAYMENT_STATUS, payment.status)}
                </Pill>
                <span className="text-xs text-channel">{formatDateTime(payment.created_at)}</span>
              </div>
              <FieldList
                value={payment}
                overrides={{
                  id: <Mono>{String(payment.id)}</Mono>,
                  amount: <span>{formatMoney(Number(payment.amount ?? 0), currency)}</span>,
                  amount_refunded: <span>{formatMoney(Number(payment.amount_refunded ?? 0), currency)}</span>,
                  tax: <span>{formatMoney(Number(payment.tax ?? 0), currency)}</span>,
                  sku_price: <span>{formatMoney(Number(payment.sku_price ?? 0), currency)}</span>,
                  status: <EnumValue map={PAYMENT_STATUS} value={payment.status} />,
                  subscription:
                    Object.keys(subscription).length === 0 ? (
                      <span className="text-faint">null</span>
                    ) : (
                      <Nested
                        value={subscription}
                        overrides={{
                          id: <Mono>{String(subscription.id)}</Mono>,
                          type: <EnumValue map={SUBSCRIPTION_TYPES} value={subscription.type} />,
                        }}
                      />
                    ),
                  payment_source:
                    Object.keys(source).length === 0 ? (
                      <span className="text-faint">null</span>
                    ) : (
                      <Nested value={source} overrides={paymentSourceOverrides(source)} />
                    ),
                }}
              />
            </Card>
          );
        })}
      </Section>

      <Section title="Payment sources" count={sources.length}>
        {sources.length === 0 ? <EmptyState title="No payment sources" description="payment_sources is empty." /> : null}
        {sources.map((source) => (
          <Card key={String(source.id)} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-header">
                {enumName(PAYMENT_SOURCE_TYPES, source.type)}
                {source.brand ? ` · ${String(source.brand)}` : ""}
                {source.last_4 ? ` ···· ${String(source.last_4)}` : ""}
              </span>
              <Pill tone={source.invalid ? "danger" : "positive"}>{source.invalid ? "Invalid" : "Valid"}</Pill>
              <span className="text-xs text-channel">{String(source.country ?? "")}</span>
            </div>
            <FieldList value={source} overrides={paymentSourceOverrides(source)} />
          </Card>
        ))}
      </Section>

      <Section title="Entitlements" count={entitlements.length}>
        {entitlements.length === 0 ? <EmptyState title="No entitlements" description="entitlements is empty." /> : null}
        {entitlements.map((entitlement) => (
          <Card key={String(entitlement.id)} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-header">
                {String(entitlement.sku_name ?? entitlement.sku_id ?? entitlement.id)}
              </span>
              <Pill tone="brand">{enumName(ENTITLEMENT_TYPES, entitlement.type)}</Pill>
              {entitlement.deleted ? <Pill tone="danger">Deleted</Pill> : null}
            </div>
            <FieldList
              value={entitlement}
              overrides={{
                id: <Mono>{String(entitlement.id)}</Mono>,
                sku_id: <Mono>{String(entitlement.sku_id)}</Mono>,
                application_id: <Mono>{String(entitlement.application_id)}</Mono>,
                user_id: <Mono>{String(entitlement.user_id)}</Mono>,
                type: <EnumValue map={ENTITLEMENT_TYPES} value={entitlement.type} />,
              }}
            />
          </Card>
        ))}
      </Section>

      <Section title="Raw billing data">
        <JsonViewer
          value={{
            payments: user.payments,
            payment_sources: user.payment_sources,
            entitlements: user.entitlements,
          }}
          name="billing"
          defaultExpandedDepth={1}
          className="max-h-[28rem]"
        />
      </Section>
    </SettingsPage>
  );
}
