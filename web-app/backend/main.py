from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import pandas as pd
import numpy as np
import json
import os
from io import BytesIO, StringIO
import sqlite3
from pathlib import Path

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create data directories
DATA_DIR = Path("data")
UPLOAD_DIR = DATA_DIR / "uploads"
SPLIT_DIR = DATA_DIR / "split_by_model"
REPORTS_DIR = DATA_DIR / "reports"

for directory in [DATA_DIR, UPLOAD_DIR, SPLIT_DIR, REPORTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="SmartLab Blood Cell Quality Testing API",
    description="Enterprise-grade laboratory data analysis API",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",  # Frontend URL (dev mode)
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Models
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class User(BaseModel):
    username: str
    full_name: str
    role: str
    email: Optional[str] = None

class AnalysisRequest(BaseModel):
    model_code: str

class GradeThresholds(BaseModel):
    excellent: float = 0.5
    good: float = 1.0
    satisfactory: float = 2.0
    unsatisfactory: float = 3.0

# In-memory user database (replace with real database in production)
# Pre-hashed passwords using bcrypt
USERS_DB = {
    "admin": {
        "password": "$2b$12$J8OhO7h285OMaPtqsiw4LOWy88g/zXk.rHpOfu0CHO7xVl01AJL6O",  # admin123
        "full_name": "System Administrator",
        "role": "Administrator",
        "email": "admin@smartlab.com"
    },
    "supervisor": {
        "password": "$2b$12$4eGX7LD5FEAmjoDj9zhpWOAHnolBfilblCdyu20ZNwhNwfwzAG5oe",  # super123
        "full_name": "Lab Supervisor",
        "role": "Supervisor",
        "email": "supervisor@smartlab.com"
    },
    "analyst": {
        "password": "$2b$12$gjfBl1ViXBYQ71qac1tHgu4YYHXODEYlcvPdXmKqWKbbfDQJXXfUK",  # analyst123
        "full_name": "Lab Analyst",
        "role": "Analyst",
        "email": "analyst@smartlab.com"
    }
}

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    username = payload.get("sub")
    if username is None or username not in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    user = USERS_DB[username].copy()
    user["username"] = username
    return user

def log_activity(username: str, action: str, details: str = ""):
    """Log user activity"""
    log_file = DATA_DIR / "activity_log.json"
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "username": username,
        "action": action,
        "details": details
    }
    
    if log_file.exists():
        with open(log_file, 'r') as f:
            logs = json.load(f)
    else:
        logs = []
    
    logs.append(log_entry)
    
    # Keep only last 1000 entries
    if len(logs) > 1000:
        logs = logs[-1000:]
    
    with open(log_file, 'w') as f:
        json.dump(logs, f)

def calculate_zscores(df: pd.DataFrame, numeric_cols: List[str]) -> tuple:
    """Calculate Z-scores and grades for numeric columns"""
    stats_dict = {}
    
    for col in numeric_cols:
        if col in df.columns:
            clean_data = df[col].replace(0, np.nan).dropna()
            if len(clean_data) > 0:
                stats_dict[col] = {
                    'mean': float(clean_data.mean()),
                    'std': float(clean_data.std()),
                    'min': float(clean_data.min()),
                    'max': float(clean_data.max()),
                    'count': int(len(clean_data)),
                    'cv': float((clean_data.std() / clean_data.mean() * 100) if clean_data.mean() != 0 else 0)
                }
    
    # Calculate Z-scores
    for col in numeric_cols:
        if col in stats_dict and stats_dict[col]['std'] != 0:
            mean_val = stats_dict[col]['mean']
            std_val = stats_dict[col]['std']
            df[f'{col}_zscore'] = ((df[col] - mean_val) / std_val).round(2)
            df[f'{col}_grade'] = df[f'{col}_zscore'].apply(assign_grade)
    
    return df, stats_dict

def assign_grade(zscore: float) -> str:
    """Assign grade based on Z-score"""
    if pd.isna(zscore):
        return "No data"
    zscore = abs(zscore)
    if zscore <= 0.5:
        return "Excellent"
    elif zscore <= 1:
        return "Good"
    elif zscore <= 2:
        return "Satisfactory"
    elif zscore <= 3:
        return "Unsatisfactory"
    else:
        return "Serious problem"

# API Routes

@app.get("/")
async def root():
    return {
        "message": "SmartLab Blood Cell Quality Testing API",
        "version": "2.0.0",
        "status": "running"
    }

