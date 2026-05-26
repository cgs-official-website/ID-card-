import React from "react";

const Button = ({ children, onClick, type = "button", variant = "primary", icon: Icon, disabled, style, className = "" }) => {
  const baseStyle = "flex items-center justify-center gap-2 font-bold rounded-xl text-sm transition-all cursor-pointer select-none disabled:opacity-50";
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20 px-6 py-3.5",
    secondary: "bg-[#1E243D] hover:bg-[#252B48] text-white border border-[#2D334A]/50 px-6 py-3.5"
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {Icon && <Icon size={18} className="flex-shrink-0" />}
      {children}
    </button>
  );
};

export default Button;
