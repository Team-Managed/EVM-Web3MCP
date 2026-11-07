export interface NavItem {
  label: string;
  href: string;
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

