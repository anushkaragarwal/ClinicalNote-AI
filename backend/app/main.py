from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from .models import Patient
from .routes import router


# Create database tables
Base.metadata.create_all(bind=engine)


def seed_demo_patient():
    """Add a demo patient if the database is empty."""
    db: Session = SessionLocal()

    try:
        existing_patient = db.query(Patient).first()

        if not existing_patient:
            demo_patient = Patient(
                patient_id="P001",
                name="Rahul Sharma",
                age=42,
                gender="Male"
            )

            db.add(demo_patient)
            db.commit()

    finally:
        db.close()


# Seed demo data when the application starts
seed_demo_patient()


app = FastAPI(
    title="ClinicalNote AI",
    description="AI-powered clinical documentation backend",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Welcome to ClinicalNote AI API"
    }
