import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def transcribe_audio(file_path: str):
    with open(file_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3-turbo",
            response_format="json",
            temperature=0.0
        )

    return transcription.text


def generate_clinical_note(transcript: str):

    prompt = f"""
You are ClinicalNote AI, a clinical documentation assistant.

Convert ONLY the information explicitly present in this consultation
transcript into a structured clinical note.

Return valid JSON only.

Required fields:
- history
- examination
- investigations
- assessment
- plan

Rules:
1. Never invent patient information.
2. Never invent examination findings.
3. Never invent investigations.
4. Never prescribe medicines.
5. Never give a definitive diagnosis.
6. If information is missing, write "Not documented".
7. Assessment must be clearly presented as a clinical consideration,
   not a confirmed diagnosis.
8. Plan should contain only actions explicitly discussed in the
   consultation. If none were discussed, write "Not documented".
9. The final note must be suitable for clinician review.

Transcript:
{transcript}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": "You are a clinical documentation assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    text = response.choices[0].message.content.strip()

    # Remove markdown code fences if the model adds them
    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    try:
        note = json.loads(text)

        return {
            "history": note.get("history", "Not documented"),
            "examination": note.get("examination", "Not documented"),
            "investigations": note.get("investigations", "Not documented"),
            "assessment": note.get("assessment", "Not documented"),
            "plan": note.get("plan", "Not documented")
        }

    except json.JSONDecodeError:
        return {
            "history": text,
            "examination": "Not documented",
            "investigations": "Not documented",
            "assessment": "Requires clinician review",
            "plan": "Requires clinician review"
        }


def clinical_assistant(question: str, context: str = ""):

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a clinical documentation assistant. "
                    "Provide supportive information only. "
                    "Do not make definitive diagnoses or replace "
                    "qualified clinician judgment."
                )
            },
            {
                "role": "user",
                "content": f"""
Consultation context:
{context}

Doctor's question:
{question}
"""
            }
        ],
        temperature=0.2
    )

    return response.choices[0].message.content