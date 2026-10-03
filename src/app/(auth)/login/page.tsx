import { headers } from "next/headers";

import { langFromAcceptLanguage } from "@/modules/i18n/screen-lang";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const headerStore = await headers();
  const lang = langFromAcceptLanguage(headerStore.get("accept-language"));
  return <LoginForm lang={lang} />;
}
