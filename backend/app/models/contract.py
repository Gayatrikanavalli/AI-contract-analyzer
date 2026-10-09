import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String(64), primary_key=True, default=lambda: f"contract_{uuid.uuid4().hex[:12]}")
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=True)
    file_size = Column(Integer, default=0)
    page_count = Column(Integer, default=1)
    contract_title = Column(String(255), nullable=True)
    contract_type = Column(String(128), nullable=True)
    effective_date = Column(String(128), nullable=True)
    parties = Column(JSON, default=list)
    executive_summary = Column(Text, nullable=True)
    status = Column(String(32), default="pending")  # pending, processing, completed, failed
    risk_score = Column(Integer, nullable=True)
    overall_risk_level = Column(String(32), nullable=True)  # critical, high, medium, standard, low
    extracted_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    clauses = relationship("Clause", back_populates="contract", cascade="all, delete-orphan", order_by="Clause.page_number")


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(String(64), primary_key=True, default=lambda: f"clause_{uuid.uuid4().hex[:12]}")
    contract_id = Column(String(64), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_type = Column(String(128), nullable=False)  # Termination, Payment, Liability, Indemnification, etc.
    title = Column(String(255), nullable=False)
    text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    risk_level = Column(String(32), default="standard")  # critical, high, medium, standard
    risk_score = Column(Integer, nullable=True)  # 0 to 100
    risk_reason = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    contract = relationship("Contract", back_populates="clauses")
