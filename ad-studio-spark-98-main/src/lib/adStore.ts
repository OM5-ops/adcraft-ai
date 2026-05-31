import type { AdConcept, AdInput, AdStyle } from "./adTypes";

const KEY_INPUT = "adcraft:input";
const KEY_CONCEPTS = "adcraft:concepts";
const KEY_SELECTED = "adcraft:selected";
const KEY_STYLE = "adcraft:style";

const isBrowser = () => typeof window !== "undefined";

export const adStore = {
  saveInput: (v: AdInput) => isBrowser() && localStorage.setItem(KEY_INPUT, JSON.stringify(v)),
  getInput: (): AdInput | null => {
    if (!isBrowser()) return null;
    try {
      const s = localStorage.getItem(KEY_INPUT);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  },
  saveConcepts: (v: AdConcept[]) =>
    isBrowser() && localStorage.setItem(KEY_CONCEPTS, JSON.stringify(v)),
  getConcepts: (): AdConcept[] => {
    if (!isBrowser()) return [];
    try {
      const s = localStorage.getItem(KEY_CONCEPTS);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  },
  saveSelected: (v: AdConcept) =>
    isBrowser() && localStorage.setItem(KEY_SELECTED, JSON.stringify(v)),
  getSelected: (): AdConcept | null => {
    if (!isBrowser()) return null;
    try {
      const s = localStorage.getItem(KEY_SELECTED);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  },
  saveStyle: (v: AdStyle) => isBrowser() && localStorage.setItem(KEY_STYLE, JSON.stringify(v)),
  getStyle: (): AdStyle | null => {
    if (!isBrowser()) return null;
    try {
      const s = localStorage.getItem(KEY_STYLE);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  },
};
