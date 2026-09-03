import { notFound } from "next/navigation";

import { getUser } from "@/lib/data/meta";
import { CollectionPage } from "@/components/account/empty-collection";

export default function FriendSuggestionsPage() {
  const user = getUser();
  if (!user) notFound();

  return (
    <CollectionPage
      title="Friend Suggestions"
      description="People Discord suggested as friends, based on contact and connection sync."
      field="friend_suggestions"
      value={user.friend_suggestions}
    />
  );
}
