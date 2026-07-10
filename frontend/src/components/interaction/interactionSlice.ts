import { createSlice } from "@reduxjs/toolkit";
import type { Interaction } from "../../types/interaction";
import type { PayloadAction} from "@reduxjs/toolkit";

const initialState: Interaction = {
  doctor: "",
  hospital: "",
  specialization: "",

  interactionType: "",

  visitDate: new Date().toISOString().split("T")[0],

  visitTime: "",

  attendees: "",

  product: "",

  materials: "",

  samples: 0,

  notes: "",

  sentiment: "Neutral",

  outcomes: "",

  followUp: "",

  summary: "",

  suggestions: {
    nextAction: "",
    followUp: "",
    recommendedMaterial: "",
    engagementScore: 0,
    priority: "",
  },

  intelligence: {
  prescriptionProbability: 0,
  visitSuccessScore: 0,
  competitorRisk: "",
  doctorCategory: "",
  businessOpportunity: "",
},

  compliance: {
    ready: false,
    missingFields: [],
    risk: "",
  },

  confidence: 0,

  topics: [],

  
};

const interactionSlice = createSlice({
  name: "interaction",

  initialState,

  reducers: {
    setInteraction(
  _: Interaction,
  action: PayloadAction<Interaction>
) {
  return action.payload;
},

    updateField(
      state,
      action: PayloadAction<{
        field: keyof Interaction;
        value: Interaction[keyof Interaction];
      }>
    ) {
      (state as any)[action.payload.field] =
        action.payload.value;
    },

    resetInteraction() {
      return initialState;
    },
  },
});

export const {
  setInteraction,
  updateField,
  resetInteraction,
} = interactionSlice.actions;

export default interactionSlice.reducer;