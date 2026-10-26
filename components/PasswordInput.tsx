"use client";
import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { visibilityLabel?: string };
export default function PasswordInput({ id, className = "", visibilityLabel = "password", disabled, ...props }: Props) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  return <div className="relative w-full">
    <input {...props} id={inputId} disabled={disabled} type={visible ? "text" : "password"} className={`${className} pr-12!`} />
    <button type="button" disabled={disabled} onClick={() => setVisible(value => !value)} aria-label={`${visible ? "Hide" : "Show"} ${visibilityLabel}`} aria-controls={inputId} aria-pressed={visible} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/45 transition hover:text-[#ead2a0] focus-visible:outline-2 focus-visible:outline-[#cda762] disabled:opacity-40">
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  </div>;
}
