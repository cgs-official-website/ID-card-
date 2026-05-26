import React from "react";

const Radio = ({ label, name, value, checked, onChange, icon: Icon }) => {
  return (
    <label className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all w-full select-none ${
      checked 
        ? 'border-violet-500 bg-violet-500/10 text-violet-300 font-bold shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
        : 'border-[#2D334A]/50 text-slate-400 hover:bg-[#1E243D]/30 hover:text-white'
    }`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="hidden"
      />
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
};

export default Radio;
