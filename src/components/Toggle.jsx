import clsx from "clsx";

function Toggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-uiText/80">{label}</span>
        <span className="text-xs text-uiText/50 text-pretty">
          {description}
        </span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={clsx(
          'shrink-0 w-11 h-6 rounded-full peer appearance-none cursor-pointer transition-colors after:content-[""] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform checked:after:translate-x-5 disabled:opacity-50 disabled:cursor-not-allowed relative',
          checked ? "bg-positive" : "bg-surfaceAlt3"
        )}
      />
    </label>
  );
}

export default Toggle;
