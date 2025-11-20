// src/redux/slices/registerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Question = {
  id: string;
  q: string;
  type: 'mcq' | 'open';
  options?: string[];
  correctAnswer?: string | null;
};

export interface RegisterState {
  gender: string | null;
  fullName: string;
  displayName: string;
  email: string;
  password: string;

  dob: string | null; // store as ISO string instead of Date to avoid navigation crashes
  country: string;
  nationality: string;
  languages: string[];

  insightAnswers: Record<string, string>; // Q/A from Insight step
  personalityQuestions: Question[]; // array of {id, q, type, options?, correctAnswer?}
  photos: string[]; // array of photo URIs
}

const initialState: RegisterState = {
  gender: null,
  fullName: 'test',
  displayName: 'testing',
  email: 'test@gmail.com',
  password: '123456',

  dob: null,
  country: '',
  nationality: '',
  languages: [],

  insightAnswers: {},
  personalityQuestions: [], 
  photos: [],
};

const registerSlice = createSlice({
  name: 'register',
  initialState,
  reducers: {
    // 🔹 generic field updater
    setField: (
      state,
      action: PayloadAction<{ field: keyof RegisterState; value: any }>
    ) => {
      (state[action.payload.field] as any) = action.payload.value;
    },

    // 🔹 reset everything
    resetRegister: () => initialState,

    // 🔹 specific helpers
    addLanguage: (state, action: PayloadAction<string>) => {
      if (!state.languages.includes(action.payload)) {
        state.languages.push(action.payload);
      }
    },
    removeLanguage: (state, action: PayloadAction<string>) => {
      state.languages = state.languages.filter((l) => l !== action.payload);
    },

    addInsightAnswer: (
      state,
      action: PayloadAction<{ qid: string; answer: string }>
    ) => {
      state.insightAnswers[action.payload.qid] = action.payload.answer;
    },

    setPersonalityQuestions: (state, action: PayloadAction<any[]>) => {
      state.personalityQuestions = action.payload;
    },

    addPhoto: (
      state,
      action: PayloadAction<{ index: number; uri: string }>
    ) => {
      const { index, uri } = action.payload;
      state.photos[index] = uri;
    },
  },
});

export const {
  setField,
  resetRegister,
  addLanguage,
  removeLanguage,
  addInsightAnswer,
  setPersonalityQuestions,
  addPhoto,
} = registerSlice.actions;

export default registerSlice.reducer;
