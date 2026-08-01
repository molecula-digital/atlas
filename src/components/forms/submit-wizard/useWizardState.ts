import { useReducer, useRef, useCallback, useEffect } from "react";
import type { AtlasEntryType } from "@/config";
import {
  toEntrySubmission,
  uploadEntryImage,
  type EntryFormValues,
} from "@/lib/entry-submission";
import posthog from "posthog-js";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";

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

/**
 * Stable analytics names for each step index, mirroring the components rendered
 * in SubmitWizard. Reported alongside the index so a reordered wizard is
 * obvious in the funnel instead of silently shifting every number.
 */
const STEP_NAMES = [
  "type_select",
  "basic_info",
  "details",
  "links_tags",
  "review",
] as const;

function stepName(step: number): string {
  return STEP_NAMES[step] ?? `step_${step}`;
}

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

/** The wizard's flat state, as the shared entry payload builder wants it. */
function toFormValues(state: WizardState): EntryFormValues {
  return {
    name: state.name,
    tagline: state.tagline,
    body: state.description,
    city: state.city,
    website: state.website,
    x: state.x,
    instagram: state.instagram,
    linkedin: state.linkedin,
    github: state.github,
    youtube: state.youtube,
    discord: state.discord,
    telegram: state.telegram,
    tags: state.tags,
    foundedYear: state.foundedYear,
    stage: state.stage,
    teamSize: state.teamSize,
    sector: state.sector,
    technologies: state.technologies,
    hiring: state.hiring,
    hiringUrl: state.hiringUrl,
    businessModel: state.businessModel,
    memberCount: state.memberCount,
    meetupFrequency: state.meetupFrequency,
    role: state.role,
    company: state.company,
    email: state.email,
    portfolio: state.portfolio,
    availableForHire: state.availableForHire,
    availableForMentoring: state.availableForMentoring,
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

export function useWizardState() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Drop-off is measured against where the user actually got to, so the
  // furthest step and the outcome have to survive until unmount.
  const furthestStep = useRef(0);
  const completed = useRef(false);

  useEffect(() => {
    posthog.capture(ANALYTICS_EVENTS.submitWizardStarted);

    return () => {
      if (completed.current) return;
      posthog.capture(ANALYTICS_EVENTS.submitWizardAbandoned, {
        last_step_index: furthestStep.current,
        last_step_name: stepName(furthestStep.current),
        total_steps: TOTAL_STEPS,
      });
    };
  }, []);

  const setField = useCallback(
    (field: string, value: unknown) => {
      dispatch({ type: "SET_FIELD", field, value });
    },
    [],
  );

  const nextStep = useCallback(() => {
    if (canAdvance(state)) {
      posthog.capture(ANALYTICS_EVENTS.submitWizardStepCompleted, {
        step_index: state.step,
        step_name: stepName(state.step),
        next_step_index: state.step + 1,
        total_steps: TOTAL_STEPS,
        entry_type: state.entryType || null,
      });
      furthestStep.current = Math.max(furthestStep.current, state.step + 1);
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
    let logoId: number | undefined;
    let coverImageId: number | undefined;

    if (hasImages) {
      dispatch({ type: "UPLOAD_IMAGES_START" });
      try {
        if (logoFile) {
          logoId = await uploadEntryImage(logoFile);
        }
        if (coverFile) {
          coverImageId = await uploadEntryImage(coverFile);
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
        entryType: state.entryType,
        ...toEntrySubmission(toFormValues(state), state.entryType as AtlasEntryType),
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
        completed.current = true;
        posthog.capture(ANALYTICS_EVENTS.directoryEntrySubmitted, {
          entry_type: state.entryType,
          has_images: hasImages,
          tag_count: state.tags.length,
        });
        dispatch({ type: "SUBMIT_SUCCESS" });
      } else {
        // Why it failed is captured server-side by the route handler, which
        // knows the actual reason rather than guessing from a status code.
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
