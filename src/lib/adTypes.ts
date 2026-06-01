export type AdPalette = { background: string; text: string; accent: string };
export type AdFontPair = { heading: string; body: string };

export type AdConcept = {
  angle: string;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  palette: AdPalette;
  fontPair: AdFontPair;
};

export type AdInput = {
  businessName: string;
  productName: string;
  category: string;
  audience: string;
  tone: string;
  offer: string;
  extra: string;
  imageUrls: string[];
};

export type AdStyle = {
  fontFamily: string;
  headingSize: number;
  bodySize: number;
  textColor: string;
  accentColor: string;
  bgType: "solid" | "gradient";
  bgColor: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  underline: boolean;
  shadow: "none" | "soft" | "hard" | "glow";
  letterSpacing: number;
  lineHeight: number;
  padding: number;
  radius: number;
  layout: "stack" | "split" | "overlay" | "banner";
  showCta: boolean;
  showSubheadline: boolean;
  showBody: boolean;
};

export const defaultStyle = (c: AdConcept): AdStyle => ({
  fontFamily: c.fontPair.heading,
  headingSize: 48,
  bodySize: 16,
  textColor: c.palette.text,
  accentColor: c.palette.accent,
  bgType: c.palette.background.includes("gradient") ? "gradient" : "solid",
  bgColor: c.palette.background.includes("gradient") ? "#111827" : c.palette.background,
  bgGradientFrom: "#0ea5e9",
  bgGradientTo: "#7c3aed",
  align: "left",
  bold: true,
  italic: false,
  underline: false,
  shadow: "soft",
  letterSpacing: 0,
  lineHeight: 1.15,
  padding: 40,
  radius: 24,
  layout: "stack",
  showCta: true,
  showSubheadline: true,
  showBody: true,
});
