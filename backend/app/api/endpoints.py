import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.contract import Contract, Clause
from backend.app.schemas.contract import (
    ContractSummaryResponse,
    ContractDetailResponse,
    ClauseResponse,
    UploadResponse,
)
from backend.app.services.pdf_extractor import PDFExtractor
from backend.app.services.gemini_analyzer import GeminiContractAnalyzer

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def run_analysis_pipeline(contract_id: str):
    """Background task to run Gemini AI analysis on contract."""
    from backend.app.database.session import SessionLocal

    db = SessionLocal()
    try:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            return

        contract.status = "processing"
        db.commit()

        analyzer = GeminiContractAnalyzer()
        analysis = analyzer.analyze_contract_text(contract.extracted_text or "", contract.filename)

        # Update contract metadata
        contract.contract_title = analysis.contract_title
        contract.contract_type = analysis.contract_type
        contract.effective_date = analysis.effective_date
        contract.parties = analysis.parties
        contract.executive_summary = analysis.executive_summary
        contract.risk_score = analysis.overall_risk_score
        contract.overall_risk_level = analysis.overall_risk_level
        contract.status = "completed"
        contract.error_message = None

        # Delete any existing clauses for re-analysis
        db.query(Clause).filter(Clause.contract_id == contract_id).delete()

        # Insert new analyzed clauses
        for c in analysis.clauses:
            clause = Clause(
                contract_id=contract_id,
                clause_type=c.clause_type,
                title=c.clause_title,
                text=c.clause_text,
                page_number=c.page_number,
                risk_level=c.risk_level,
                risk_score=c.risk_score,
                risk_reason=c.risk_reason,
                recommendation=c.recommendation,
            )
            db.add(clause)

        db.commit()
    except Exception as e:
        db.rollback()
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if contract:
            contract.status = "failed"
            contract.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/contracts/upload", response_model=UploadResponse)
async def upload_contract(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload legal contract PDF, extract text, and queue Gemini AI risk analysis."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    contract_id = f"contract_{uuid.uuid4().hex[:12]}"
    file_path = os.path.join(UPLOAD_DIR, f"{contract_id}_{file.filename}")

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Extract text and page count via PyMuPDF
    extracted_text, page_count, _ = PDFExtractor.extract_text_with_pages(file_bytes)

    contract = Contract(
        id=contract_id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(file_bytes),
        page_count=page_count,
        extracted_text=extracted_text,
        status="pending",
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)

    # Trigger background worker for Gemini AI analysis
    background_tasks.add_task(run_analysis_pipeline, contract_id)

    return UploadResponse(
        contract_id=contract.id,
        filename=contract.filename,
        page_count=contract.page_count,
        status="processing",
        message="Contract uploaded successfully. Gemini analysis has been queued.",
    )


@router.get("/contracts", response_model=List[ContractSummaryResponse])
def list_contracts(db: Session = Depends(get_db)):
    """List all analyzed contracts in repository."""
    return db.query(Contract).order_by(Contract.created_at.desc()).all()


@router.get("/contracts/{contract_id}", response_model=ContractDetailResponse)
def get_contract(contract_id: str, db: Session = Depends(get_db)):
    """Retrieve full contract details, metadata, and extracted clauses."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    return contract


@router.get("/contracts/{contract_id}/clauses", response_model=List[ClauseResponse])
def get_contract_clauses(contract_id: str, db: Session = Depends(get_db)):
    """Retrieve all identified clauses and risk assessments for a given contract."""
    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).all()
    return clauses


@router.post("/contracts/{contract_id}/analyze")
def reanalyze_contract(
    contract_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Re-run Gemini AI clause and risk analysis for a contract."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")

    contract.status = "processing"
    db.commit()

    background_tasks.add_task(run_analysis_pipeline, contract_id)
    return {"message": "Re-analysis started successfully.", "contract_id": contract_id}


@router.get("/contracts/{contract_id}/download")
def download_contract(contract_id: str, db: Session = Depends(get_db)):
    """Download the original uploaded PDF contract file."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract or not contract.file_path or not os.path.exists(contract.file_path):
        raise HTTPException(status_code=404, detail="Contract PDF file not found on server.")

    return FileResponse(
        path=contract.file_path,
        filename=contract.filename,
        media_type="application/pdf",
    )


@router.delete("/contracts/{contract_id}")
def delete_contract(contract_id: str, db: Session = Depends(get_db)):
    """Delete a contract and its associated clauses and files."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")

    if contract.file_path and os.path.exists(contract.file_path):
        try:
            os.remove(contract.file_path)
        except OSError:
            pass

    db.delete(contract)
    db.commit()
    return {"message": "Contract deleted successfully.", "contract_id": contract_id}


@router.get("/health")
def health_check():
    """Health check endpoint for container orchestrators."""
    return {"status": "healthy", "service": "contract-risk-analyzer"}
