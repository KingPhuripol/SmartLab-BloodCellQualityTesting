import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
import base64
from io import StringIO, BytesIO
import zipfile
import hashlib
import json
from datetime import datetime, timedelta
import time
# Add reportlab imports
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart

# Authentication and session management
def init_session_state():
    """Initialize session state variables"""
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    if 'username' not in st.session_state:
        st.session_state.username = None
    if 'user_role' not in st.session_state:
        st.session_state.user_role = None
    if 'login_time' not in st.session_state:
        st.session_state.login_time = None

def hash_password(password):
    """Hash password for security"""
    return hashlib.sha256(password.encode()).hexdigest()

def load_users():
    """Load user credentials from file or create default users"""
    default_users = {
        "admin": {
            "password": hash_password("admin123"),
            "role": "Administrator",
            "full_name": "System Administrator"
        },
        "supervisor": {
            "password": hash_password("super123"),
            "role": "Supervisor",
            "full_name": "Lab Supervisor"
        },
        "analyst": {
            "password": hash_password("analyst123"),
            "role": "Analyst",
            "full_name": "Lab Analyst"
        }
    }
    
    if os.path.exists('users.json'):
        try:
            with open('users.json', 'r') as f:
                return json.load(f)
        except:
            return default_users
    else:
        # Save default users
        with open('users.json', 'w') as f:
            json.dump(default_users, f)
        return default_users

def authenticate_user(username, password):
    """Authenticate user credentials"""
    users = load_users()
    if username in users:
        if users[username]["password"] == hash_password(password):
            return True, users[username]["role"], users[username]["full_name"]
    return False, None, None

def login_form():
    """Display login form"""
    st.markdown("""
    <div style="max-width: 400px; margin: 0 auto; padding: 2rem; 
                border: 1px solid #ddd; border-radius: 10px; 
                background-color: #f8fcf9; margin-top: 2rem;">
        <h2 style="text-align: center; color: #218c5a;">SmartLab Access</h2>
        <p style="text-align: center; color: #666;">Please login to continue</p>
    </div>
    """, unsafe_allow_html=True)
    
    with st.container():
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            username = st.text_input("Username", placeholder="Enter your username")
            password = st.text_input("Password", type="password", placeholder="Enter your password")
            
            col_a, col_b = st.columns(2)
            with col_a:
                if st.button("Login", use_container_width=True):
                    if username and password:
                        success, role, full_name = authenticate_user(username, password)
                        if success:
                            st.session_state.authenticated = True
                            st.session_state.username = username
                            st.session_state.user_role = role
                            st.session_state.full_name = full_name
                            st.session_state.login_time = datetime.now()
                            st.success(f"Welcome, {full_name}!")
                            time.sleep(1)
                            st.rerun()
                        else:
                            st.error("Invalid username or password")
                    else:
                        st.error("Please enter both username and password")
            
            with col_b:
                if st.button("Demo Access", use_container_width=True):
                    st.session_state.authenticated = True
                    st.session_state.username = "demo"
                    st.session_state.user_role = "Demo"
                    st.session_state.full_name = "Demo User"
                    st.session_state.login_time = datetime.now()
                    st.success("Demo access granted!")
                    time.sleep(1)
                    st.rerun()
    
    # Show default credentials
    st.markdown("""
    <div style="max-width: 400px; margin: 2rem auto; padding: 1rem; 
                background-color: #e8f4fd; border-radius: 5px; font-size: 12px;">
        <b>Default Login Credentials:</b><br>
        Administrator: admin / admin123<br>
        Supervisor: supervisor / super123<br>
        Analyst: analyst / analyst123
    </div>
    """, unsafe_allow_html=True)

def logout():
    """Logout user"""
    st.session_state.authenticated = False
    st.session_state.username = None
    st.session_state.user_role = None
    st.session_state.full_name = None
    st.session_state.login_time = None
    st.rerun()

def check_session_timeout():
    """Check if session has timed out (24 hours)"""
    if st.session_state.login_time:
        if datetime.now() - st.session_state.login_time > timedelta(hours=24):
            logout()
            st.warning("Session expired. Please login again.")
            return False
    return True

