from app.database import Base
from app.models.centre import TrainingCentre
from app.models.batch import TrainingBatch
from app.models.beneficiary import Beneficiary, BeneficiaryEnrolment
from app.models.trainer import Trainer, TrainerAttendance
from app.models.attendance import Attendance
from app.models.evidence import Evidence
from app.models.assessment import Assessment
from app.models.placement import Placement
from app.models.payment import Payment
from app.models.inspection import Inspection
from app.models.anomaly import Anomaly
from app.models.risk import RiskScore
from app.models.corrective_action import CorrectiveAction
from app.models.user import User, InspectorProfile, MonitoringOfficerProfile
from app.models.assignment_history import InspectionAssignmentHistory, AuditLog
from app.models.notification import Notification
