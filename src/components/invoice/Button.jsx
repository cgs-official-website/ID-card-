import React from "react";

const Button = ({ children, onClick, type = "button", variant = "primary", icon: Icon, disabled, style, className = "" }) => {
  const baseStyle = "flex items-center justify-center gap-2 font-bold rounded-xl text-sm transition-all cursor-pointer select-none disabled:opacity-50";
  const variants = {
    primary: "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-white shadow-lg shadow-yellow-500/20 px-6 py-3.5",
    secondary: "bg-[#1A1A1A] hover:bg-[#252B48] text-white border border-[#222222]/50 px-6 py-3.5"
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
