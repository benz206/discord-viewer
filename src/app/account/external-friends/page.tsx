import { notFound } from "next/navigation";

import { getUser } from "@/lib/data/meta";
import { CollectionPage } from "@/components/account/empty-collection";

export default function ExternalFriendsPage() {
  const user = getUser();
  if (!user) notFound();

  return (
    <CollectionPage
      title="External Friends"
      description="Friend lists imported from connected third-party accounts."
      field="external_friends_lists"
      value={user.external_friends_lists}
    />
  );
}
