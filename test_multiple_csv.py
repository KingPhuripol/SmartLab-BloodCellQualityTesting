#!/usr/bin/env python3
"""
Test script to verify multiple CSV processing functionality
"""

import pandas as pd
import os
import sys

# Import functions from our app
try:
    from app import process_multiple_csv_files, process_csv_files_from_directories
    print("✓ Successfully imported functions from app.py")
except ImportError as e:
    print(f"✗ Error importing from app.py: {e}")
    sys.exit(1)

def test_csv_discovery():
    """Test CSV file discovery in different directories"""
    print("\n=== Testing CSV File Discovery ===")
    
    # Check root directory
    root_csv_files = [f for f in os.listdir(".") if f.endswith('.csv')]
    print(f"Root directory CSV files: {len(root_csv_files)}")
    for f in root_csv_files:
        print(f"  • {f}")
    
    # Check split_by_model_code directory
    if os.path.exists("split_by_model_code"):
        split_csv_files = [f for f in os.listdir("split_by_model_code") if f.endswith('.csv')]
        print(f"split_by_model_code CSV files: {len(split_csv_files)}")
        for f in split_csv_files:
            print(f"  • {f}")
    else:
        print("split_by_model_code directory not found")
    
    # Check Blood Test Mockup CSVs directory
    mockup_dir = "Blood Test Mockup CSVs Sept 28 2025"
    if os.path.exists(mockup_dir):
        mockup_csv_files = [f for f in os.listdir(mockup_dir) if f.endswith('.csv')]
        print(f"{mockup_dir} CSV files: {len(mockup_csv_files)}")
        for f in mockup_csv_files:
            print(f"  • {f}")
    else:
        print(f"{mockup_dir} directory not found")

def test_csv_structure():
    """Test the structure of available CSV files"""
    print("\n=== Testing CSV File Structure ===")
    
    # Test files from different directories
    test_files = []
    
    # Add root CSV files
    root_csv_files = [f for f in os.listdir(".") if f.endswith('.csv') and not f.startswith('Combined_')]
    test_files.extend(root_csv_files)
    
    # Add mockup CSV files (just a few for testing)
    mockup_dir = "Blood Test Mockup CSVs Sept 28 2025"
    if os.path.exists(mockup_dir):
        mockup_csv_files = [os.path.join(mockup_dir, f) for f in os.listdir(mockup_dir) if f.endswith('.csv')]
        test_files.extend(mockup_csv_files[:3])  # Just test first 3 files
    
    required_columns = ['Lab Code', 'Brand code', 'Model code']
    
    for file_path in test_files[:5]:  # Test first 5 files
        try:
            df = pd.read_csv(file_path)
            print(f"\nFile: {file_path}")
            print(f"  Rows: {len(df)}, Columns: {len(df.columns)}")
            print(f"  Columns: {list(df.columns)}")
            
            # Check for required columns
            missing_cols = [col for col in required_columns if col not in df.columns]
            if missing_cols:
                print(f"  ⚠️  Missing required columns: {missing_cols}")
            else:
                print(f"  ✓ All required columns present")
                print(f"  Unique Model codes: {df['Model code'].nunique()}")
                
        except Exception as e:
            print(f"  ✗ Error reading {file_path}: {e}")

if __name__ == "__main__":
    print("Testing Multiple CSV Processing Functionality")
    print("=" * 50)
    
    test_csv_discovery()
    test_csv_structure()
    
    print("\n=== Test Complete ===")