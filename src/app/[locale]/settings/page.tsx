import { SettingsPage } from "@/components/settings/SettingsPage";
import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { isAdminRole } from "@/lib/auth/role-utils";
import { getAuthenticatedUser } from "@/lib/telegram/session";
import { notFound } from "next/navigation";

type SettingsRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsRoute({ params }: SettingsRouteProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);
  const user = await getAuthenticatedUser();
  const role = user ? String(user.role) : null;

  return (
    <SettingsPage
      locale={typedLocale}
      dictionary={dictionary}
      serverIsAdmin={isAdminRole(role ?? "")}
    />
  );
}
