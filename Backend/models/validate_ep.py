from pydantic import BaseModel,field_validator,model_validator,Field
from typing import Annotated,Optional,Dict,List
from enum import Enum
import re
#ICE_PATTERN = re.compile(r"^candidate:.*$") 
ICE_PATTERN = re.compile(
    r"^candidate:[0-9a-zA-Z]+ \d+ [a-zA-Z]+ \d+ (?:\d{1,3}(?:\.\d{1,3}){3}|\[[0-9a-fA-F:]+\]) \d+ typ [a-zA-Z]+(?: .*)?$"
)
class Registry(BaseModel):
    username:str
    
class Update_RTC(BaseModel):
    action:str
    sender_id:int
    sdp: Optional[str] = None
    ice: Optional[List[str]] = None
    answer_sdp: Optional[str] = None
    answer_ice: Optional[List[str]] = None

    @field_validator("ice")
    def validate_ice(cls, value):
        if value is None:
            return value
        if len(value) == 0:
            raise ValueError("ICE candidates must be > 0")
        for candidate in value:
            if not ICE_PATTERN.fullmatch(candidate):
                raise ValueError(f"Invalid ICE candidate format: {candidate}")
        return value

    @field_validator("answer_ice")
    def validate_answer_ice(cls, value):
        if value is None:
            return value
        if len(value) == 0:
            raise ValueError("Answer ICE candidates must be > 0")
        for candidate in value:
            if not ICE_PATTERN.fullmatch(candidate):
                raise ValueError(f"Invalid Answer ICE candidate format: {candidate}")
        return value