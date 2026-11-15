"use client";

import { useRef, useState } from "react";
import { Icon } from "./icon";
import { uploadImage } from "@/lib/admin/actions/media";
import { cn } from "@/lib/utils";
import { Spinner, toast } from "./kit";

/** Image field: preview + upload (re-encoded to WebP on the server). Submits its value as a hidden input. */
export function ImagePicker({ name, value, onChange, round, className }: { name: string; value: string; onChange: (url: string) => void; round?: boolean; className?: string }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (f: File) => {
    setBusy(true);
    const form = new FormData();
    form.append("file", f);
    const r = await uploadImage(form).catch(() => ({ ok: false as const, error: "Upload failed. Try a smaller image." }));
    setBusy(false);
    if (r.ok) onChange(r.data);
    else toast(r.error, false);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => file.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) upload(f);
        }}
        aria-label="Upload image"
        className={cn("relative grid shrink-0 place-items-center overflow-hidden bg-stage ring-1 ring-line transition hover:ring-2 hover:ring-brand", round ? "size-20 rounded-full" : "size-24 rounded-2xl")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview of an uploaded/catalog image */}
        {value ? <img src={value} alt="" className="size-full object-contain p-1.5" /> : <Icon name="upload" className="size-7 text-brand" />}
        {busy && <span className="absolute inset-0 grid place-items-center bg-white/70"><Spinner className="text-tile-navy" /></span>}
      </button>
      <div className="flex flex-col items-start gap-1.5">
        <button type="button" onClick={() => file.current?.click()} className="text-[12.5px] font-black text-brand hover:underline">{value ? "Replace image" : "Upload image"}</button>
        <span className="text-[11px] text-subtle">PNG, JPG or WebP · up to 4 MB · drop or click</span>
        {value && <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 text-[11.5px] font-bold text-sale hover:underline"><Icon name="delete" className="size-3" /> Remove</button>}
      </div>
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  );
}
