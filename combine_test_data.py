#!/usr/bin/env python3
"""
Script to combine Blood Test Mockup CSV files for testing the SmartLab application
"""

import pandas as pd
import os

# Define the source directory
source_dir = "/Users/king_phuripol/Work/SmartLab/BloodCellQualityTesting/Blood Test Mockup CSVs Sept 28 2025"

# List all CSV files
csv_files = [f for f in os.listdir(source_dir) if f.endswith('.csv')]
print(f"Found {len(csv_files)} CSV files:")
for file in csv_files:
    print(f"  - {file}")

# Read and combine all CSV files
combined_data = []

for file in csv_files:
    file_path = os.path.join(source_dir, file)
    print(f"\nReading {file}...")
    
    try:
        # Read CSV file
        df = pd.read_csv(file_path)
        print(f"  Shape: {df.shape}")
        
        # Extract model code from filename or from data
        if 'Model code' in df.columns:
            df_with_model = df.copy()
        elif 'B_M_No' in df.columns:
            df_with_model = df.copy()
            df_with_model['Model code'] = df_with_model['B_M_No']
        else:
            # Extract model from filename
            model_code = file.split('-')[0] if '-' in file else file.split('.')[0]
            df_with_model = df.copy()
            df_with_model['Model code'] = model_code
        
        # Add source file info
        df_with_model['Source_File'] = file
        
        combined_data.append(df_with_model)
        print(f"  Added {len(df_with_model)} rows")
        
    except Exception as e:
        print(f"  Error reading {file}: {str(e)}")

if combined_data:
    # Combine all dataframes
    print(f"\nCombining {len(combined_data)} dataframes...")
    final_df = pd.concat(combined_data, ignore_index=True)
    
    # Save combined data
    output_file = "/Users/king_phuripol/Work/SmartLab/BloodCellQualityTesting/Combined_Test_Data.csv"
    final_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    
    print(f"\nCombined data saved to: {output_file}")
    print(f"Final shape: {final_df.shape}")
    print(f"Columns: {list(final_df.columns)}")
    
    # Show sample of data
    print(f"\nSample data:")
    print(final_df[['Lab Code', 'Model code', 'RBC', 'WBC', 'PLT', 'Hb', 'Source_File']].head(10))
    
    # Show model distribution
    print(f"\nModel code distribution:")
    if 'Model code' in final_df.columns:
        print(final_df['Model code'].value_counts())
else:
    print("No data was successfully read!")