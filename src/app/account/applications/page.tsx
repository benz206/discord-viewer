import { Download } from "lucide-react";

import { getApplications } from "@/lib/data/meta";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { FieldList } from "@/components/account/field-list";
import { Card, Mono, Pill, Section, SettingsPage } from "@/components/account/section";
import { asRecord, discriminatorTag, type Rec } from "@/components/account/format";

export default function ApplicationsPage() {
  const entries = getApplications();

  return (
    <SettingsPage
      title="Applications"
      description="Bot applications owned by this account, from account/applications/<id>/application.json."
    >
      {entries.length === 0 ? (
        <EmptyState title="No applications" description="account/applications is empty." />
      ) : null}

      {entries.map(({ application, iconPath, botAvatarPath }) => {
        const record = application as unknown as Rec;
        const bot = asRecord(record.bot);
        return (
          <Card key={application.id} className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <Avatar
                src={iconPath ? `/api/asset/${iconPath}` : null}
                name={application.name}
                id={application.id}
                size={56}
                rounded="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-header">{application.name}</p>
                <Mono className="block pt-0.5">{application.id}</Mono>
                <p className="pt-2 text-sm whitespace-pre-wrap text-normal">{application.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <Pill tone={application.bot_public ? "positive" : "neutral"}>
                    {application.bot_public ? "Public bot" : "Private bot"}
                  </Pill>
                  {application.bot_require_code_grant ? <Pill tone="warning">Code grant required</Pill> : null}
                  {application.hook ? <Pill tone="brand">Hook</Pill> : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
                {iconPath ? (
                  <a
                    href={`/api/asset/${iconPath}`}
                    className="inline-flex items-center gap-1 text-link hover:underline"
                  >
                    <Download className="size-3.5" /> icon.png
                  </a>
                ) : null}
                {botAvatarPath ? (
                  <a
                    href={`/api/asset/${botAvatarPath}`}
                    className="inline-flex items-center gap-1 text-link hover:underline"
                  >
                    <Download className="size-3.5" /> bot-avatar.png
                  </a>
                ) : null}
                <a
                  href={`/api/asset/account/applications/${application.id}/application.json`}
                  className="inline-flex items-center gap-1 text-link hover:underline"
                >
                  <Download className="size-3.5" /> application.json
                </a>
              </div>
            </div>

            <FieldList
              value={record}
              overrides={{
                id: <Mono>{application.id}</Mono>,
                icon: application.icon ? <Mono>{application.icon}</Mono> : <span className="text-faint">null</span>,
                verify_key: <Mono>{application.verify_key}</Mono>,
                description: <span className="whitespace-pre-wrap">{application.description}</span>,
                bot:
                  Object.keys(bot).length === 0 ? (
                    <span className="text-faint">null</span>
                  ) : (
                    <div className="rounded-md bg-surface-3 p-3">
                      <div className="flex items-center gap-2 pb-3">
                        <Avatar
                          src={botAvatarPath ? `/api/asset/${botAvatarPath}` : null}
                          name={String(bot.username ?? "")}
                          id={String(bot.id ?? "")}
                          size={32}
                        />
                        <span className="text-sm font-medium text-header">
                          {String(bot.username ?? "")}
                          <span className="text-channel">{discriminatorTag(bot.discriminator)}</span>
                        </span>
                        <Pill tone="brand">BOT</Pill>
                      </div>
                      <FieldList
                        compact
                        value={bot}
                        overrides={{
                          id: <Mono>{String(bot.id)}</Mono>,
                          avatar: bot.avatar ? (
                            <Mono>{String(bot.avatar)}</Mono>
                          ) : (
                            <span className="text-faint">null</span>
                          ),
                        }}
                      />
                    </div>
                  ),
              }}
            />
          </Card>
        );
      })}

      <Section title="Raw applications" count={entries.length}>
        <JsonViewer value={entries} name="applications" defaultExpandedDepth={1} className="max-h-[28rem]" />
      </Section>
    </SettingsPage>
  );
}
