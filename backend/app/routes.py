import os
import uuid

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import Patient, Consultation, ClinicalNote
from .schemas import PatientCreate, NoteRequest
from .ai import (
    transcribe_audio,
    generate_clinical_note,
    clinical_assistant
)

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ClinicalNote AI backend is running"}


# -------------------------
# PATIENTS
# -------------------------

@router.get("/patients")
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()


@router.post("/patients")
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    new_patient = Patient(
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        patient_id=patient.patient_id
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


# -------------------------
# TRANSCRIPTION
# -------------------------

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):

    extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{extension}"

    path = os.path.join("uploads", filename)

    with open(path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        transcript = transcribe_audio(path)
        return {
            "success": True,
            "transcript": transcript
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# -------------------------
# GENERATE CLINICAL NOTE
# -------------------------

@router.post("/generate-note")
def generate_note(
    request: NoteRequest,
    db: Session = Depends(get_db)
):

    try:
        note = generate_clinical_note(request.transcript)

        return {
            "success": True,
            "note": note
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# -------------------------
# AI ASSISTANT
# -------------------------

@router.post("/clinical-assistant")
def ask_ai(
    question: str,
    context: str = ""
):

    try:
        answer = clinical_assistant(
            question,
            context
        )

        return {
            "success": True,
            "answer": answer
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# -------------------------
# SAVE NOTE
# -------------------------

@router.post("/notes")
def save_note(
    consultation_id: int,
    history: str,
    examination: str,
    investigations: str,
    assessment: str,
    plan: str,
    db: Session = Depends(get_db)
):

    note = ClinicalNote(
        consultation_id=consultation_id,
        history=history,
        examination=examination,
        investigations=investigations,
        assessment=assessment,
        plan=plan,
        status="pending"
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.get("/notes")
def get_notes(db: Session = Depends(get_db)):
    return db.query(ClinicalNote).all()


@router.post("/notes/{note_id}/approve")
def approve_note(
    note_id: int,
    db: Session = Depends(get_db)
):

    note = db.query(ClinicalNote).filter(
        ClinicalNote.id == note_id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    note.status = "approved"

    db.commit()
    db.refresh(note)

    return {
        "success": True,
        "message": "Clinical note approved",
        "note": note
    }