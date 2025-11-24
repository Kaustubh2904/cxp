from enum import Enum

class DriveStatus(Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    UPCOMING = "upcoming"
    LIVE = "live"
    ONGOING = "ongoing"
    COMPLETED = "completed"

class QuestionType(Enum):
    APTITUDE = "aptitude"
    CODING = "coding"
    TECHNICAL = "technical"
    HR = "hr"

class CompanyStatus(Enum):
    PENDING = "pending"      # Newly registered, awaiting review
    APPROVED = "approved"    # Approved and active
    REJECTED = "rejected"    # Rejected by admin
    SUSPENDED = "suspended"  # Temporarily suspended