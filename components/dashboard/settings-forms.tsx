"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DatabaseBackup, Eraser, KeyRound, MessageSquareX, Save, Server } from "lucide-react";
import { changePassword, clearChat, clearSampleData, exportBackup, signOutEverywhere, updateProfile } from "@/lib/admin/actions/settings";
import { ImagePicker } from "./image-picker";
import { Btn, ConfirmButton, download, Field, input, useAction } from "./kit";
import { Card } from "./ui";

export function ProfileForm({ name, title, photo, isAdmin }: { name: string; title: string; photo?: string; isAdmin: boolean }) {
  const [img, setImg] = useState(photo ?? "");
  const { pending, exec } = useAction();
  return (
    <Card title="Profile">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          exec(() => updateProfile({ ...Object.fromEntries(new FormData(e.currentTarget)), photo: img }), "Profile saved");
        }}
      >
        <Field label="Profile picture" className="sm:col-span-2"><ImagePicker name="photo" value={img} onChange={setImg} round /></Field>
        <Field label="Name"><input name="name" required maxLength={80} defaultValue={name} readOnly={!isAdmin} className={input} /></Field>
        <Field label={isAdmin ? "Title" : "Designation"} hint={isAdmin ? undefined : "Set by the super admin."}><input name="title" required maxLength={80} defaultValue={title} readOnly={!isAdmin} className={input} /></Field>
        <div className="flex justify-end sm:col-span-2"><Btn type="submit" tone="primary" disabled={pending}><Save className="size-4" /> Save profile</Btn></div>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const router = useRouter();
  const { pending, exec } = useAction();
  return (
    <Card title="Password">
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const r = await exec(() => changePassword(Object.fromEntries(new FormData(form))), "Password changed — other devices were signed out");
          if (r.ok) form.reset();
        }}
      >
        <Field label="Current password"><input name="current" type="password" required autoComplete="current-password" className={input} /></Field>
        <Field label="New password" hint="At least 10 characters."><input name="next" type="password" required minLength={10} autoComplete="new-password" className={input} /></Field>
        <Field label="Repeat new password"><input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={input} /></Field>
        <div className="flex flex-wrap justify-between gap-2">
          <ConfirmButton icon={false} label="Sign out everywhere" confirm="Sign out all devices" onConfirm={() => exec(() => signOutEverywhere()).then((r) => r.ok && router.push("/account"))} className="h-10 px-4" />
          <Btn type="submit" tone="primary" disabled={pending}><KeyRound className="size-4" /> Change password</Btn>
        </div>
      </form>
    </Card>
  );
}

export function DataTools() {
  const { pending, exec } = useAction();
  return (
    <Card title="Data">
      <ul className="divide-y divide-line" id="data">
        <li className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
          <Eraser className="size-5 text-brand" />
          <span className="min-w-0 flex-1"><b className="block text-[13px] text-ink">Clear sample data</b><span className="text-[12px] text-subtle">Removes the example orders, expenses, leads, team, tasks and traffic. Your products, banners and real records stay.</span></span>
          <ConfirmButton icon={false} label="Clear sample data" confirm="Yes, clear it" onConfirm={() => exec(() => clearSampleData(), "Sample data cleared")} className="h-10 px-4" />
        </li>
        <li className="flex flex-wrap items-center gap-3 py-3.5">
          <DatabaseBackup className="size-5 text-brand" />
          <span className="min-w-0 flex-1"><b className="block text-[13px] text-ink">Download backup</b><span className="text-[12px] text-subtle">Everything as one JSON file (passwords are never included).</span></span>
          <Btn disabled={pending} onClick={() => exec(() => exportBackup()).then((r) => r.ok && download(`makerbangla-backup-${new Date().toISOString().slice(0, 10)}.json`, r.data, "application/json"))}>Download</Btn>
        </li>
        <li className="flex flex-wrap items-center gap-3 py-3.5">
          <MessageSquareX className="size-5 text-brand" />
          <span className="min-w-0 flex-1"><b className="block text-[13px] text-ink">Clear team chat</b><span className="text-[12px] text-subtle">Deletes the chat history for everyone.</span></span>
          <ConfirmButton icon={false} label="Clear chat" confirm="Clear for everyone" onConfirm={() => exec(() => clearChat(), "Chat cleared")} className="h-10 px-4" />
        </li>
        <li className="flex flex-wrap items-center gap-3 py-3.5 last:pb-0">
          <Server className="size-5 text-brand" />
          <span className="min-w-0 flex-1"><b className="block text-[13px] text-ink">Backend</b><span className="text-[12px] text-subtle">Data is kept in this server&apos;s data folder until the Makerbangla backend API is connected.</span></span>
        </li>
      </ul>
    </Card>
  );
}
