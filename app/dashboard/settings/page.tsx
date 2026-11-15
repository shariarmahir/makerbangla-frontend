import { DataTools, PasswordForm, ProfileForm } from "@/components/dashboard/settings-forms";
import { PageHeader } from "@/components/dashboard/ui";
import { requireUser } from "@/lib/admin/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 xl:grid-cols-2">
        <ProfileForm name={user.name} title={user.title} photo={user.photo} isAdmin={isAdmin} />
        <PasswordForm />
        {isAdmin && <div className="xl:col-span-2"><DataTools /></div>}
      </div>
    </>
  );
}
