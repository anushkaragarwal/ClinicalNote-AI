const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://clinicalnote-ai-backend.onrender.com";

export type Patient = {
  id: number | string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  lastConsultation?: string;
  patient_id?: string;
};

export type ClinicalNote = {
  chiefComplaint?: string;
  presentIllness?: string;
  pastHistory?: string;
  medications?: string;
  allergies?: string;
  examination: string;
  investigations: string;
  assessment: string;
  plan: string;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API ${response.status}: ${
        errorText || response.statusText || "Request failed"
      }`
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  // =====================================================
  // HEALTH
  // =====================================================

  health: async () => {
    return request<{ status: string }>("/api/health");
  },

  // =====================================================
  // PATIENTS
  // =====================================================

  getPatients: async (): Promise<Patient[]> => {
    return request<Patient[]>("/api/patients");
  },

  createPatient: async (patient: {
    name: string;
    age: number;
    gender: string;
    patient_id: string;
  }) => {
    return request<Patient>("/api/patients", {
      method: "POST",
      body: JSON.stringify(patient),
    });
  },

  // =====================================================
  // CONSULTATION
  // =====================================================

  startConsultation: async (patientId: string | number) => {
    /*
     * Your current backend does not expose a
     * /consultations endpoint.
     *
     * Keep this local for now until that endpoint
     * is added to FastAPI.
     */
    return {
      id: `CONS-${Date.now()}`,
      patientId: String(patientId),
    };
  },

  // =====================================================
  // AUDIO / TRANSCRIPTION
  // =====================================================

  uploadAudio: async (file: File) => {
    return {
      fileName: file.name,
    };
  },

  
transcribeAudio: async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/transcribe`,
    {
      method: "POST",
      body: formData,
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Transcription failed (${response.status}): ${text}`
    );
  }

  try {
    return JSON.parse(text) as {
      success: boolean;
      transcript: string;
    };
  } catch {
    throw new Error(`Invalid transcription response: ${text}`);
  }
},

  // =====================================================
  // AI CLINICAL NOTE
  // =====================================================

  generateClinicalNote: async (transcript: string) => {
    return request<{
      success: boolean;
      note: any;
    }>("/api/generate-note", {
      method: "POST",
      body: JSON.stringify({
        transcript,
      }),
    });
  },

  // =====================================================
  // CLINICAL ASSISTANT
  // =====================================================

  askClinicalAssistant: async (
    question: string,
    context: string = ""
  ) => {
    /*
     * Backend expects:
     * POST /api/clinical-assistant?question=...&context=...
     */

    const params = new URLSearchParams();

    params.set("question", question);

    if (context) {
      params.set("context", context);
    }

    return request<{
      success: boolean;
      answer: string;
    }>(`/api/clinical-assistant?${params.toString()}`, {
      method: "POST",
    });
  },

  // =====================================================
  // SAVE CLINICAL NOTE
  // =====================================================

  saveClinicalNote: async (
    note: ClinicalNote,
    consultationId: number
  ) => {
    /*
     * Backend currently expects these as query parameters:
     *
     * consultation_id
     * history
     * examination
     * investigations
     * assessment
     * plan
     */

    const params = new URLSearchParams();

    params.set("consultation_id", String(consultationId));
    params.set(
      "history",
      note.presentIllness || note.pastHistory || ""
    );
    params.set("examination", note.examination || "");
    params.set("investigations", note.investigations || "");
    params.set("assessment", note.assessment || "");
    params.set("plan", note.plan || "");

    return request("/api/notes?" + params.toString(), {
      method: "POST",
    });
  },

  // =====================================================
  // GET NOTES
  // =====================================================

  getClinicalNotes: async () => {
    return request("/api/notes");
  },

  // =====================================================
  // APPROVE NOTE
  // =====================================================

  approveClinicalNote: async (noteId: number) => {
    return request(`/api/notes/${noteId}/approve`, {
      method: "POST",
    });
  },
};