@app.post("/api/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    """Authenticate user and return JWT token"""
    username = user_login.username
    password = user_login.password
    
    if username not in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    user = USERS_DB[username]
    if not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": username})
    
    # Log activity
    log_activity(username, "LOGIN", f"User logged in as {user['role']}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": username,
            "full_name": user["full_name"],
            "role": user["role"],
            "email": user.get("email")
        }
    }

@app.post("/api/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user"""
    log_activity(current_user["username"], "LOGOUT", "User logged out")
    return {"message": "Successfully logged out"}

@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return User(
        username=current_user["username"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        email=current_user.get("email")
    )

@app.post("/api/analysis/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and process CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed"
        )
    
    try:
        # Read CSV
        contents = await file.read()
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['Lab Code', 'Brand code', 'Model code']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Replace 0 with NaN
        df = df.replace(0, np.nan)
        
        # Save uploaded file
        file_path = UPLOAD_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        df.to_csv(file_path, index=False)
        
        # Split by model code
        model_codes = df['Model code'].unique()
        split_files = []
        
        for model_code in model_codes:
            model_df = df[df['Model code'] == model_code].copy()
            split_file_path = SPLIT_DIR / f"Model_{model_code}.csv"
            model_df.to_csv(split_file_path, index=False)
            split_files.append({
                "model_code": str(model_code),
                "records": len(model_df),
                "labs": len(model_df['Lab Code'].unique())
            })
        
        # Log activity
        log_activity(
            current_user["username"],
            "FILE_UPLOAD",
            f"Uploaded {file.filename}, found {len(model_codes)} models"
        )
        
        return {
            "message": "File uploaded successfully",
            "filename": file.filename,
            "total_records": len(df),
            "models_found": len(model_codes),
            "split_files": split_files
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )

@app.get("/api/analysis/models")
async def get_available_models(current_user: dict = Depends(get_current_user)):
    """Get list of available model codes"""
    model_files = list(SPLIT_DIR.glob("Model_*.csv"))
    models = []
    
    for file_path in model_files:
        model_code = file_path.stem.replace("Model_", "")
        df = pd.read_csv(file_path)
        models.append({
            "model_code": model_code,
            "records": len(df),
            "labs": len(df['Lab Code'].unique()),
            "file": file_path.name
        })
    
    return {"models": models}

@app.get("/api/analysis/results/{model_code}")
async def get_analysis_results(
    model_code: str,
    current_user: dict = Depends(get_current_user)
):
    """Get analysis results for a specific model code"""
    file_path = SPLIT_DIR / f"Model_{model_code}.csv"
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {model_code} not found"
        )
    
    try:
        df = pd.read_csv(file_path)
        df = df.replace(0, np.nan)
        
        # Get numeric columns (excluding identifiers)
        exclude_cols = ['Lab Code', 'Brand code', 'Model code', 'Source_File']
        numeric_cols = [col for col in df.columns 
                       if col not in exclude_cols and pd.api.types.is_numeric_dtype(df[col])]
        
        # Calculate Z-scores
        df, stats_dict = calculate_zscores(df, numeric_cols)
        
        # Prepare response
        results = {
            "model_code": model_code,
            "total_records": len(df),
            "total_labs": len(df['Lab Code'].unique()),
            "statistics": stats_dict,
            "data": df.to_dict(orient='records'),
            "columns": list(df.columns)
        }
        
        # Log activity
        log_activity(
            current_user["username"],
            "VIEW_ANALYSIS",
            f"Viewed analysis for Model {model_code}"
        )
        
        return results
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing data: {str(e)}"
        )

@app.get("/api/admin/activity-logs")
async def get_activity_logs(current_user: dict = Depends(get_current_user)):
    """Get activity logs (Admin only)"""
    if current_user["role"] not in ["Administrator", "Supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    log_file = DATA_DIR / "activity_log.json"
    if not log_file.exists():
        return {"logs": []}
    
    with open(log_file, 'r') as f:
        logs = json.load(f)
    
    return {"logs": logs[-100:]}  # Return last 100 entries

@app.get("/api/admin/statistics")
async def get_statistics(current_user: dict = Depends(get_current_user)):
    """Get system statistics (Admin/Supervisor only)"""
    if current_user["role"] not in ["Administrator", "Supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Count files and models
    upload_files = list(UPLOAD_DIR.glob("*.csv"))
    model_files = list(SPLIT_DIR.glob("Model_*.csv"))
    
    # Count records and labs across all models
    total_records = 0
    total_labs = set()
    
    for file_path in model_files:
        df = pd.read_csv(file_path)
        total_records += len(df)
        total_labs.update(df['Lab Code'].unique())
    
    return {
        "total_uploads": len(upload_files),
        "total_models": len(model_files),
        "total_records": total_records,
        "total_labs": len(total_labs)
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
