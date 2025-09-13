export function Card(props: React.PropsWithChildren<{title?: string; className?: string;}>) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${props.className ?? ""}`}>
      {props.title && <div className="border-b px-4 py-3 text-sm font-semibold">{props.title}</div>}
      <div className="p-4">{props.children}</div>
    </div>
  );
}
