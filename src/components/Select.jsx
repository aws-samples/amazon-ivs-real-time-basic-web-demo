// From https://codepen.io/amazon-ivs/project/editor/ZzWobn

import { ChevronUpDownIcon } from "@heroicons/react/24/outline";

function Select({ title, options, defaultValue, onChange, disabled }) {
  const hasOptions = options.length > 0;

  function handleChange(event) {
    onChange(event.target.value);
  }

  return (
    <div>
      <label
        htmlFor={title}
        className="inline-block mb-1 text-sm font-medium text-uiText/50"
      >
        {title}
      </label>
      <div className="relative flex items-center">
        <div className="relative w-full cursor-default rounded-lg bg-surfaceAlt/50 hover:bg-surfaceAlt py-2 pl-3 pr-2 text-left appearance-none has-[:focus]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-surfaceAlt2/25 has-[:focus-visible]:ring-offset-2 ring-offset-surface text-md has-[:disabled]:opacity-75 has-[:disabled]:ring-0 has-[:disabled]:cursor-not-allowed">
          <select
            defaultValue={defaultValue}
            onChange={handleChange}
            disabled={!hasOptions || disabled}
            id={title}
            className="w-full bg-transparent gradient-mask-r-[rgba(0,0,0,1.0)_0%,rgba(0,0,0,1.0)_80%,transparent_90%] appearance-none focus:outline-none disabled:cursor-not-allowed"
          >
            {hasOptions ? (
              options.map((option) => {
                return (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                );
              })
            ) : (
              <option value={defaultValue} disabled>
                Choose Option
              </option>
            )}
          </select>
        </div>
        <div className="absolute w-5 h-5 right-2 pointer-events-none">
          <ChevronUpDownIcon className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

export default Select;
