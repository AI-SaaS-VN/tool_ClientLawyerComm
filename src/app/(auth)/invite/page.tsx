import { headers } from "next/headers";

import { langFromAcceptLanguage } from "@/modules/i18n/screen-lang";

import { InviteForm } from "./invite-form";

export default async function InvitePage() {
  const headerStore = await headers();
  const lang = langFromAcceptLanguage(headerStore.get("accept-language"));
  return <InviteForm lang={lang} />;
}
