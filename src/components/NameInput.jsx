import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function NameInput({
  placeholder,
  inputValue,
  onChange,
  error,
  disabled,
}) {
  const inputClass = twMerge(
    clsx(
      "relative",
      "w-full",
      "rounded-lg",
      "bg-surfaceAlt/75 hover:bg-surfaceAlt",
      "py-6",
      "px-4",
      "text-center",
      "text-xl",
      "text-uiText/80",
      "focus:text-uiText",
      "hover:text-uiText",
      "appearance-none",
      "focus:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-inset",
      "focus-visible:ring-surfaceAlt2/25",
      "ring-offset-surface",
      "disabled:opacity-75",
      "hover:disabled:bg-surfaceAlt/75",
      "hover:disabled:text-uiText/80",
      "disabled:cursor-not-allowed",
      {
        "bg-destruct/10 ring-2 ring-destruct/10 text-destruct placeholder:text-destruct hover:text-destructAlt hover:ring-destruct/20 hover:bg-destruct/20 focus-visible:text-destructAlt focus-visible:ring-destruct/40 focus-visible:bg-destruct/10 motion-safe:animate-error-shake":
          error,
      }
    )
  );

  return (
    <input
      className={inputClass}
      placeholder={placeholder}
      value={inputValue}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
