"use client";

type Props = {
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: string;
  size?: "md" | "lg";
};

/** Checkbox redondo e animado. É um <button role="checkbox"> para ser acessível por teclado e leitor de tela. */
export function WatchedCheckbox({ checked, onChange, label, color = "var(--good)", size = "md" }: Props) {
  const dimension = size === "lg" ? "size-12" : "size-8";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`${dimension} grid shrink-0 place-items-center rounded-full border-2 transition`}
      style={{ borderColor: checked ? color : "var(--line)", background: checked ? color : "transparent" }}
    >
      {checked && (
        <svg viewBox="0 0 24 24" className="animate-pop size-1/2 text-white" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
