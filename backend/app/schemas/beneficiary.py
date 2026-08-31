from pydantic import BaseModel
from typing import Optional
from datetime import date

class BeneficiaryBase(BaseModel):
    beneficiary_token: str
    name: str
    age: int
    gender: str
    category: str
    district: str
    state: str
    eligibility_status: bool
    bank_account_token: str
    mobile_token: str

class Beneficiary(BeneficiaryBase):
    id: int
    class Config:
        from_attributes = True
