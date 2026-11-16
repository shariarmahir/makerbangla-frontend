/** Lab Kitchen workbench frame: full screen, no store header/footer (the bench has its own top bar). */
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" className="flex-1">{children}</main>;
}
