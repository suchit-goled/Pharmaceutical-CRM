export interface Suggestions {
  nextAction: string;
  followUp: string;
  recommendedMaterial: string;
  engagementScore: number;
  priority: string;
}

export interface Intelligence {
  prescriptionProbability: number;
  visitSuccessScore: number;
  competitorRisk: string;
  doctorCategory: string;
  businessOpportunity: string;
}

export interface Compliance {
  ready: boolean;
  missingFields: string[];
  risk: string;
}

export interface Interaction {
  doctor: string;
  hospital: string;
  specialization: string;

  interactionType: string;

  visitDate: string;
  visitTime: string;

  attendees: string;

  product: string;

  materials: string;

  samples: number;

  notes: string;

  sentiment: "Positive" | "Neutral" | "Negative";

  outcomes: string;

  followUp: string;

  summary: string;

  confidence: number;

  topics: string[];

  suggestions: Suggestions;

  intelligence: Intelligence;

  compliance: Compliance;
}