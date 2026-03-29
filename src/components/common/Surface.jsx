"use client";

export default function Surface({ variant = "hero", children, className = "" }) {
  const baseStyles = "relative mx-auto max-w-7xl rounded-3xl overflow-hidden";

  const variantStyles = {
    hero: "bg-[#F9FAFB]",
    pricing: "bg-[#F3F4F6] shadow-sm",
    footer: "bg-[#F9FAFB] rounded-t-3xl",
  };

  // Texture for hero and footer variants only
  const textureStyle =
    variant === "hero" || variant === "footer"
      ? {
          backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }
      : {};

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={textureStyle}
    >
      {children}
    </div>
  );
}