def user_header():
    """Display user information in header"""
    if st.session_state.authenticated:
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            st.markdown(f"**Welcome, {st.session_state.full_name}** ({st.session_state.user_role})")
        with col2:
            login_duration = datetime.now() - st.session_state.login_time
            hours = int(login_duration.total_seconds() // 3600)
            minutes = int((login_duration.total_seconds() % 3600) // 60)
            st.markdown(f"*Session: {hours:02d}:{minutes:02d}*")
        with col3:
            if st.button("Logout", key="logout_btn"):
                logout()

# Page configuration
st.set_page_config(
    page_title="SmartLab Blood Test Data Analysis",
    page_icon=":microscope:",
    layout="wide"
)

# Initialize session state
init_session_state()

# Check authentication
if not st.session_state.authenticated:
    login_form()
    st.stop()

# Check session timeout
if not check_session_timeout():
    st.stop()

# Display user header
user_header()
st.markdown("<hr style='margin: 10px 0px;'>", unsafe_allow_html=True)

# Custom CSS for styling
st.markdown("""
<style>
    body, .stApp {
        background-color: #f8fcf9 !important;
    }
    .header-style {
        font-size: 28px;
        font-weight: bold;
        color: #218c5a;
        margin-bottom: 20px;
        letter-spacing: 1px;
    }
    .subheader-style {
        font-size: 22px;
        font-weight: bold;
        color: #27ae60;
        margin-top: 24px;
        margin-bottom: 12px;
        letter-spacing: 0.5px;
    }
    .info-box {
        background: linear-gradient(90deg, #e8f8f5 60%, #d4efdf 100%);
        padding: 18px;
        border-radius: 12px;
        margin-bottom: 22px;
        border-left: 5px solid #27ae60;
        color: #145a32;
        font-size: 16px;
    }
    .metric-box {
        background: #eafaf1;
        padding: 12px;
        border-radius: 10px;
        margin: 7px 0;
        border-left: 4px solid #27ae60;
        color: #145a32;
        font-size: 15px;
        box-shadow: 0 1px 4px rgba(39,174,96,0.07);
    }
    .calculation-box {
        background: #f4fef8;
        padding: 18px;
        border-radius: 10px;
        margin-top: 12px;
        border-left: 5px solid #218c5a;
        color: #186a3b;
        font-size: 15px;
        box-shadow: 0 1px 4px rgba(33,140,90,0.07);
    }
    .formula {
        font-family: 'Fira Mono', monospace;
        background: #eafaf1;
        padding: 5px 10px;
        border-radius: 5px;
        color: #218c5a;
        font-size: 15px;
    }
    .file-selector {
        background: #f8fcf9;
        padding: 14px;
        border-radius: 10px;
        margin-bottom: 18px;
        border: 1.5px solid #b7e1cd;
    }
    .option-tabs {
        margin-bottom: 22px;
    }
    .stDataFrame {
        width: 100%;
        background: #f8fcf9;
    }
    hr {
        border: none;
        height: 2px;
        background: linear-gradient(90deg, #27ae60 0%, #b7e1cd 100%);
        margin: 32px 0;
    }
    /* Grade color mapping */
    .css-1v0mbdj {background: #eafaf1 !important;}
</style>
""", unsafe_allow_html=True)

# Activity logging functions
def log_activity(action, details=""):
    """Log user activity"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "username": st.session_state.username,
        "role": st.session_state.user_role,
        "action": action,
        "details": details
    }
    
    # Append to log file
    log_file = "activity_log.json"
    if os.path.exists(log_file):
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

def get_activity_logs():
    """Get recent activity logs"""
    log_file = "activity_log.json"
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            return json.load(f)
    return []

# Log login activity
log_activity("LOGIN", f"User logged in as {st.session_state.user_role}")

st.title(':microscope: SmartLab Blood Test Data Analysis')
st.markdown('<div class="header-style">Comprehensive Laboratory Test Analysis with Z-Scores and Grading</div>', unsafe_allow_html=True)

# Function to split CSV by Model code
def process_multiple_csv_files(file_paths, output_folder="split_by_model_code"):
    """Process multiple CSV files and combine them before splitting by model code"""
    all_dataframes = []
    processed_files = []
    
    st.markdown('<div class="subheader-style">Processing Multiple CSV Files</div>', unsafe_allow_html=True)
    
    # Progress bar for file processing
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    for i, file_path in enumerate(file_paths):
        try:
            # Update progress
            progress = (i + 1) / len(file_paths)
            progress_bar.progress(progress)
            status_text.text(f"Processing file {i+1}/{len(file_paths)}: {os.path.basename(file_path)}")
            
            # Read CSV file
            df = pd.read_csv(file_path)
            df = df.replace(0, np.nan)
            
            # Add source file column for tracking
            df['Source_File'] = os.path.basename(file_path)
            
            # Data validation
            required_columns = ['Lab Code', 'Brand code', 'Model code']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                st.warning(f"Skipping {os.path.basename(file_path)}: Missing columns {', '.join(missing_columns)}")
                continue
            
            all_dataframes.append(df)
            processed_files.append(os.path.basename(file_path))
            
            # Show file processing status
            st.markdown(f"""
            <div style="margin-bottom:4px; padding:6px 10px; border-radius:4px; background-color:#E8F5E8; 
                        border-left:3px solid #27AE60; display:flex; align-items:center;">
                <span style="color:#229954; font-size:14px; margin-right:8px;">✓</span>
                <div>
                    <span style="font-weight:500; color:#2C3E50;">{os.path.basename(file_path)}</span>
                    <span style="margin-left:8px; color:#5D6D7E; font-size:12px;">({len(df)} records)</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
        except Exception as e:
            st.error(f"Error processing {os.path.basename(file_path)}: {str(e)}")
            continue
    
    progress_bar.empty()
    status_text.empty()
    
    if not all_dataframes:
        st.error("No valid CSV files were processed.")
        return None, None, None
    
    # Combine all dataframes
    combined_df = pd.concat(all_dataframes, ignore_index=True)
    
    # Save combined data
    combined_output_path = "Combined_Multiple_Files.csv"
    combined_df.to_csv(combined_output_path, index=False)
    
    st.success(f"Successfully combined {len(processed_files)} files into {combined_output_path}")
    
    # Show combined data summary
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Records", f"{len(combined_df)}")
    with col2:
        st.metric("Files Processed", f"{len(processed_files)}")
    with col3:
        st.metric("Unique Model Codes", f"{combined_df['Model code'].nunique()}")
    with col4:
        numeric_cols = combined_df.select_dtypes(include=np.number).columns
        missing_percentage = (combined_df[numeric_cols].isnull().sum().sum() / 
                           (len(combined_df) * len(numeric_cols)) * 100)
        st.metric("Missing Data %", f"{missing_percentage:.1f}%")
    
    return combined_df, processed_files, combined_output_path

def process_csv_files_from_directories(directories, output_folder="split_by_model_code"):
    """Process all CSV files from specified directories"""
    all_csv_files = []
    
    for directory in directories:
        if directory == ".":
            # Handle root directory specially
            csv_files = [f for f in os.listdir(".") if f.endswith('.csv') and not f.startswith('Combined_')]
            csv_files = [os.path.join(".", f) for f in csv_files]
            all_csv_files.extend(csv_files)
            st.info(f"Found {len(csv_files)} CSV files in root directory")
        elif os.path.exists(directory):
            csv_files = [os.path.join(directory, f) for f in os.listdir(directory) 
                        if f.endswith('.csv')]
            all_csv_files.extend(csv_files)
            st.info(f"Found {len(csv_files)} CSV files in {directory}")
        else:
            st.warning(f"Directory {directory} not found.")
    
    if not all_csv_files:
        st.error("No CSV files found in the specified directories.")
        return None, None, None
    
    st.info(f"Total CSV files found: {len(all_csv_files)}")
    
    # Show list of files to be processed
    with st.expander("Files to be processed:", expanded=False):
        for file_path in all_csv_files:
            st.write(f"• {file_path}")
    
    # Process all CSV files
    return process_multiple_csv_files(all_csv_files, output_folder)

def split_csv_by_model_code(df, output_folder="split_by_model_code"):
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Get unique Model codes
    unique_model_codes = df['Model code'].unique()
    model_dfs = {}
    
    # Split data by Model code
    for model_code in unique_model_codes:
        filtered_df = df[df['Model code'] == model_code]
        model_dfs[model_code] = filtered_df
        
        # Save to CSV with enhanced feedback
        output_filename = f"BloodData_Model_{model_code}.csv"
        output_path = os.path.join(output_folder, output_filename)
        filtered_df.to_csv(output_path, index=False)
        
        # Display a nice confirmation for each saved file with styled message
        st.markdown(f"""
        <div style="margin-bottom:8px; padding:8px 12px; border-radius:6px; background-color:#E8F4FD; 
                    border-left:3px solid #3498db; display:flex; align-items:center;">
            <span style="color:#2874A6; font-size:16px; margin-right:10px;">Save</span>
            <div>
                <span style="font-weight:600; color:#2C3E50;">{output_filename}</span>
                <span style="margin-left:8px; color:#5D6D7E; font-size:13px;">({len(filtered_df)} records saved)</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    return model_dfs, list(unique_model_codes)  # Ensure it's a list

# Function to load previously split files
def load_split_model_files(directory="split_by_model_code"):
    """Load all split model files from the specified directory"""
    model_dfs = {}
    if os.path.exists(directory):
        model_files = [f for f in os.listdir(directory) if f.startswith("BloodData_Model_") and f.endswith(".csv")]
        
        if not model_files:
            st.warning(f"No model files found in {directory} directory. Please upload and split a file first.")
            return None, None
        
        unique_model_codes = []
        for file in model_files:
            try:
                # Extract model code from filename
                model_code = int(file.replace("BloodData_Model_", "").replace(".csv", ""))
                file_path = os.path.join(directory, file)
                
                # Load the file
                df = pd.read_csv(file_path)
                df = df.replace(0, np.nan)  # Replace zeros with NaN
                
                model_dfs[model_code] = df
                unique_model_codes.append(model_code)
                
            except Exception as e:
                st.error(f"Error loading {file}: {str(e)}")
                continue
        
        return model_dfs, unique_model_codes
    else:
        st.warning(f"Directory {directory} not found. Please upload and split a file first.")
        return None, None

# Add option to either upload new file, process multiple files, or load existing split files
data_source = st.radio(
    "Choose your data source:",
    ["Upload a new CSV file", "Process multiple CSV files", "Load previously split files"],
    key="data_source",
    horizontal=True
)

if data_source == "Upload a new CSV file":
    # File upload section
    with st.expander("Upload Your Data", expanded=True):
        uploaded_file = st.file_uploader("Choose a CSV file containing lab test results", type=["csv"])
        st.markdown("""
        <div class="info-box">
            <b>File Requirements:</b><br>
            - CSV format with lab test results<br>
            - Should contain numeric test values<br>
            - Should include 'Lab Code' and 'Model code' columns<br>
            - Zero values will be treated as missing data
        </div>
        """, unsafe_allow_html=True)

    if uploaded_file is not None:
        # Log file upload activity
        log_activity("FILE_UPLOAD", f"Uploaded file: {uploaded_file.name}")
        
        # Read and process data with better error handling
        try:
            meandata = pd.read_csv(uploaded_file)
            meandata = meandata.replace(0, np.nan)
            
            # Data validation
            required_columns = ['Lab Code', 'Brand code', 'Model code']
            missing_columns = [col for col in required_columns if col not in meandata.columns]
            
            if missing_columns:
                st.error(f"Missing required columns: {', '.join(missing_columns)}")
                st.stop()
            
            # Data quality checks
            st.markdown('<div class="subheader-style">Data Quality Assessment</div>', unsafe_allow_html=True)
            
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Records", f"{len(meandata)}")
            with col2:
                st.metric("Unique Model Codes", f"{meandata['Model code'].nunique()}")
            with col3:
                st.metric("Unique Lab Codes", f"{meandata['Lab Code'].nunique()}")
            with col4:
                numeric_cols_preview = meandata.select_dtypes(include=np.number).columns
                missing_percentage = (meandata[numeric_cols_preview].isnull().sum().sum() / 
                                   (len(meandata) * len(numeric_cols_preview)) * 100)
                st.metric("Missing Data %", f"{missing_percentage:.1f}%")
            
            # Show data preview
            with st.expander("Data Preview (First 10 rows)"):
                st.dataframe(meandata.head(10))
            
            # Split data by Model code
            st.markdown('<div class="subheader-style">Split Data by Model Code</div>', unsafe_allow_html=True)
            
            # Add progress indicator for splitting operation
            with st.spinner("Splitting data by model code..."):
                model_dfs, unique_model_codes = split_csv_by_model_code(meandata)
            
            # Log splitting activity
            log_activity("DATA_SPLIT", f"Split data into {len(unique_model_codes)} model groups")
            
            # Show success message with enhanced styling
            st.markdown(f"""
            <div style="background-color:#eafaf1; padding:15px; border-radius:10px; border-left:5px solid #27ae60; margin:20px 0px;">
                <h4 style="color:#218c5a; margin-top:0;">Data Successfully Split!</h4>
                <p>Your data has been split into <b>{len(unique_model_codes)}</b> separate files based on Model code.</p>
                <p>Each file has been saved and is available for individual analysis.</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Show download buttons for each split file
            st.markdown('<div class="subheader-style">Download Split Files</div>', unsafe_allow_html=True)
            for model_code in unique_model_codes:
                output_filename = f"BloodData_Model_{model_code}.csv"
                output_path = os.path.join("split_by_model_code", output_filename)
                with open(output_path, "rb") as f:
                    st.download_button(
                        label=f"Download {output_filename}",
                        data=f,
                        file_name=output_filename,
                        mime="text/csv",
                        use_container_width=True
                    )
        
        except Exception as e:
            st.error(f"Error processing file: {str(e)}")
            log_activity("ERROR", f"File processing error: {str(e)}")
            st.stop()
        
        # Proceed with analysis
        
elif data_source == "Process multiple CSV files":
    # Multiple files processing section
    with st.expander("Process Multiple CSV Files", expanded=True):
        st.markdown("""
        <div class="info-box">
            <b>Multiple Files Processing:</b><br>
            - Process all CSV files from specified directories<br>
            - Automatically combine data from multiple sources<br>
            - Split combined data by Model code<br>
            - Handles files from: split_by_model_code, Blood Test Mockup CSVs Sept 28 2025, and root directory
        </div>
        """, unsafe_allow_html=True)
        
        # Directory selection
        available_directories = []
        
        # Check for common directories
        if os.path.exists("split_by_model_code"):
            available_directories.append("split_by_model_code")
        if os.path.exists("Blood Test Mockup CSVs Sept 28 2025"):
            available_directories.append("Blood Test Mockup CSVs Sept 28 2025")
        
        # Check for CSV files in root directory
        root_csv_files = [f for f in os.listdir(".") if f.endswith('.csv')]
        if root_csv_files:
            available_directories.append("Root Directory (current folder)")
        
        if not available_directories:
            st.warning("No directories with CSV files found.")
        else:
            selected_directories = st.multiselect(
                "Select directories to process:",
                available_directories,
                default=available_directories
            )
            
            if st.button("Process All CSV Files"):
                if not selected_directories:
                    st.warning("Please select at least one directory.")
                else:
                    # Map friendly names to actual paths
                    directory_paths = []
                    for dir_name in selected_directories:
                        if dir_name == "Root Directory (current folder)":
                            directory_paths.append(".")
                        else:
                            directory_paths.append(dir_name)
                    
                    # Process files from selected directories
                    with st.spinner("Processing multiple CSV files..."):
                        try:
                            meandata, processed_files, combined_file_path = process_csv_files_from_directories(directory_paths)
                            
                            if meandata is not None:
                                log_activity("MULTI_FILE_PROCESS", f"Processed {len(processed_files)} files")
                                
                                # Show data preview
                                with st.expander("Combined Data Preview (First 10 rows)"):
                                    st.dataframe(meandata.head(10))
                                
                                # Split combined data by Model code
                                st.markdown('<div class="subheader-style">Split Combined Data by Model Code</div>', unsafe_allow_html=True)
                                
                                with st.spinner("Splitting combined data by model code..."):
                                    model_dfs, unique_model_codes = split_csv_by_model_code(meandata)
                                
                                # Log splitting activity
                                log_activity("DATA_SPLIT", f"Split combined data into {len(unique_model_codes)} model groups")
                                
                                # Show success message
                                st.markdown(f"""
                                <div style="background-color:#eafaf1; padding:15px; border-radius:10px; border-left:5px solid #27ae60; margin:20px 0px;">
                                    <h4 style="color:#218c5a; margin-top:0;">Multiple Files Successfully Processed!</h4>
                                    <p>Processed <b>{len(processed_files)}</b> CSV files and split into <b>{len(unique_model_codes)}</b> model groups.</p>
                                    <p>Combined data saved as: <b>{combined_file_path}</b></p>
                                </div>
                                """, unsafe_allow_html=True)
                                
                                # Show download buttons
                                st.markdown('<div class="subheader-style">Download Files</div>', unsafe_allow_html=True)
                                
                                # Download combined file
                                with open(combined_file_path, "rb") as f:
                                    st.download_button(
                                        label=f"Download Combined File ({combined_file_path})",
                                        data=f,
                                        file_name=combined_file_path,
                                        mime="text/csv",
                                        use_container_width=True
                                    )
                                
                                # Download split files
                                for model_code in unique_model_codes:
                                    output_filename = f"BloodData_Model_{model_code}.csv"
                                    output_path = os.path.join("split_by_model_code", output_filename)
                                    with open(output_path, "rb") as f:
                                        st.download_button(
                                            label=f"Download {output_filename}",
                                            data=f,
                                            file_name=output_filename,
                                            mime="text/csv",
                                            use_container_width=True
                                        )
                        
                        except Exception as e:
                            st.error(f"Error processing multiple files: {str(e)}")
                            log_activity("ERROR", f"Multi-file processing error: {str(e)}")

else:  # Load previously split files
    with st.expander("Load Previously Split Files", expanded=True):
        st.markdown("""
        <div class="info-box">
            The system will load all CSV files from the 'split_by_model_code' directory that 
            match the pattern 'BloodData_Model_XXX.csv'.
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Load Split Files"):
            with st.spinner("Loading split model files..."):
                model_dfs, unique_model_codes = load_split_model_files()
                
                if model_dfs and unique_model_codes:
                    # Show success message with enhanced styling
                    st.markdown(f"""
                    <div style="background-color:#E9F7EF; padding:15px; border-radius:10px; border-left:5px solid #2ECC71; margin:20px 0px;">
                        <h4 style="color:#27AE60; margin-top:0;">Files Successfully Loaded!</h4>
                        <p>Loaded <b>{len(unique_model_codes)}</b> model files from the split_by_model_code directory.</p>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Display available model codes
                    st.markdown('<div style="margin-top:10px; margin-bottom:15px;"><b>Available Model Codes:</b></div>', unsafe_allow_html=True)
                    
                    # Create a grid of model code buttons with record counts
                    cols = st.columns(4)  # Adjust number of columns as needed
                    for i, model_code in enumerate(unique_model_codes):
                        with cols[i % 4]:
                            record_count = len(model_dfs[model_code])
                            st.markdown(f"""
                            <div style="background-color:#F8F9F9; padding:10px; border-radius:8px; margin-bottom:10px; 
                                        border:1px solid #D5DBDB; text-align:center;">
                                <div style="font-weight:bold; font-size:16px; color:#2874A6;">Model {model_code}</div>
                                <div style="color:#566573; font-size:14px;">{record_count} records</div>
                            </div>
                            """, unsafe_allow_html=True)

# Continue with analysis if model_dfs is available
if 'model_dfs' in locals() and model_dfs and unique_model_codes is not None and len(unique_model_codes) > 0:
    
    # Add Analytics Dashboard for Administrators
    if st.session_state.user_role in ["Administrator", "Supervisor"]:
        with st.expander("Analytics Dashboard", expanded=False):
            st.markdown("### System Overview")
            
            # Overall statistics
            total_records = sum(len(df) for df in model_dfs.values())
            total_models = len(model_dfs)
            total_labs = len(set().union(*[df['Lab Code'].unique() for df in model_dfs.values()]))
            
            dash_col1, dash_col2, dash_col3, dash_col4 = st.columns(4)
            with dash_col1:
                st.metric("Total Records", total_records)
            with dash_col2:
                st.metric("Model Codes", total_models)
            with dash_col3:
                st.metric("Laboratory Codes", total_labs)
            with dash_col4:
                # Show recent activity count
                recent_logs = get_activity_logs()
                today_logs = [log for log in recent_logs 
                            if datetime.fromisoformat(log['timestamp']).date() == datetime.now().date()]
                st.metric("Today's Activities", len(today_logs))
            
            # Model distribution chart
            model_counts = {str(model): len(df) for model, df in model_dfs.items()}
            
            if model_counts:
                st.markdown("#### Records by Model Code")
                fig, ax = plt.subplots(figsize=(10, 4))
                models = list(model_counts.keys())
                counts = list(model_counts.values())
                
                bars = ax.bar(models, counts, color='#27ae60')
                ax.set_xlabel('Model Code')
                ax.set_ylabel('Number of Records')
                ax.set_title('Data Distribution Across Model Codes')
                
                # Add value labels on bars
                for bar in bars:
                    height = bar.get_height()
                    ax.text(bar.get_x() + bar.get_width()/2., height,
                           f'{int(height)}', ha='center', va='bottom')
                
                plt.xticks(rotation=45)
                plt.tight_layout()
                st.pyplot(fig)
            
            # Recent activity log for admins
            if st.session_state.user_role == "Administrator":
                st.markdown("#### Recent System Activity")
                recent_logs = get_activity_logs()[-10:]  # Last 10 activities
                
                if recent_logs:
                    activity_df = pd.DataFrame(recent_logs)
                    activity_df['timestamp'] = pd.to_datetime(activity_df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
                    st.dataframe(
                        activity_df[['timestamp', 'username', 'role', 'action', 'details']],
                        use_container_width=True,
                        hide_index=True
                    )
    # Allow user to select a Model code for analysis
    st.markdown("""
    <div style="background-color:#EBF5FB; padding:15px; border-radius:8px; margin-top:20px; margin-bottom:15px;">
        <p style="margin:0; font-weight:bold;">Select a model code to analyze its data:</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Enhanced model selector with additional information
    col1, col2 = st.columns([3, 1])
    
    with col1:
        selected_model = st.selectbox(
            "Choose Model Code",
            options=unique_model_codes,
            format_func=lambda x: f"Model {x} ({len(model_dfs[x])} records)",
            index=0,
            key="model_selector"
        )
    
    with col2:
        # Show model-specific statistics
        if selected_model:
            model_data = model_dfs[selected_model]
            unique_labs = model_data['Lab Code'].nunique()
            st.metric("Labs in Model", unique_labs)
    
    # Log model selection
    if selected_model:
        log_activity("MODEL_SELECTED", f"Selected Model {selected_model} for analysis")
    
    # Add a divider before proceeding with the analysis
    st.markdown("<hr style='margin:30px 0px; border:none; height:1px; background-color:#D5D8DC;'>", unsafe_allow_html=True)
    
    # Use the selected model's data for further analysis
    meandata = model_dfs[selected_model]
    
    # Step-by-Step Analysis Interface
    st.markdown('<div class="subheader-style">Step-by-Step Analysis</div>', unsafe_allow_html=True)
    
    # Create tabs for step-by-step process
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "Step 1: Data Overview", 
        "Step 2: Data Quality Check", 
        "Step 3: Statistical Analysis", 
        "Step 4: Z-Score Calculation", 
        "Step 5: Final Results"
    ])
    
    # Select numeric columns, excluding non-test columns
    non_test_columns = ['Lab Code', 'Brand code', 'Model code']
    numeric_cols = meandata.select_dtypes(include=np.number).columns
    numeric_cols = [col for col in numeric_cols if col not in non_test_columns]
    
    with tab1:
        st.markdown("### Data Overview - Model " + str(selected_model))
        
        # Basic statistics
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Records", len(meandata))
        with col2:
            st.metric("Laboratory Codes", meandata['Lab Code'].nunique())
        with col3:
            st.metric("Test Parameters", len(numeric_cols))
        with col4:
            st.metric("Brand Codes", meandata['Brand code'].nunique())
        
        # Show raw data with highlighting
        st.markdown("#### Raw Data Preview")
        st.markdown("*This is your original data before any processing*")
        
        # Color-code extreme values in preview
        def highlight_extreme_values(val):
            try:
                # Convert to float for comparison
                val_float = float(val)
                # Simple outlier detection: values > 3 standard deviations
                if abs(val_float) > 1000:  # Very high values
                    return 'background-color: #ffcccc'
                elif val_float == 0:  # Zero values
                    return 'background-color: #fff3cd'
                elif val_float < 0:  # Negative values
                    return 'background-color: #f8d7da'
            except:
                pass
            return ''
        
        # Apply styling to numeric columns only
        preview_data = meandata.head(10).copy()
        styled_preview = preview_data.style.applymap(
            highlight_extreme_values, 
            subset=numeric_cols
        )
        
        st.dataframe(styled_preview, use_container_width=True)
        
        # Legend for colors
        st.markdown("""
        **Color Legend:**
        - Light Red: Very high values (>1000)
        - Light Yellow: Zero values
        - Light Pink: Negative values
        """)
    
    with tab2:
        st.markdown("### Data Quality Assessment")
        
        # Missing data analysis
        st.markdown("#### Missing Data Analysis")
        missing_data = meandata[numeric_cols].isnull().sum()
        missing_percent = (missing_data / len(meandata) * 100).round(2)
        
        missing_df = pd.DataFrame({
            'Test': missing_data.index,
            'Missing Count': missing_data.values,
            'Missing %': missing_percent.values
        })
        
        # Highlight tests with high missing data
        def highlight_missing(row):
            if row['Missing %'] > 50:
                return ['background-color: #f8d7da'] * len(row)
            elif row['Missing %'] > 20:
                return ['background-color: #fff3cd'] * len(row)
            elif row['Missing %'] > 0:
                return ['background-color: #d1ecf1'] * len(row)
            return [''] * len(row)
        
        styled_missing = missing_df.style.apply(highlight_missing, axis=1)
        st.dataframe(styled_missing, use_container_width=True, hide_index=True)
        
        # Quality issues detection
        st.markdown("#### Quality Issues Detection")
        
        quality_issues = []
        for col in numeric_cols:
            col_data = meandata[col].dropna()
            if len(col_data) > 0:
                # Check for extreme values
                q1 = col_data.quantile(0.25)
                q3 = col_data.quantile(0.75)
                iqr = q3 - q1
                lower_bound = q1 - 3 * iqr
                upper_bound = q3 + 3 * iqr
                
                extreme_count = len(col_data[(col_data < lower_bound) | (col_data > upper_bound)])
                zero_count = len(col_data[col_data == 0])
                negative_count = len(col_data[col_data < 0])
                
                if extreme_count > 0:
                    extreme_labs = meandata[
                        (meandata[col] < lower_bound) | (meandata[col] > upper_bound)
                    ]['Lab Code'].tolist()
                    quality_issues.append({
                        'Test': col,
                        'Issue': 'Extreme Values',
                        'Count': extreme_count,
                        'Affected Labs': ', '.join(map(str, extreme_labs[:5])) + ('...' if len(extreme_labs) > 5 else ''),
                        'Severity': 'High' if extreme_count > len(col_data) * 0.1 else 'Medium'
                    })
                
                if zero_count > len(col_data) * 0.1:  # More than 10% zeros
                    zero_labs = meandata[meandata[col] == 0]['Lab Code'].tolist()
                    quality_issues.append({
                        'Test': col,
                        'Issue': 'High Zero Values',
                        'Count': zero_count,
                        'Affected Labs': ', '.join(map(str, zero_labs[:5])) + ('...' if len(zero_labs) > 5 else ''),
                        'Severity': 'Medium'
                    })
                
                if negative_count > 0:
                    neg_labs = meandata[meandata[col] < 0]['Lab Code'].tolist()
                    quality_issues.append({
                        'Test': col,
                        'Issue': 'Negative Values',
                        'Count': negative_count,
                        'Affected Labs': ', '.join(map(str, neg_labs)),
                        'Severity': 'High'
                    })
        
        if quality_issues:
            issues_df = pd.DataFrame(quality_issues)
            
            def highlight_severity(row):
                if row['Severity'] == 'High':
                    return ['background-color: #f8d7da'] * len(row)
                elif row['Severity'] == 'Medium':
                    return ['background-color: #fff3cd'] * len(row)
                return [''] * len(row)
            
            styled_issues = issues_df.style.apply(highlight_severity, axis=1)
            st.dataframe(styled_issues, use_container_width=True, hide_index=True)
            
            # Log quality issues
            log_activity("QUALITY_ISSUES", f"Found {len(quality_issues)} quality issues in Model {selected_model}")
        else:
            st.success("No significant quality issues detected!")
    
    with tab3:
        st.markdown("### 📈 Statistical Analysis")
        
        # Calculate statistics before processing
        stats_dict = {}
        for col in numeric_cols:
            col_data = meandata[col].dropna()
            if len(col_data) > 0:
                stats_dict[col] = {
                    'mean': col_data.mean(),
                    'std': col_data.std(),
                    'median': col_data.median(),
                    'min': col_data.min(),
                    'max': col_data.max(),
                    'count': len(col_data),
                    'cv': (col_data.std() / col_data.mean() * 100) if col_data.mean() != 0 else 0
                }
            else:
                stats_dict[col] = {
                    'mean': np.nan, 'std': np.nan, 'median': np.nan,
                    'min': np.nan, 'max': np.nan, 'count': 0, 'cv': np.nan
                }
        
        stats_df = pd.DataFrame({
            'Test': numeric_cols,
            'Mean': [stats_dict[col]['mean'] for col in numeric_cols],
            'Std Dev': [stats_dict[col]['std'] for col in numeric_cols],
            'Median': [stats_dict[col]['median'] for col in numeric_cols],
            'Min': [stats_dict[col]['min'] for col in numeric_cols],
            'Max': [stats_dict[col]['max'] for col in numeric_cols],
            'Count': [stats_dict[col]['count'] for col in numeric_cols],
            'CV%': [stats_dict[col]['cv'] for col in numeric_cols]
        }).round(2)
        
        # Highlight problematic statistics
        def highlight_stats(row):
            styles = [''] * len(row)
            # High coefficient of variation (>30%)
            if not pd.isna(row['CV%']) and row['CV%'] > 30:
                styles[7] = 'background-color: #fff3cd'  # CV% column
            # Low sample count
            if row['Count'] < 10:
                styles[6] = 'background-color: #f8d7da'  # Count column
            return styles
        
        styled_stats = stats_df.style.apply(highlight_stats, axis=1)
        st.dataframe(styled_stats, use_container_width=True, hide_index=True)
        
        st.markdown("""
        **Statistical Quality Indicators:**
        - Yellow: High variability (CV% > 30%)
        - Red: Low sample size (< 10 samples)
        - CV% = Coefficient of Variation (Std Dev / Mean × 100)
        """)
    
    with tab4:
        st.markdown("### ⚡ Z-Score Calculation Process")
        
        st.markdown("#### Z-Score Formula")
        st.latex(r"Z = \frac{X - \mu}{\sigma}")
        st.markdown("Where: X = individual value, μ = population mean, σ = population standard deviation")
        
        # Process data - Include original columns in output
        new_columns = ['Lab Code', 'Brand code', 'Model code']
        
        for col in numeric_cols:
            new_columns.extend([col, f'{col}_zscore', f'{col}_grade'])
        
        # Store calculation details in a separate DataFrame
        calc_details = pd.DataFrame(index=meandata.index)
        
        # Calculate Z-scores with step-by-step explanation
        for col in numeric_cols:
            if col in stats_dict and not pd.isna(stats_dict[col]['mean']):
                mean_val = stats_dict[col]['mean']
                std_val = stats_dict[col]['std']
                
                if std_val != 0:  # Avoid division by zero
                    meandata[f'{col}_zscore'] = (meandata[col] - mean_val) / std_val
                    meandata[f'{col}_zscore'] = meandata[f'{col}_zscore'].round(2)
                    
                    # Store calculation details
                    calc_details[f'{col}_calculation'] = meandata.apply(
                        lambda row: f"Z = ({row[col]:.2f} - {mean_val:.2f}) / {std_val:.2f} = {row[f'{col}_zscore']}" 
                        if not pd.isna(row[col]) else "No data available", 
                        axis=1
                    )
                else:
                    meandata[f'{col}_zscore'] = 0
                    calc_details[f'{col}_calculation'] = "Standard deviation is 0"
            else:
                meandata[f'{col}_zscore'] = np.nan
                calc_details[f'{col}_calculation'] = "Insufficient data"
        
        # Show sample calculations
        st.markdown("#### Sample Z-Score Calculations")
        sample_lab = st.selectbox("Select a lab to see detailed calculations:", 
                                 options=meandata['Lab Code'].unique()[:10],
                                 key="sample_calc_lab")
        
        if sample_lab:
            sample_row = meandata[meandata['Lab Code'] == sample_lab].iloc[0]
            sample_idx = meandata[meandata['Lab Code'] == sample_lab].index[0]
            
            for col in numeric_cols[:3]:  # Show first 3 tests
                if not pd.isna(sample_row[col]):
                    st.markdown(f"""
                    **{col} for Lab {sample_lab}:**
                    - Raw Value: {sample_row[col]:.2f}
                    - {calc_details.loc[sample_idx, f'{col}_calculation']}
                    """)
    
    with tab5:
        st.markdown("### 📋 Final Results with Problem Highlighting")
        
        # Define grading function
        def assign_grade(zscore):
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
        
        # Apply grading
        for col in numeric_cols:
            if f'{col}_zscore' in meandata.columns:
                meandata[f'{col}_grade'] = meandata[f'{col}_zscore'].apply(assign_grade)
                
                # Store grade explanation
                calc_details[f'{col}_grade_explanation'] = meandata.apply(
                    lambda row: f"Grade '{row[f'{col}_grade']}' because |Z-Score| = {abs(row[f'{col}_zscore']) if not pd.isna(row[f'{col}_zscore']) else 'N/A'}" +
                               (f" ≤ 0.5" if row[f'{col}_grade'] == "Excellent" else
                                f" ≤ 1.0" if row[f'{col}_grade'] == "Good" else
                                f" ≤ 2.0" if row[f'{col}_grade'] == "Satisfactory" else
                                f" ≤ 3.0" if row[f'{col}_grade'] == "Unsatisfactory" else
                                f" > 3.0" if row[f'{col}_grade'] == "Serious problem" else "")
                    if not pd.isna(row[f'{col}_zscore']) else "No data available for grading",
                    axis=1
                )
        
        # Ensure all original columns are included
        meandata = meandata[['Lab Code', 'Brand code', 'Model code'] + [col for col in meandata.columns if col not in ['Lab Code', 'Brand code', 'Model code']]]
        meandata = meandata[new_columns]
        
        # Problem Summary Dashboard
        st.markdown("#### 🚨 Problem Summary")
        
        problem_summary = []
        for col in numeric_cols:
            if f'{col}_grade' in meandata.columns:
                grade_counts = meandata[f'{col}_grade'].value_counts()
                
                serious_count = grade_counts.get('Serious problem', 0)
                unsatisfactory_count = grade_counts.get('Unsatisfactory', 0)
                
                if serious_count > 0:
                    serious_labs = meandata[meandata[f'{col}_grade'] == 'Serious problem']['Lab Code'].tolist()
                    problem_summary.append({
                        'Test': col,
                        'Issue Level': 'CRITICAL',
                        'Lab Count': serious_count,
                        'Affected Labs': ', '.join(map(str, serious_labs[:5])) + ('...' if len(serious_labs) > 5 else ''),
                        'Action Required': 'IMMEDIATE REVIEW'
                    })
                
                if unsatisfactory_count > 0:
                    unsat_labs = meandata[meandata[f'{col}_grade'] == 'Unsatisfactory']['Lab Code'].tolist()
                    problem_summary.append({
                        'Test': col,
                        'Issue Level': 'WARNING',
                        'Lab Count': unsatisfactory_count,
                        'Affected Labs': ', '.join(map(str, unsat_labs[:5])) + ('...' if len(unsat_labs) > 5 else ''),
                        'Action Required': 'SCHEDULE REVIEW'
                    })
        
        if problem_summary:
            problem_df = pd.DataFrame(problem_summary)
            
            def highlight_problem_level(row):
                if row['Issue Level'] == 'CRITICAL':
                    return ['background-color: #dc3545; color: white'] * len(row)
                elif row['Issue Level'] == 'WARNING':
                    return ['background-color: #ffc107; color: black'] * len(row)
                return [''] * len(row)
            
            styled_problems = problem_df.style.apply(highlight_problem_level, axis=1)
            st.dataframe(styled_problems, use_container_width=True, hide_index=True)
            
            # Show detailed problem breakdown
            if st.button("Show Detailed Problem Analysis"):
                st.markdown("#### Detailed Problem Breakdown")
                
                for _, problem in problem_df.iterrows():
                    with st.expander(f"🚨 {problem['Test']} - {problem['Issue Level']}"):
                        test_col = problem['Test']
                        
                        if problem['Issue Level'] == 'CRITICAL':
                            problem_data = meandata[meandata[f'{test_col}_grade'] == 'Serious problem']
                        else:
                            problem_data = meandata[meandata[f'{test_col}_grade'] == 'Unsatisfactory']
                        
                        st.markdown(f"**Affected Laboratories ({len(problem_data)} total):**")
                        
                        for _, row in problem_data.iterrows():
                            z_score = row[f'{test_col}_zscore']
                            raw_value = row[test_col]
                            lab_code = row['Lab Code']
                            
                            st.markdown(f"""
                            - **Lab {lab_code}**: Value = {raw_value:.2f}, Z-Score = {z_score:.2f}
                              - Calculation: {calc_details.loc[row.name, f'{test_col}_calculation']}
                              - Reason: {calc_details.loc[row.name, f'{test_col}_grade_explanation']}
                            """)
        else:
            st.success("🎉 No critical problems found! All labs are performing within acceptable ranges.")
        
        # Display results with enhanced styling
        st.markdown("#### Complete Results Table")
        
        # Apply styling
        def color_grade(val):
            color_map = {
                'Excellent': 'background-color: #28a745; color: white;',
                'Good': 'background-color: #6f42c1; color: white;',
                'Satisfactory': 'background-color: #ffc107; color: black;',
                'Unsatisfactory': 'background-color: #fd7e14; color: white;',
                'Serious problem': 'background-color: #dc3545; color: white;',
                'No data': 'background-color: #6c757d; color: white;'
            }
            return color_map.get(val, '')
        
        # Apply styling to grade columns
        grade_columns = [col for col in meandata.columns if '_grade' in col]
        styled_df = meandata.style.applymap(color_grade, subset=grade_columns)
        
        # Format numeric columns
        numeric_format = {col: "{:.2f}" for col in numeric_cols}
        zscore_format = {col: "{:.2f}" for col in meandata.columns if '_zscore' in col}
        styled_df = styled_df.format({**numeric_format, **zscore_format})
        
        st.dataframe(styled_df, height=400, use_container_width=True)
        
        # Grade distribution summary
        st.markdown("#### Grade Distribution Summary")
        grade_summary = {}
        
        for col in numeric_cols:
            if f'{col}_grade' in meandata.columns:
                grade_counts = meandata[f'{col}_grade'].value_counts()
                grade_summary[col] = grade_counts.to_dict()
        
        if grade_summary:
            summary_data = []
            for test, grades in grade_summary.items():
                row = {'Test': test}
                for grade in ['Excellent', 'Good', 'Satisfactory', 'Unsatisfactory', 'Serious problem', 'No data']:
                    row[grade] = grades.get(grade, 0)
                summary_data.append(row)
            
            summary_df = pd.DataFrame(summary_data)
            st.dataframe(summary_df, use_container_width=True, hide_index=True)
    
    # Calculation explanations
    st.markdown('<div class="subheader-style">Calculation Methodology</div>', unsafe_allow_html=True)
    
    # Advanced settings for administrators
    if st.session_state.user_role in ["Administrator", "Supervisor"]:
        with st.expander("⚙️ Advanced Analysis Settings"):
            st.markdown("### Z-Score Grading Thresholds")
            
            col1, col2 = st.columns(2)
            with col1:
                excellent_threshold = st.slider("Excellent threshold", 0.1, 1.0, 0.5, 0.1,
                                               help="Z-score ≤ this value = Excellent")
                good_threshold = st.slider("Good threshold", 0.5, 2.0, 1.0, 0.1,
                                         help="Z-score ≤ this value = Good")
            with col2:
                satisfactory_threshold = st.slider("Satisfactory threshold", 1.0, 3.0, 2.0, 0.1,
                                                  help="Z-score ≤ this value = Satisfactory")
                unsatisfactory_threshold = st.slider("Unsatisfactory threshold", 2.0, 4.0, 3.0, 0.1,
                                                    help="Z-score ≤ this value = Unsatisfactory")
            
            # Update the grading function with custom thresholds
            def assign_grade_custom(zscore):
                if pd.isna(zscore):
                    return "No data"
                zscore = abs(zscore)
                if zscore <= excellent_threshold:
                    return "Excellent"
                elif zscore <= good_threshold:
                    return "Good"
                elif zscore <= satisfactory_threshold:
                    return "Satisfactory"
                elif zscore <= unsatisfactory_threshold:
                    return "Unsatisfactory"
                else:
                    return "Serious problem"
            
            # Use custom grading if settings changed
            if (excellent_threshold != 0.5 or good_threshold != 1.0 or 
                satisfactory_threshold != 2.0 or unsatisfactory_threshold != 3.0):
                st.info("Using custom grading thresholds")
                assign_grade = assign_grade_custom
                log_activity("SETTINGS_CHANGE", 
                           f"Modified grading thresholds: E≤{excellent_threshold}, G≤{good_threshold}, S≤{satisfactory_threshold}, U≤{unsatisfactory_threshold}")
    
    with st.expander("ℹ️ How the Analysis Works"):
        st.markdown("""
        <div class="info-box">
            <h4>Z-Score Calculation:</h4>
            <p>Z-scores measure how many standard deviations a value is from the mean.</p>
            <p><b>Formula:</b> <code>z = (x - μ) / σ</code></p>
            <p>Where:<br>
            - <code>x</code> = individual test value<br>
            - <code>μ</code> = mean of all values for that test<br>
            - <code>σ</code> = standard deviation of all values for that test</p>
            
        <h4>Grading System:</h4>
        <p>Grades are assigned based on the absolute z-score:</p>
        <ul>
            <li><b>Excellent:</b> |z| ≤ 0.5 (very close to mean)</li>
            <li><b>Good:</b> 0.5 < |z| ≤ 1 (moderately close to mean)</li>
            <li><b>Satisfactory:</b> 1 < |z| ≤ 2 (somewhat far from mean)</li>
            <li><b>Unsatisfactory:</b> 2 < |z| ≤ 3 (far from mean)</li>
            <li><b>Serious problem:</b> |z| > 3 (very far from mean)</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
    
    # Calculate statistics before processing
    stats_dict = {}
    for col in numeric_cols:
        stats_dict[col] = {
            'mean': meandata[col].mean(),
            'std': meandata[col].std(),
            'count': meandata[col].count()
        }
    
    stats_df = pd.DataFrame({
        'Test': numeric_cols,
        'Average': [stats_dict[col]['mean'] for col in numeric_cols],
        'Std Dev': [stats_dict[col]['std'] for col in numeric_cols],
        'Count': [stats_dict[col]['count'] for col in numeric_cols]
    }).round(2)
    
    # Show statistics
    st.markdown('<div class="subheader-style">Test Statistics</div>', unsafe_allow_html=True)
    cols = st.columns(4)
    for i, row in stats_df.iterrows():
        with cols[i % 4]:
            st.markdown(f"""
            <div class="metric-box">
                <b>{row['Test']}</b><br>
                Avg: {row['Average']}<br>
                SD: {row['Std Dev']}<br>
                N: {row['Count']}
            </div>
            """, unsafe_allow_html=True)
    
    # Process data - Include original columns in output
    new_columns = ['Lab Code', 'Brand code', 'Model code']
    
    for col in numeric_cols:
        new_columns.extend([col, f'{col}_zscore', f'{col}_grade'])
    
    # Store calculation details in a separate DataFrame
    calc_details = pd.DataFrame(index=meandata.index)
    
    for col in numeric_cols:
        mean_val = stats_dict[col]['mean']
        std_val = stats_dict[col]['std']
        
        meandata[f'{col}_zscore'] = (meandata[col] - mean_val) / std_val
        meandata[f'{col}_zscore'] = meandata[f'{col}_zscore'].round(2)
        
        # Store calculation details
        calc_details[f'{col}_calculation'] = meandata.apply(
            lambda row: f"Z-Score = ({row[col]} - {mean_val:.2f}) / {std_val:.2f} = {row[f'{col}_zscore']}" 
            if not pd.isna(row[col]) else "No data available", 
            axis=1
        )
    
    def assign_grade(zscore):
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
    
    for col in numeric_cols:
        meandata[f'{col}_grade'] = meandata[f'{col}_zscore'].apply(assign_grade)
        
        # Store grade explanation
        calc_details[f'{col}_grade_explanation'] = meandata.apply(
            lambda row: f"Grade '{row[f'{col}_grade']}' assigned because |{row[f'{col}_zscore']}| " +
                       (f"≤ 0.5" if row[f'{col}_grade'] == "Excellent" else
                        f"is between 0.5 and 1.0" if row[f'{col}_grade'] == "Good" else
                        f"is between 1.0 and 2.0" if row[f'{col}_grade'] == "Satisfactory" else
                        f"is between 2.0 and 3.0" if row[f'{col}_grade'] == "Unsatisfactory" else
                        f"> 3.0" if row[f'{col}_grade'] == "Serious problem" else "")
            if not pd.isna(row[f'{col}_zscore']) else "No data available for grading",
            axis=1
        )
    
    # Ensure all original columns are included
    meandata = meandata[['Lab Code', 'Brand code', 'Model code'] + [col for col in meandata.columns if col not in ['Lab Code', 'Brand code', 'Model code']]]
    meandata = meandata[new_columns]
    
    # Alert System - Check for critical issues
    def check_critical_issues(meandata, numeric_cols):
        """Check for critical quality issues"""
        critical_issues = []
        serious_issues = []
        
        for col in numeric_cols:
            grade_col = f'{col}_grade'
            if grade_col in meandata.columns:
                critical_count = len(meandata[meandata[grade_col] == 'Serious problem'])
                unsatisfactory_count = len(meandata[meandata[grade_col] == 'Unsatisfactory'])
                
                if critical_count > 0:
                    critical_issues.append({
                        'test': col,
                        'count': critical_count,
                        'labs': meandata[meandata[grade_col] == 'Serious problem']['Lab Code'].tolist()
                    })
                
                if unsatisfactory_count > 0:
                    serious_issues.append({
                        'test': col,
                        'count': unsatisfactory_count,
                        'labs': meandata[meandata[grade_col] == 'Unsatisfactory']['Lab Code'].tolist()
                    })
        
        return critical_issues, serious_issues
    
    # Check for issues
    critical_issues, serious_issues = check_critical_issues(meandata, numeric_cols)
    
    # Display alerts if issues found
    if critical_issues or serious_issues:
        st.markdown('<div class="subheader-style">🚨 Quality Alerts</div>', unsafe_allow_html=True)
        
        if critical_issues:
            for issue in critical_issues:
                st.error(f"**CRITICAL**: {issue['count']} lab(s) have 'Serious problem' in {issue['test']}: "
                        f"Labs {', '.join(map(str, issue['labs']))}")
                # Log critical issue
                log_activity("CRITICAL_ALERT", 
                           f"Serious problem detected in {issue['test']} for labs: {', '.join(map(str, issue['labs']))}")
        
        if serious_issues:
            for issue in serious_issues:
                st.warning(f"**WARNING**: {issue['count']} lab(s) have 'Unsatisfactory' grade in {issue['test']}: "
                          f"Labs {', '.join(map(str, issue['labs']))}")
                # Log warning
                log_activity("WARNING_ALERT",
                           f"Unsatisfactory grade in {issue['test']} for labs: {', '.join(map(str, issue['labs']))}")
    
    # Display results
    st.markdown('<div class="subheader-style">Processed Results</div>', unsafe_allow_html=True)
    
    # Apply styling
    def color_grade(val):
        color_map = {
            'Excellent': 'background-color: #27ae60; color: white;',
            'Good': 'background-color: #52be80; color: white;',
            'Satisfactory': 'background-color: #f7dc6f; color: #145a32;',
            'Unsatisfactory': 'background-color: #f1948a; color: #641e16;',
            'Serious problem': 'background-color: #c0392b; color: white;',
            'No data': 'background-color: #d5dbdb; color: #145a32;'
        }
        return color_map.get(val, '')
    
    # Apply styling to grade columns
    grade_columns = [col for col in meandata.columns if '_grade' in col]
    styled_df = meandata.style.applymap(color_grade, subset=grade_columns)
    
    # Format numeric columns
    numeric_format = {col: "{:.2f}" for col in numeric_cols}
    zscore_format = {col: "{:.2f}" for col in meandata.columns if '_zscore' in col}
    styled_df = styled_df.format({**numeric_format, **zscore_format})
    
    st.dataframe(styled_df, height=400, use_container_width=True)
    
    # Rest of the code remains the same...
    # (Continue from here with the existing detail viewer, visualization, etc.)

    # Detailed calculation viewer section
    st.markdown('<div class="subheader-style">Detailed Calculation Viewer</div>', unsafe_allow_html=True)
    
    # Create selection widgets for Lab Code and Test
    row1, row2 = st.columns(2)
    selected_lab = row1.selectbox("Select Lab Code", options=meandata['Lab Code'].unique())
    
    test_options = [col for col in numeric_cols]
    selected_test = row2.selectbox("Select Test", options=test_options)
    
    if selected_lab and selected_test:
        lab_index = meandata[meandata['Lab Code'] == selected_lab].index[0]
        test_value = meandata.loc[lab_index, selected_test]
        z_score = meandata.loc[lab_index, f'{selected_test}_zscore']
        grade = meandata.loc[lab_index, f'{selected_test}_grade']
        
        # Get calculation details
        calculation = calc_details.loc[lab_index, f'{selected_test}_calculation']
        grade_explanation = calc_details.loc[lab_index, f'{selected_test}_grade_explanation']
        
        # Display detailed calculation
        st.markdown(f"""
        <div class="calculation-box">
            <h4>Detailed Calculation for Lab {selected_lab}, Test: {selected_test}</h4>
            <p><b>Raw Value:</b> {f"{test_value:.2f}" if not pd.isna(test_value) else "No data"}</p>
            <p><b>Test Statistics:</b> Mean = {stats_dict[selected_test]['mean']:.2f}, Standard Deviation = {stats_dict[selected_test]['std']:.2f}</p>
            <p><b>Z-Score Calculation:</b><br>
            <span class="formula">{calculation}</span></p>
            <p><b>Grade Determination:</b><br>
            <span class="formula">{grade_explanation}</span></p>
            <p><b>Final Grade:</b> {grade}</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Visualization
    st.markdown('<div class="subheader-style">📊 Visual Analysis & Comparison</div>', unsafe_allow_html=True)
    
    tab1, tab2, tab3, tab4 = st.tabs([
        "Grade Distribution", 
        "Z-Score Distribution", 
        "Lab Comparison", 
        "Problem Visualization"
    ])
    
    with tab1:
        grade_cols = [col for col in meandata.columns if '_grade' in col]
        grade_data = meandata[['Lab Code'] + grade_cols].melt(id_vars='Lab Code', var_name='Test', value_name='Grade')
        grade_counts = grade_data.groupby(['Test', 'Grade']).size().reset_index(name='Count')
        
        fig, ax = plt.subplots(figsize=(12, 6))
        sns.barplot(
            data=grade_counts, x='Test', y='Count', hue='Grade',
            palette={
                'Excellent':'#27ae60', 'Good':'#52be80', 'Satisfactory':'#f7dc6f',
                'Unsatisfactory':'#f1948a', 'Serious problem':'#c0392b', 'No data':'#d5dbdb'
            }
        )  
        plt.xticks(rotation=45, ha='right')
        plt.title(f'Grade Distribution by Test (Model {selected_model})')
        plt.tight_layout()
        st.pyplot(fig)
    
    with tab2:
        zscore_cols = [col for col in meandata.columns if '_zscore' in col]
        zscore_data = meandata[['Lab Code'] + zscore_cols].melt(id_vars='Lab Code', var_name='Test', value_name='Z-Score')
        
        fig, ax = plt.subplots(figsize=(12, 6))
        sns.boxplot(data=zscore_data, x='Test', y='Z-Score')
        
        # Add horizontal lines for grade boundaries
        ax.axhline(y=3, color='red', linestyle='--', alpha=0.7, label='Serious Problem (|Z| > 3)')
        ax.axhline(y=-3, color='red', linestyle='--', alpha=0.7)
        ax.axhline(y=2, color='orange', linestyle='--', alpha=0.7, label='Unsatisfactory (|Z| > 2)')
        ax.axhline(y=-2, color='orange', linestyle='--', alpha=0.7)
        ax.axhline(y=1, color='yellow', linestyle='--', alpha=0.7, label='Satisfactory (|Z| > 1)')
        ax.axhline(y=-1, color='yellow', linestyle='--', alpha=0.7)
        ax.axhline(y=0.5, color='lightgreen', linestyle='--', alpha=0.7, label='Good (|Z| > 0.5)')
        ax.axhline(y=-0.5, color='lightgreen', linestyle='--', alpha=0.7)
        
        plt.xticks(rotation=45, ha='right')
        plt.title(f'Z-Score Distribution by Test (Model {selected_model})')
        plt.legend()
        plt.tight_layout()
        st.pyplot(fig)
    
    with tab3:
        st.markdown("### Laboratory Performance Comparison")
        
        # Select test for comparison
        test_for_comparison = st.selectbox(
            "Choose test parameter for lab comparison:",
            options=numeric_cols,
            key="lab_comparison_test"
        )
        
        if test_for_comparison:
            # Performance comparison chart
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
            
            # Raw values comparison
            lab_data = meandata[['Lab Code', test_for_comparison]].dropna()
            lab_data = lab_data.sort_values(test_for_comparison)
            
            colors = []
            for _, row in lab_data.iterrows():
                lab_idx = meandata[meandata['Lab Code'] == row['Lab Code']].index[0]
                grade = meandata.loc[lab_idx, f'{test_for_comparison}_grade']
                if grade == 'Serious problem':
                    colors.append('red')
                elif grade == 'Unsatisfactory':
                    colors.append('orange')
                elif grade == 'Satisfactory':
                    colors.append('yellow')
                elif grade == 'Good':
                    colors.append('lightblue')
                elif grade == 'Excellent':
                    colors.append('green')
                else:
                    colors.append('gray')
            
            ax1.bar(range(len(lab_data)), lab_data[test_for_comparison], color=colors)
            ax1.set_xlabel('Laboratory (sorted by value)')
            ax1.set_ylabel('Raw Value')
            ax1.set_title(f'{test_for_comparison} - Raw Values by Lab')
            ax1.tick_params(axis='x', rotation=45)
            
            # Z-scores comparison
            zscore_col = f'{test_for_comparison}_zscore'
            if zscore_col in meandata.columns:
                zscore_data = meandata[['Lab Code', zscore_col]].dropna()
                zscore_data = zscore_data.sort_values(zscore_col)
                
                ax2.bar(range(len(zscore_data)), zscore_data[zscore_col], 
                       color=['red' if abs(z) > 3 else 'orange' if abs(z) > 2 else 'yellow' if abs(z) > 1 else 'green' 
                             for z in zscore_data[zscore_col]])
                ax2.axhline(y=3, color='red', linestyle='--', alpha=0.7)
                ax2.axhline(y=-3, color='red', linestyle='--', alpha=0.7)
                ax2.axhline(y=2, color='orange', linestyle='--', alpha=0.7)
                ax2.axhline(y=-2, color='orange', linestyle='--', alpha=0.7)
                ax2.axhline(y=0, color='black', linestyle='-', alpha=0.3)
                ax2.set_xlabel('Laboratory (sorted by Z-Score)')
                ax2.set_ylabel('Z-Score')
                ax2.set_title(f'{test_for_comparison} - Z-Scores by Lab')
                ax2.tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            st.pyplot(fig)
            
            # Show top and bottom performers
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("#### Best Performers (Lowest |Z-Score|)")
                if zscore_col in meandata.columns:
                    best_performers = meandata[['Lab Code', test_for_comparison, zscore_col, f'{test_for_comparison}_grade']].dropna()
                    best_performers['abs_zscore'] = abs(best_performers[zscore_col])
                    best_performers = best_performers.sort_values('abs_zscore').head(5)
                    st.dataframe(best_performers[['Lab Code', test_for_comparison, zscore_col, f'{test_for_comparison}_grade']], 
                               hide_index=True, use_container_width=True)
            
            with col2:
                st.markdown("#### Needs Attention (Highest |Z-Score|)")
                if zscore_col in meandata.columns:
                    attention_needed = meandata[['Lab Code', test_for_comparison, zscore_col, f'{test_for_comparison}_grade']].dropna()
                    attention_needed['abs_zscore'] = abs(attention_needed[zscore_col])
                    attention_needed = attention_needed.sort_values('abs_zscore', ascending=False).head(5)
                    st.dataframe(attention_needed[['Lab Code', test_for_comparison, zscore_col, f'{test_for_comparison}_grade']], 
                               hide_index=True, use_container_width=True)
    
    with tab4:
        st.markdown("### Problem Visualization")
        
        # Create problem heatmap
        problem_matrix = []
        lab_codes = sorted(meandata['Lab Code'].unique())
        
        for lab in lab_codes:
            lab_row = []
            lab_data = meandata[meandata['Lab Code'] == lab].iloc[0]
            
            for col in numeric_cols:
                grade_col = f'{col}_grade'
                if grade_col in meandata.columns:
                    grade = lab_data[grade_col]
                    if grade == 'Serious problem':
                        lab_row.append(4)
                    elif grade == 'Unsatisfactory':
                        lab_row.append(3)
                    elif grade == 'Satisfactory':
                        lab_row.append(2)
                    elif grade == 'Good':
                        lab_row.append(1)
                    elif grade == 'Excellent':
                        lab_row.append(0)
                    else:
                        lab_row.append(-1)  # No data
                else:
                    lab_row.append(-1)
            problem_matrix.append(lab_row)
        
        if problem_matrix:
            problem_df = pd.DataFrame(problem_matrix, 
                                    index=[f'Lab {lab}' for lab in lab_codes],
                                    columns=numeric_cols)
            
            fig, ax = plt.subplots(figsize=(12, max(6, len(lab_codes) * 0.3)))
            
            # Create custom colormap
            colors = ['green', 'lightblue', 'yellow', 'orange', 'red', 'gray']
            from matplotlib.colors import ListedColormap
            custom_cmap = ListedColormap(colors)
            
            sns.heatmap(problem_df, annot=False, cmap=custom_cmap, 
                       cbar_kws={'label': 'Grade Level'}, ax=ax,
                       vmin=-1, vmax=4)
            
            ax.set_title('Laboratory Performance Heatmap\n(Green=Excellent, Blue=Good, Yellow=Satisfactory, Orange=Unsatisfactory, Red=Serious Problem, Gray=No Data)')
            ax.set_xlabel('Test Parameters')
            ax.set_ylabel('Laboratory Codes')
            
            plt.tight_layout()
            st.pyplot(fig)
            
            # Problem concentration analysis
            st.markdown("#### Problem Concentration Analysis")
            
            col1, col2 = st.columns(2)
            
            with col1:
                # Labs with most problems
                lab_problem_counts = {}
                for lab in lab_codes:
                    lab_data = meandata[meandata['Lab Code'] == lab].iloc[0]
                    problem_count = 0
                    for col in numeric_cols:
                        grade_col = f'{col}_grade'
                        if grade_col in meandata.columns:
                            grade = lab_data[grade_col]
                            if grade in ['Serious problem', 'Unsatisfactory']:
                                problem_count += 1
                    lab_problem_counts[lab] = problem_count
                
                problem_labs = sorted(lab_problem_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                if problem_labs and problem_labs[0][1] > 0:
                    st.markdown("**Labs with Most Problems:**")
                    for lab, count in problem_labs:
                        if count > 0:
                            st.markdown(f"- Lab {lab}: {count} problem(s)")
            
            with col2:
                # Tests with most problems
                test_problem_counts = {}
                for col in numeric_cols:
                    grade_col = f'{col}_grade'
                    if grade_col in meandata.columns:
                        problem_count = len(meandata[meandata[grade_col].isin(['Serious problem', 'Unsatisfactory'])])
                        test_problem_counts[col] = problem_count
                
                problem_tests = sorted(test_problem_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                if problem_tests and problem_tests[0][1] > 0:
                    st.markdown("**Tests with Most Problems:**")
                    for test, count in problem_tests:
                        if count > 0:
                            st.markdown(f"- {test}: {count} lab(s) with problems")
    
    # Add calculation details to download
    download_df = meandata.copy()
    
    # Add calculation details to the download DataFrame
    for col in numeric_cols:
        download_df[f'{col}_calculation_details'] = calc_details[f'{col}_calculation']
        download_df[f'{col}_grade_explanation'] = calc_details[f'{col}_grade_explanation']
    
    # Enhanced download options
    st.markdown('<div class="subheader-style">📥 Export Analysis Results</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # CSV Download
        st.download_button(
            label=f"� Download CSV Report (Model {selected_model})",
            data=download_df.to_csv(index=False).encode('utf-8'),
            file_name=f'smartlab_blood_analysis_model_{selected_model}_{datetime.now().strftime("%Y%m%d_%H%M")}.csv',
            mime='text/csv',
            use_container_width=True
        )
    
    with col2:
        # Excel Download with multiple sheets
        try:
            excel_buffer = BytesIO()
            with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                # Main results
                download_df.to_excel(writer, sheet_name='Analysis Results', index=False)
                
                # Statistics sheet
                stats_df.to_excel(writer, sheet_name='Statistics', index=False)
                
                # Issues summary if any
                if critical_issues or serious_issues:
                    issues_data = []
                    for issue in critical_issues:
                        for lab in issue['labs']:
                            issues_data.append({
                                'Lab Code': lab,
                                'Test': issue['test'],
                                'Issue Level': 'Serious problem',
                                'Model Code': selected_model
                            })
                    
                    for issue in serious_issues:
                        for lab in issue['labs']:
                            issues_data.append({
                                'Lab Code': lab,
                                'Test': issue['test'],
                                'Issue Level': 'Unsatisfactory',
                                'Model Code': selected_model
                            })
                    
                    if issues_data:
                        issues_df = pd.DataFrame(issues_data)
                        issues_df.to_excel(writer, sheet_name='Quality Issues', index=False)
            
            excel_buffer.seek(0)
            st.download_button(
                label=f"📊 Download Excel Report (Model {selected_model})",
                data=excel_buffer,
                file_name=f'smartlab_blood_analysis_model_{selected_model}_{datetime.now().strftime("%Y%m%d_%H%M")}.xlsx',
                mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                use_container_width=True
            )
            
        except ImportError:
            st.info("Excel export requires openpyxl. Install with: pip install openpyxl")
    
    # Log download activity
    if st.button("Log Download Activity", key="log_download"):
        log_activity("DATA_DOWNLOAD", f"Downloaded analysis for Model {selected_model}")
    
    # Download all split files as a zip
    st.markdown('<div class="subheader-style">Download All Split Files</div>', unsafe_allow_html=True)
    if st.button("Download All Model Code Files as ZIP"):
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for model_code in unique_model_codes:
                output_filename = f"BloodData_Model_{model_code}.csv"
                output_path = os.path.join("split_by_model_code", output_filename)
                zip_file.write(output_path, output_filename)
        
        zip_buffer.seek(0)
        st.download_button(
            label="📦 Download ZIP of All Split Files",
            data=zip_buffer,
            file_name="split_model_code_files.zip",
            mime="application/zip",
            use_container_width=True
        )
    
    # Generate a detailed report for selected lab
    st.markdown('<div class="subheader-style">Export Detailed Calculation Report</div>', unsafe_allow_html=True)
    
    export_lab = st.selectbox("Select Lab for Detailed Report", options=meandata['Lab Code'].unique(), key="export_lab")
    
    if st.button("Generate Detailed Report for Selected Lab"):
        st.markdown(f"### Detailed Calculations for Lab: {export_lab} (Model: {selected_model})")
        lab_data = meandata[meandata['Lab Code'] == export_lab]
        lab_index = lab_data.index[0]
        
        for col in numeric_cols:
            test_value = lab_data.iloc[0][col]
            z_score = lab_data.iloc[0][f'{col}_zscore']
            grade = lab_data.iloc[0][f'{col}_grade']
            
            calculation = calc_details.loc[lab_index, f'{col}_calculation']
            grade_explanation = calc_details.loc[lab_index, f'{col}_grade_explanation']
            
            st.markdown(f"""
            <div class="calculation-box">
                <h4>Test: {col}</h4>
                <p><b>Raw Value:</b> {f"{test_value:.2f}" if not pd.isna(test_value) else "No data"}</p>
                <p><b>Z-Score Calculation:</b><br>
                <span class="formula">{calculation}</span></p>
                <p><b>Grade Determination:</b><br>
                <span class="formula">{grade_explanation}</span></p>
                <p><b>Final Grade:</b> {grade}</p>
            </div>
            """, unsafe_allow_html=True)
    
    # Add PDF Report Generation Section with enhanced Lab Code and Model Code format
    st.markdown('<div class="subheader-style">Generate Final PDF Report</div>', unsafe_allow_html=True)
    
    def create_pdf_report(lab_code, model_code, meandata, stats_dict, numeric_cols, calc_details):
        """Generate a PDF report for a specific lab with enhanced Lab Code and Model Code format"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, title=f"BloodTest Report - Lab {lab_code} Model {model_code}")
        styles = getSampleStyleSheet()
        
        # Create custom styles
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.navy,
            spaceAfter=12,
            alignment=1  # Center alignment
        )
        
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.darkblue,
            spaceAfter=6
        )
        
        lab_model_style = ParagraphStyle(
            'LabModel',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.darkblue,
            spaceAfter=8,
            borderWidth=1,
            borderColor=colors.navy,
            borderPadding=5,
            borderRadius=5,
            alignment=1  # Center alignment
        )
        
        normal_style = ParagraphStyle(
            'Normal',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6
        )
        
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.darkblue,
            spaceAfter=6
        )
        
        # Filter data for the selected lab
        lab_data = meandata[meandata['Lab Code'] == lab_code]
        if len(lab_data) == 0:
            return None
        
        lab_index = lab_data.index[0]
        
        # Build the elements for the PDF
        elements = []
        
        # Add title and metadata with enhanced formatting
        elements.append(Paragraph(f"SmartLab Blood Cell Quality Analysis", title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Add Lab Code and Model Code in a more prominent way
        elements.append(Paragraph(f"LAB CODE: {lab_code} • MODEL CODE: {model_code}", lab_model_style))
        elements.append(Spacer(1, 0.2*inch))
        
        elements.append(Paragraph(f"Report Generated: {pd.Timestamp.now().strftime('%B %d, %Y')}", normal_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Add summary section with Lab/Model information
        elements.append(Paragraph("TEST RESULTS SUMMARY", header_style))
        elements.append(Paragraph(f"The following results are for Laboratory {lab_code} using Model {model_code} equipment:", normal_style))
        elements.append(Spacer(1, 0.1*inch))
        
        # Create a data table for the test results with improved formatting
        summary_data = [['Test', 'Value', 'Z-Score', 'Grade']]
        
        # Track problematic tests for the executive summary
        problematic_tests = []
        
        for col in numeric_cols:
            test_value = lab_data.iloc[0][col]
            z_score = lab_data.iloc[0][f'{col}_zscore']
            grade = lab_data.iloc[0][f'{col}_grade']
            
            # Format values properly
            formatted_value = f"{test_value:.2f}" if pd.notna(test_value) else "No data"
            formatted_z_score = f"{z_score:.2f}" if pd.notna(z_score) else "N/A"
            
            summary_data.append([col, formatted_value, formatted_z_score, grade])
            
            # Track problematic tests for executive summary
            if grade in ["Unsatisfactory", "Serious problem"]:
                problematic_tests.append((col, grade, formatted_value, formatted_z_score))
        
        # Create the table
        summary_table = Table(summary_data, colWidths=[1.5*inch, 1*inch, 1*inch, 1.5*inch])
        
        # Define table style with colors based on grades
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 1), (2, -1), 'CENTER'),  # Center-align the values and z-scores
        ])
        
        # Add row-specific styling based on grades
        for i, row in enumerate(summary_data[1:], 1):
            grade = row[3]
            if grade == "Excellent":
                table_style.add('BACKGROUND', (3, i), (3, i), colors.green)
                table_style.add('TEXTCOLOR', (3, i), (3, i), colors.white)
            elif grade == "Good":
                table_style.add('BACKGROUND', (3, i), (3, i), colors.blue)
                table_style.add('TEXTCOLOR', (3, i), (3, i), colors.white)
            elif grade == "Satisfactory":
                table_style.add('BACKGROUND', (3, i), (3, i), colors.orange)
                table_style.add('TEXTCOLOR', (3, i), (3, i), colors.white)
            elif grade == "Unsatisfactory":
                table_style.add('BACKGROUND', (3, i), (3, i), colors.red)
                table_style.add('TEXTCOLOR', (3, i), (3, i), colors.white)
            elif grade == "Serious problem":
                table_style.add('BACKGROUND', (3, i), (3, i), colors.darkred)
                table_style.add('TEXTCOLOR', (3, i), (3, i), colors.white)
            else:
                table_style.add('BACKGROUND', (3, i), (3, i), colors.gray)
                table_style.add('TEXTCOLOR', (3, i), (3, i), colors.white)
        
        summary_table.setStyle(table_style)
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Add executive summary if there are problematic tests
        if problematic_tests:
            elements.append(Paragraph("EXECUTIVE SUMMARY", header_style))
            
            attention_style = ParagraphStyle(
                'Attention',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.red,
                spaceAfter=6
            )
            
            elements.append(Paragraph(
                f"<b>ATTENTION REQUIRED:</b> Lab {lab_code} has {len(problematic_tests)} test(s) that require immediate attention:",
                attention_style
            ))
            
            for test, grade, value, zscore in problematic_tests:
                elements.append(Paragraph(
                    f"• <b>{test}</b>: {grade} (Value: {value}, Z-Score: {zscore})",
                    normal_style
                ))
            
            elements.append(Spacer(1, 0.15*inch))
        
        # Add statistical context section
        elements.append(Paragraph("MODEL STATISTICAL REFERENCE", header_style))
        elements.append(Paragraph(f"Statistical distribution for all laboratories using Model {model_code}:", normal_style))
        elements.append(Spacer(1, 0.1*inch))
        
        stat_data = [['Test', 'Population Mean', 'Population Std Dev', 'Sample Count']]
        for col in numeric_cols:
            stat_data.append([
                col, 
                f"{stats_dict[col]['mean']:.2f}", 
                f"{stats_dict[col]['std']:.2f}", 
                f"{stats_dict[col]['count']}"
            ])
        
        stat_table = Table(stat_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        stat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 1), (2, -1), 'CENTER'),
        ]))
        
        elements.append(stat_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Add detailed calculations section with enhanced lab/model presentation
        elements.append(Paragraph(f"DETAILED CALCULATIONS FOR LAB {lab_code}", header_style))
        elements.append(Paragraph(f"Model {model_code} Performance Analysis", subtitle_style))
        elements.append(Spacer(1, 0.1*inch))
        
        for col in numeric_cols:
            test_value = lab_data.iloc[0][col]
            z_score = lab_data.iloc[0][f'{col}_zscore']
            grade = lab_data.iloc[0][f'{col}_grade']
            
            if pd.notna(test_value):
                elements.append(Paragraph(f"<b>Test: {col}</b>", subtitle_style))
                elements.append(Paragraph(f"Raw Value: {test_value:.2f}", normal_style))
                
                # Get calculation details
                calculation = calc_details.loc[lab_index, f'{col}_calculation']
                grade_explanation = calc_details.loc[lab_index, f'{col}_grade_explanation']
                
                elements.append(Paragraph(f"<b>Z-Score Calculation:</b> {calculation}", normal_style))
                elements.append(Paragraph(f"<b>Grade Determination:</b> {grade_explanation}", normal_style))
                elements.append(Paragraph(f"<b>Final Grade:</b> {grade}", normal_style))
                elements.append(Spacer(1, 0.15*inch))
        
        # Add interpretations and recommendations section
        elements.append(Paragraph("RECOMMENDATIONS", header_style))
        
        # Count grades to provide an overall summary
        grade_counts = {
            "Excellent": 0,
            "Good": 0,
            "Satisfactory": 0,
            "Unsatisfactory": 0,
            "Serious problem": 0,
            "No data": 0
        }
        
        for col in numeric_cols:
            grade = lab_data.iloc[0][f'{col}_grade']
            if pd.notna(grade):
                grade_counts[grade] += 1
        
        total_grades = sum(grade_counts.values()) - grade_counts["No data"]
        
        # Generate interpretation text with enhanced formatting
        interpretation_text = f"<b>Lab {lab_code}</b> performance with <b>Model {model_code}</b> equipment shows the following distribution:"
        elements.append(Paragraph(interpretation_text, normal_style))
        
        # Create a mini table for grade distribution
        grade_dist = [['Grade', 'Count', 'Percentage']]
        for grade, count in grade_counts.items():
            if grade != "No data":
                if total_grades > 0:
                    percentage = (count / total_grades) * 100
                    grade_dist.append([grade, str(count), f"{percentage:.1f}%"])
        
        if grade_counts["No data"] > 0:
            grade_dist.append(["No data", str(grade_counts["No data"]), "N/A"])
        
        grade_table = Table(grade_dist, colWidths=[1.5*inch, 1*inch, 1.5*inch])
        grade_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightsteelblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 1), (2, -1), 'CENTER'),
        ]))
        
        elements.append(grade_table)
        elements.append(Spacer(1, 0.15*inch))
        
        # Add recommendations based on overall performance
        elements.append(Paragraph("<b>Action Items for Lab Management:</b>", normal_style))
        
        if grade_counts["Unsatisfactory"] + grade_counts["Serious problem"] > 0:
            elements.append(Paragraph(
                "• <b>URGENT:</b> Review tests with 'Unsatisfactory' or 'Serious problem' grades.", 
                normal_style
            ))
            elements.append(Paragraph(
                "• Verify equipment calibration for Model " + str(model_code) + " at Lab " + str(lab_code) + ".", 
                normal_style
            ))
            elements.append(Paragraph(
                "• Check technician training and procedural adherence.", 
                normal_style
            ))
        
        if grade_counts["Satisfactory"] > 0:
            elements.append(Paragraph(
                "• <b>RECOMMENDED:</b> Schedule routine review for tests with 'Satisfactory' grades.", 
                normal_style
            ))
            elements.append(Paragraph(
                "• Consider additional staff training on Model " + str(model_code) + " equipment.", 
                normal_style
            ))
        
        if grade_counts["Excellent"] + grade_counts["Good"] > 0:
            elements.append(Paragraph(
                "• <b>POSITIVE FINDING:</b> " + str(grade_counts["Excellent"] + grade_counts["Good"]) + 
                " test(s) show excellent or good performance.", 
                normal_style
            ))
        
        if grade_counts["Excellent"] + grade_counts["Good"] == total_grades and total_grades > 0:
            elements.append(Paragraph(
                "• <b>CONGRATULATIONS:</b> All tests are performing well. Continue current quality control processes.", 
                normal_style
            ))
        
        # Add certification section
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph("CERTIFICATION", header_style))
        
        cert_text = f"""This report was automatically generated by the SmartLab Blood Cell Quality Analysis System
        for Lab Code {lab_code} using Model {model_code} equipment. The analysis is based on statistical comparison 
        with other laboratories using the same model code. Results should be reviewed by qualified laboratory personnel."""
        
        elements.append(Paragraph(cert_text, normal_style))
        
        # Add footer with page numbers and lab/model code
        def add_page_number(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            page_num = canvas.getPageNumber()
            text = f"Page {page_num}"
            canvas.drawRightString(A4[0] - 30, 30, text)
            
            # Add lab/model code to footer
            canvas.drawString(30, 30, f"Lab: {lab_code} | Model: {model_code}")
            
            # Add report timestamp
            timestamp = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M")
            canvas.drawCentredString(A4[0]/2, 30, f"Generated: {timestamp}")
            
            canvas.restoreState()
        
        # Build the PDF
        doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
        buffer.seek(0)
        return buffer
    
    # Report generation interface with explanatory text
    st.markdown("""
    <div class="info-box">
        Generate a comprehensive PDF report organized by Lab Code and Model Code. 
        The report includes detailed analysis, statistical comparisons, and recommendations.
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    report_lab = col1.selectbox(
        "Select Lab for PDF Report", 
        options=meandata['Lab Code'].unique(), 
        key="pdf_report_lab"
    )
    
    if col2.button("Generate PDF Report"):
        with st.spinner('Generating PDF report...'):
            pdf_buffer = create_pdf_report(
                report_lab, 
                selected_model, 
                meandata, 
                stats_dict, 
                numeric_cols, 
                calc_details
            )
            
            if pdf_buffer:
                st.success("PDF Report generated successfully!")
                
                # Provide download button for the generated PDF with lab and model in filename
                st.download_button(
                    label=f"📥 Download Lab {report_lab} Model {selected_model} PDF Report",
                    data=pdf_buffer,
                    file_name=f"SmartLab_Lab{report_lab}_Model{selected_model}_Report.pdf",
                    mime="application/pdf",
                    use_container_width=True
                )
                
                # Add option to generate reports for all labs
                if st.button("Generate Reports for All Labs in this Model"):
                    all_labs = meandata['Lab Code'].unique()
                    zip_buffer = BytesIO()
                    
                    # Create progress bar
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                        for i, lab in enumerate(all_labs):
                            # Update progress
                            progress = int((i+1) / len(all_labs) * 100)
                            progress_bar.progress(progress)
                            status_text.text(f"Processing Lab {lab} ({i+1}/{len(all_labs)})")
                            
                            # Generate PDF for this lab
                            lab_pdf = create_pdf_report(
                                lab, 
                                selected_model, 
                                meandata, 
                                stats_dict, 
                                numeric_cols, 
                                calc_details
                            )
                            
                            if lab_pdf:
                                # Add to zip
                                zip_file.writestr(
                                    f"SmartLab_Lab{lab}_Model{selected_model}_Report.pdf",
                                    lab_pdf.getvalue()
                                )
                    
                    # Reset progress 
                    progress_bar.empty()
                    status_text.empty()
                    
                    # Provide download for zip file
                    zip_buffer.seek(0)
                    st.download_button(
                        label=f"📥 Download All Lab Reports for Model {selected_model} (ZIP)",
                        data=zip_buffer,
                        file_name=f"SmartLab_AllLabs_Model{selected_model}_Reports.zip",
                        mime="application/zip",
                        use_container_width=True
                    )
            else:
                st.error("Could not generate PDF report. Please check if data for the selected lab exists.")

else:
    st.info("ℹ️ Please either upload a CSV file or load previously split model files to begin analysis.")