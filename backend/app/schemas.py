from pydantic import BaseModel


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    patient_id: str


class ConsultationCreate(BaseModel):
    patient_id: int


class NoteRequest(BaseModel):
    transcript: str


class ClinicalNoteResponse(BaseModel):
    history: str
    examination: str
    investigations: str
    assessment: str
    plan: str