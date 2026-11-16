"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileUp, FlaskConical, Plus, Trash2 } from "lucide-react";
import { getExperiment } from "@/lib/lab/experiments";
import { importProject, projects, useProjects } from "@/lib/lab/projects";
import { CircuitPreview } from "./circuit-art";

const WS = "/learn/lab-kitchen/workspace";

/** The visitor's saved projects (this browser only). */
export function MyProjects() {
  const list = useProjects();
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <section aria-labelledby="projects-title" className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="projects-title" className="section-title">Your projects</h2>
        <div className="flex flex-wrap items-center gap-2">
          {msg && <span role="status" className="text-[12px] font-bold text-sale">{msg}</span>}
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 text-[12.5px] font-bold text-ink ring-1 ring-line hover:ring-brand">
            <FileUp className="size-4" /> Import file
            <input type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const r = await importProject(f); if (typeof r === "string") setMsg(r); else router.push(`${WS}?p=${r.id}`); }} />
          </label>
          <Link href={WS} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-tile-navy px-3.5 text-[12.5px] font-bold text-tile-yellow hover:bg-brand-strong"><Plus className="size-4" /> New project</Link>
        </div>
      </div>
      {list === null ? (
        <div className="mt-5 h-40 animate-pulse rounded-2xl bg-soft" />
      ) : list.length === 0 ? (
        <p className="mt-5 rounded-2xl border-2 border-dashed border-line p-8 text-center text-[13px] text-subtle">Nothing on the bench yet. Start a guided experiment below or open a blank bench — projects are saved in this browser.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => {
            const e = p.experiment ? getExperiment(p.experiment) : undefined;
            return (
              <li key={p.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgb(14_31_77/0.6)]">
                <div className="grid aspect-16/10 place-items-center bg-soft p-3">
                  {p.circuit.parts.length ? <CircuitPreview c={p.circuit} title={`${p.name} circuit`} className="size-full" /> : <span className="text-[12px] font-bold text-subtle">Empty bench</span>}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3.5">
                  <h3 className="truncate text-[14px] font-black text-ink"><Link href={`${WS}?p=${p.id}`} className="after:absolute after:inset-0">{p.name}</Link></h3>
                  <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-subtle">
                    {e && <FlaskConical className="size-3.5 text-brand" />}
                    {p.circuit.parts.length} parts · {new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="relative z-10 flex border-t border-line">
                  <button onClick={() => projects.duplicate(p.id)} className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[11.5px] font-bold text-subtle hover:bg-soft hover:text-ink"><Copy className="size-3.5" /> Duplicate</button>
                  <button onClick={() => window.confirm(`Delete “${p.name}”? This can't be undone.`) && projects.remove(p.id)} className="flex flex-1 items-center justify-center gap-1.5 border-l border-line py-2 text-[11.5px] font-bold text-subtle hover:bg-soft hover:text-sale"><Trash2 className="size-3.5" /> Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
