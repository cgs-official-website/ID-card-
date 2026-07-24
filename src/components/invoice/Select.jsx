import React from "react";

const Select = ({
  label,
  name,
  options,
  value,
  onChange,
  required = true,
  className = ""
}) => {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          className={`w-full appearance-none rounded-xl border border-[#222222]/50 bg-black/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all text-white font-medium pr-10 ${className}`}
          value={value}
          onChange={onChange}
          required={required}
        >
          <option value="" disabled className="bg-[#111111] text-gray-400">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111111] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Select;
