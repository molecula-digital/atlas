import { useReducer, useRef, useCallback } from "react";
import type { AtlasEntryType } from "@/config";

export interface WizardState {
  step: number;
  entryType: AtlasEntryType | "";
  // Step 1: Basic info
  name: string;
  tagline: string;
  description: string;
  city: string;
  // Step 2: Details (type-specific)
  foundedYear: string;
  stage: string;
  teamSize: string;
  sector: string;
  technologies: string;
  hiring: boolean;
  hiringUrl: string;
  memberCount: string;
  meetupFrequency: string;
  businessModel: string;
  role: string;
  company: string;
  email: string;
  portfolio: string;
  availableForHire: boolean;
  availableForMentoring: boolean;
  // Step 3: Links + Tags
  website: string;
  x: string;
  instagram: string;
  linkedin: string;
  github: string;
  youtube: string;
  discord: string;
  telegram: string;
  tags: string[];
  tagInput: string;
  // Step 5: Submission
  submitting: boolean;
  uploadingImages: boolean;
  uploadError: string | null;
  result: "success" | "error" | null;
  // Image previews
  logoPreview: string | null;
  coverPreview: string | null;
}

export type WizardAction =
  | { type: "SET_FIELD"; field: string; value: unknown }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_STEP"; step: number }
  | { type: "UPLOAD_IMAGES_START" }
  | { type: "UPLOAD_IMAGES_ERROR"; message: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR" }
  | { type: "CLEAR_RESULT" }
  | { type: "RESET" };

const TOTAL_STEPS = 5;

const initialState: WizardState = {
  step: 0,
  entryType: "",
  name: "",
  tagline: "",
  description: "",
  city: "",
  foundedYear: "",
  stage: "",
  teamSize: "",
  sector: "",
  technologies: "",
  hiring: false,
  hiringUrl: "",
  memberCount: "",
  meetupFrequency: "",
  businessModel: "",
  role: "",
  company: "",
  email: "",
  portfolio: "",
  availableForHire: false,
  availableForMentoring: false,
  website: "",
  x: "",
  instagram: "",
  linkedin: "",
  github: "",
  youtube: "",
  discord: "",
  telegram: "",
  tags: [],
  tagInput: "",
  submitting: false,
  uploadingImages: false,
  uploadError: null,
  result: null,
  logoPreview: null,
  coverPreview: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "NEXT_STEP":
      return state.step < TOTAL_STEPS - 1
        ? { ...state, step: state.step + 1 }
        : state;
    case "PREV_STEP":
      return state.step > 0 ? { ...state, step: state.step - 1 } : state;
    case "SET_STEP":
      return { ...state, step: action.step };
    case "UPLOAD_IMAGES_START":
      return { ...state, uploadingImages: true, uploadError: null, submitting: true, result: null };
    case "UPLOAD_IMAGES_ERROR":
      return { ...state, uploadingImages: false, uploadError: action.message, submitting: false };
    case "SUBMIT_START":
      return { ...state, uploadingImages: false, submitting: true, result: null };
    case "SUBMIT_SUCCESS":
      return { ...state, submitting: false, result: "success" };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, result: "error" };
    case "CLEAR_RESULT":
      return { ...state, result: null, uploadError: null };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

function csvToArray(value: string): string[] | undefined {
  const arr = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

function buildPayload(state: WizardState) {
  return {
    entryType: state.entryType,
    name: state.name,
    tagline: state.tagline || undefined,
    body: state.description.trim() || undefined,
    city: state.city,
    website: state.website || undefined,
    x: state.x || undefined,
    instagram: state.instagram || undefined,
    linkedin: state.linkedin || undefined,
    github: state.github || undefined,
    youtube: state.youtube || undefined,
    discord: state.discord || undefined,
    telegram: state.telegram || undefined,
    tags: state.tags.length > 0 ? state.tags.map((t) => ({ tag: t })) : undefined,
    foundedYear: state.foundedYear ? Number(state.foundedYear) : undefined,
    stage: state.stage || undefined,
    teamSize: state.teamSize || undefined,
    sector: state.sector || undefined,
    technologies: csvToArray(state.technologies)?.map((t) => ({ technology: t })),
    // The checkbox is only a UI gate — a retained URL must not be submitted once it is off.
    hiringUrl: state.hiring ? state.hiringUrl || undefined : undefined,
    memberCount: state.memberCount ? Number(state.memberCount) : undefined,
    meetupFrequency: state.meetupFrequency || undefined,
    businessModel: state.businessModel || undefined,
    role: state.role || undefined,
    company: state.company || undefined,
    email: state.email || undefined,
    portfolio: state.portfolio || undefined,
    availableForHire: state.availableForHire || undefined,
    availableForMentoring: state.availableForMentoring || undefined,
  };
}

function canAdvance(state: WizardState): boolean {
  switch (state.step) {
    case 0:
      return state.entryType !== "";
    case 1:
      return (
        state.name.trim() !== "" &&
        state.description.trim() !== "" &&
        state.city !== ""
      );
    default:
      return true;
  }
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Error al subir imagen");
  }
  const data = await res.json();
  return data.id;
}

export function useWizardState() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const setField = useCallback(
    (field: string, value: unknown) => {
      dispatch({ type: "SET_FIELD", field, value });
    },
    [],
  );

  const nextStep = useCallback(() => {
    if (canAdvance(state)) {
      dispatch({ type: "NEXT_STEP" });
    }
  }, [state]);

  const prevStep = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  const clearResult = useCallback(() => {
    dispatch({ type: "CLEAR_RESULT" });
  }, []);

  const submit = useCallback(async () => {
    const logoFile = logoRef.current?.files?.[0];
    const coverFile = coverRef.current?.files?.[0];
    const hasImages = Boolean(logoFile || coverFile);

    // Phase 1: Upload images (if any)
    let logoId: string | undefined;
    let coverImageId: string | undefined;

    if (hasImages) {
      dispatch({ type: "UPLOAD_IMAGES_START" });
      try {
        if (logoFile) {
          logoId = await uploadImage(logoFile);
        }
        if (coverFile) {
          coverImageId = await uploadImage(coverFile);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al subir imágenes";
        dispatch({ type: "UPLOAD_IMAGES_ERROR", message });
        return;
      }
    }

    // Phase 2: Submit entry JSON
    dispatch({ type: "SUBMIT_START" });
    try {
      const entryPayload = {
        ...buildPayload(state),
        ...(logoId ? { logo: logoId } : {}),
        ...(coverImageId ? { coverImage: coverImageId } : {}),
      };

      const res = await fetch("/api/submissions/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(entryPayload),
      });

      if (res.ok) {
        dispatch({ type: "SUBMIT_SUCCESS" });
      } else {
        dispatch({ type: "SUBMIT_ERROR" });
      }
    } catch {
      dispatch({ type: "SUBMIT_ERROR" });
    }
  }, [state]);

  return {
    state,
    setField,
    nextStep,
    prevStep,
    canAdvance: canAdvance(state),
    submit,
    clearResult,
    logoRef,
    coverRef,
  };
}
