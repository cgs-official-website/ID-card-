import React from "react";

const Input = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = true,
  style,
  className = ""
}) => {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        className={`w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-white font-medium placeholder:text-slate-500 ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={style}
      />
    </div>
  );
};

export default Input;
