import Spinner from "./Spinner";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function Button({
  appearance,
  style,
  fullWidth,
  loading,
  children,
  className,
  ...buttonProps
}) {
  const typeClass = twMerge(
    clsx(
      "ring-1 hover:ring-2 focus:ring-2",
      "ring-inset",
      "ring-uiText/5 hover:ring-uiText/20 focus:ring-uiText/20 disabled:hover:ring-0",
      "outline-none",
      "cursor-pointer disabled:cursor-not-allowed",
      "appearance-none",
      "h-12",
      "inline-flex",
      "items-center",
      "justify-center",
      "rounded-lg",
      "bg-surfaceAlt/90 hover:bg-surfaceAlt",
      "disabled:opacity-75 disabled:hover:bg-surfaceAlt/90 disabled:ring-0",
      "text-uiText/90 hover:text-uiText disabled:opacity-50 disabled:hover:text-uiText/90",
      "select-none",
      {
        "bg-primary/10 ring-2 ring-primary/10 text-primaryAlt hover:bg-primary/20 hover:text-primaryAlt hover:ring-primary/20 focus:text-primaryAlt focus:ring-primary/40 disabled:hover:bg-primary/10 disabled:hover:text-primaryAlt disabled:hover:ring-primary/10":
          appearance === "primary",
        "bg-secondary text-uiText/90 hover:text-uiText/100 focus:text-uiText/100 disabled:hover:text-uiText/90":
          appearance === "secondary",
        "bg-destruct/10 ring-2 ring-destruct/10 text-destruct hover:text-destructAlt hover:ring-destruct/20 hover:bg-destruct/20 focus:text-destructAlt focus:ring-destruct/40 focus:bg-destruct/20 disabled:hover:bg-destruct/10 disabled:hover:text-destruct disabled:hover:ring-destruct/10":
          appearance === "destruct",
        "bg-positive/10 ring-2 ring-positive/10 text-positive hover:text-positiveAlt hover:ring-positive/20 hover:bg-positive/20 focus:text-positiveAlt focus:ring-positive/40 focus:bg-positive/20 disabled:hover:bg-positive/10 disabled:hover:text-positive disabled:hover:ring-positive/10":
          appearance === "positive",
        "h-8 px-2 bg-neutral-300/50 text-neutral-800 hover:text-neutral-900 hover:bg-neutral-300/75 focus:text-neutral-900 focus:bg-neutral-300/75 disabled:hover:bg-neutral-300/50 disabled:hover:text-neutral-800":
          appearance === "toast",
        "bg-surfaceAlt/50 backdrop-blur text-uiText/80 ring-surfaceAlt2/10 hover:ring-surfaceAlt2/40 hover:text-uiText focus:ring-2 focus:ring-surfaceAlt2 focus:text-uiText hover:bg-surfaceAlt focus:bg-surfaceAlt disabled:hover:bg-surfaceAlt/50 disabled:hover:text-uiText/80 disabled:hover:ring-surfaceAlt2/10":
          appearance === "overlay",
        "rounded-full p-2 aspect-[1]": style === "round",
        "rounded-full py-2 px-4": style === "roundedText",
        "rounded-md": style === "rounded",
        "rounded-full p-2 aspect-[2] md:aspect-[0.5] md:py-8": style === "tall",
        "rounded-none": style === "sharp",
        "w-full": fullWidth && fullWidth !== "responsive",
        "grow w-auto": fullWidth === "responsive",
      },
      className
    )
  );

  const loaderClass = twMerge(
    clsx({
      "invisible absolute": !loading,
      "visible absolute": loading,
    })
  );

  const visibleClass = twMerge(
    clsx("inline-flex", "items-center", "justify-center", {
      visible: !loading,
      invisible: loading,
    })
  );

  return (
    <button className={typeClass} {...buttonProps}>
      <span className={visibleClass}>{children}</span>
      <span className={loaderClass}>
        <Spinner />
      </span>
    </button>
  );
}
