export interface NavItem {
  label: string;
  href: string;
}

export interface ProtocolStep {
  step: number;
  id: string;
  title: string;
  actor: string;
  colorName: "azure" | "ochre" | "meadow" | "azure-dark" | "solar" | "ink";
  badgeBg: string;
  badgeText: string;
  summary: string;
  details: string;
  codeSnippet?: string;
}

export interface TrustInvariant {
  iconName: "ShieldAlert" | "Lock" | "Globe" | "Cpu";
  title: string;
  description: string;
  colorBorder: string;
}

export interface GuaranteeCard {
  tag: string;
  colorAccent: string;
  title: string;
  description: string;
  specReference: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: "Architecture" | "Security" | "ENS" | "Integration";
}

