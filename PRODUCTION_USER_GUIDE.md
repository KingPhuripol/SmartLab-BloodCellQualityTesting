# 📘 Production User Guide

## SmartLab Blood Cell Quality Testing System

**For Team Leads, Lab Supervisors, and Quality Analysts**

---

## 🎯 Quick Start for End Users

### Access the System

1. **Open your browser** and navigate to:

   ```
   https://your-app.vercel.app
   ```

2. **Login** with your credentials:

   - Username: (provided by administrator)
   - Password: (provided by administrator)

3. **First-time users**: Change your password after first login

---

## 👥 User Roles & Permissions

### Administrator

✅ Full system access
✅ View all analytics
✅ Manage users
✅ Configure PT:EQA criteria
✅ Export all reports
✅ View activity logs

### Supervisor

✅ View analytics dashboard
✅ Perform PT:EQA analysis
✅ Export reports
✅ View quality alerts
✅ Review all lab data

### Analyst

✅ Perform PT:EQA analysis
✅ View own analysis results
✅ Export basic reports
✅ Access help documentation

---

## 📊 Using PT:EQA Evaluation Wizard

### Step-by-Step Workflow

#### **Step 1: Load Data**

1. Click **"PT:EQA Wizard"** from the dashboard
2. Click **"Load Real Data"** button
3. System automatically loads all CSV files from workspace:
   - BloodData - Test01.csv
   - Combined_Test_Data.csv
   - Blood Test Mockup CSVs folder

**What You'll See**:

- List of loaded files with format type
- Total records count
- Model codes detected
- Basic statistics

**📝 Note**: Data is automatically normalized to a standard format, supporting multiple CSV structures.

---

#### **Step 2: Validate & Set Criteria**

**Review File Summary**:

- Check number of valid records
- Verify model codes are correct
- Review statistics (mean, std deviation)

**Customize Evaluation Criteria** (Optional):

1. **Allowable Errors**: Adjust per parameter

   - RBC: ±0.2 (default)
   - WBC: ±1.2 (default)
   - PLT: ±45 (default)
   - Hb: ±0.7 (default)
   - Hct: ±2.1 (default)
   - MCV: ±4.5 (default)
   - MCH: ±1.5 (default)
   - MCHC: ±1.65 (default)

2. **Z-Score Thresholds**: Grading boundaries

   - Excellent: |Z| ≤ 0.5 (default)
   - Good: |Z| ≤ 1.0 (default)
   - Satisfactory: |Z| ≤ 2.0 (default)
   - Unsatisfactory: |Z| ≤ 3.0 (default)
   - Serious: |Z| > 3.0 (default)

3. **Apply Changes**: Click "Apply criteria" to recalculate

**📝 Tip**: Use "Reset defaults" to restore standard PT:EQA criteria

---

#### **Step 3: Review Results**

**Summary Dashboard**:

- **Pass Rate**: Percentage of acceptable results
- **Average |Z-Score|**: Overall quality indicator
- **Total Evaluations**: Number of test evaluations
- **Grade Distribution**: Breakdown by performance grade

**Interactive Charts**:

1. **Grade Distribution**: Bar chart showing result categories
2. **Average |Z| by Model**: Performance comparison across instruments

**Filter Results**:

- **By Model**: Select specific instrument model
- **By Grade**: Filter by quality grade
- **Search**: Find specific lab code or parameter

**Results Table**:

- Lab Code
- Model Code
- Parameter (RBC, WBC, PLT, etc.)
- Measured Value
- Reference Value
- Z-Score
- Grade (color-coded)
- Status (Pass/Fail)

**🎨 Color Coding**:

- 🟢 **Green**: Excellent/Good (Pass)
- 🟡 **Yellow**: Satisfactory (Pass)
- 🟠 **Orange**: Unsatisfactory (Fail)
- 🔴 **Red**: Serious (Fail - Requires immediate action)

---

#### **Step 4: Review Nonconformities & CAPA**

**Identify Issues**:

1. Filter results by "Fail" status
2. Review "Serious" grade items first
3. Check for patterns in specific models or parameters

**Root Cause Analysis**:

- Instrument calibration issues?
- Reagent lot problems?
- Operator training needs?
- Quality control failures?

**Corrective Actions** (to document):

- Immediate: Recalibration, repeat testing
- Short-term: Training, procedure review
- Long-term: Equipment maintenance, system improvements

**📋 CAPA Documentation**: Export results and attach to your quality management system

---

#### **Step 5: Approve & Export**

**Export Options**:

1. **CSV Export**:

   - Click "Export CSV"
   - Includes all results + summary statistics
   - Use for record keeping and submission

2. **Future Features**:
   - PDF Report generation
   - Excel multi-sheet workbook
   - Automated email reports

**Final Review Checklist**:

- [ ] All data loaded correctly
- [ ] Criteria appropriate for evaluation
- [ ] Critical issues identified and documented
- [ ] Results exported for records
- [ ] Corrective actions planned

---

## 🚨 Understanding Quality Alerts

### Critical Alert (🔴 Red)

**Grade: Serious Problem**

- |Z-Score| > 3.0
- **Action**: IMMEDIATE investigation required
- **Recommendations**:
  1. Verify instrument calibration
  2. Check reagent lot and expiry date
  3. Review quality control procedures
  4. Consider instrument maintenance
  5. May require immediate corrective action

### Warning Alert (⚠️ Orange)

**Grade: Unsatisfactory**

- |Z-Score| between 2.0 and 3.0
- **Action**: Investigation recommended
- **Recommendations**:
  1. Review testing procedure
  2. Check instrument performance
  3. Verify quality control results
  4. Monitor for trends

### Acceptable (⚡ Yellow)

**Grade: Satisfactory**

- |Z-Score| between 1.0 and 2.0
- **Action**: Monitor performance
- **Recommendations**:
  1. Continue routine quality control
  2. Watch for trends over time

### Good Performance (✅ Green)

**Grade: Good**

- |Z-Score| between 0.5 and 1.0
- **Action**: Maintain current procedures

### Excellent Performance (⭐ Green)

**Grade: Excellent**

- |Z-Score| ≤ 0.5
- **Action**: Continue excellent practices

---

## 📁 Data Format Requirements

### Supported CSV Formats

The system automatically detects and processes:

#### 1. BloodData-Test01 Format

```csv
Lab Code,A_RBC,A_WBC,A_PLT,A_Hb,A_Hct,A_MCV,A_MCH,A_MCHC,B_RBC,B_WBC,B_PLT,B_Hb,B_Hct,B_MCV,B_MCH,B_MCHC,Brand code,Model code
00001,4.08,8.51,212,10.8,34.3,84.0,26.5,31.5,4.95,21.44,205,14.6,43.8,88.5,29.5,33.3,600,602
```

#### 2. Combined Format

```csv
No.168,Lab Code,รายงานผล,RBC,WBC,PLT,Hb,Hct,MCV,MCH,MCHC,...,RBC.1,WBC.1,PLT.1,Hb.1,Hct.1,MCV.1,MCH.1,MCHC.1,...
2,00002,R,2.17,1.43,53,5.4,16.4,75.6,24.9,32.9,...,4.34,,568,15.2,45.2,104.1,35,33.6,...
```

#### 3. Mockup Format (AV/E/RAW)

```csv
Lab Code,RBC,WBC,PLT,Hb,Hct,MCV,MCH,MCHC,RBC.1,WBC.1,PLT.1,Hb.1,Hct.1,MCV.1,MCH.1,MCHC.1,Brand_N,B_M_No,Model
00002,2.17,1.43,53,5.4,16.4,75.6,24.9,32.9,4.34,,568,15.2,45.2,104.1,35,33.6,Sysmex,503,XN1000
```

### Required Columns (Minimum)

- Lab Code / Lab identifier
- Measured values (RBC, WBC, PLT, Hb, Hct, MCV, MCH, MCHC)
- Reference values (same parameters)
- Model code / instrument identifier

### Data Quality Tips

✅ Use UTF-8 encoding
✅ Include header row
✅ No empty rows in data
✅ Numeric values only (no units in cells)
✅ Consistent date format
✅ Valid model codes

---

## 🔍 Troubleshooting

### Problem: "No data files found"

**Solution**:

- Ensure CSV files are in correct workspace directory
- Check file naming matches expected patterns
- Verify files are not corrupted

### Problem: "Invalid records" message

**Solution**:

- Check CSV format matches one of supported types
- Ensure all required columns are present
- Remove any special characters or formatting

### Problem: Results look incorrect

**Solution**:

- Verify allowable error values are appropriate
- Check Z-score thresholds are standard
- Click "Reset defaults" to restore original criteria
- Review source data for anomalies

### Problem: Cannot export results

**Solution**:

- Check browser popup blocker settings
- Ensure sufficient disk space
- Try different browser
- Contact system administrator

---

## 📞 Support & Training

### Getting Help

**In-App Help**:

- Hover over ℹ️ icons for tooltips
- Click "Show details" in Collapsible sections
- Visit PT:EQA Method page for detailed methodology

**Contact Support**:

- Email: support@smartlab.example.com
- Phone: (internal extension)
- Submit ticket: (help desk portal)

### Training Resources

1. **Video Tutorials**: (link to be added)
2. **User Manual PDF**: (link to be added)
3. **Methodology Guide**: Available in-app at `/pt-eqa/method`
4. **FAQs**: (link to be added)

---

## 🔐 Security & Data Privacy

### Password Policy

- Minimum 8 characters
- Include uppercase, lowercase, numbers
- Change every 90 days
- Never share credentials

### Data Handling

- All data transmitted via HTTPS
- Session timeout: 24 hours
- Activity logging enabled
- Regular backups performed

### Best Practices

✅ Log out when leaving workstation
✅ Don't save password in browser
✅ Verify URL before entering credentials
✅ Report suspicious activity immediately

---

## 📋 Workflow Checklist

**Weekly PT:EQA Evaluation**:

- [ ] Collect CSV files from all participating labs
- [ ] Verify file formats and completeness
- [ ] Load data into system
- [ ] Review summary statistics
- [ ] Identify and document nonconformities
- [ ] Generate corrective action requests
- [ ] Export results for records
- [ ] Distribute reports to labs
- [ ] Follow up on corrective actions

**Monthly Review**:

- [ ] Analyze trends across multiple rounds
- [ ] Review recurring issues
- [ ] Assess effectiveness of corrective actions
- [ ] Update criteria if needed
- [ ] Prepare management summary

---

## 🎓 Understanding PT:EQA Methodology

### What is PT:EQA?

**Proficiency Testing / External Quality Assessment** is a systematic approach to:

- Evaluate laboratory performance
- Compare results against reference values
- Identify areas for improvement
- Ensure consistent quality across labs

### Z-Score Calculation

```
Z = (Measured Value - Reference Value) / Allowable Error
```

**Interpretation**:

- Z close to 0 = excellent agreement
- |Z| < 2 = acceptable performance
- |Z| ≥ 2 = performance concern
- |Z| > 3 = serious problem

### Grading Criteria

Based on international PT:EQA standards:

- Aligns with CLIA (Clinical Laboratory Improvement Amendments)
- Follows CAP (College of American Pathologists) guidelines
- Consistent with ISO 15189 requirements

---

## 🌟 Tips for Success

### For Team Leads

1. **Regular Monitoring**: Review PT:EQA results weekly
2. **Trend Analysis**: Look for patterns over time
3. **Proactive Action**: Address issues before they become critical
4. **Documentation**: Maintain thorough CAPA records

### For Lab Supervisors

1. **Staff Training**: Ensure analysts understand the system
2. **Quality Culture**: Emphasize continuous improvement
3. **Data Quality**: Verify input data accuracy
4. **Feedback Loop**: Share results with lab teams

### For Quality Analysts

1. **Attention to Detail**: Check data before analysis
2. **Consistent Methodology**: Follow standard procedures
3. **Ask Questions**: Contact support when unsure
4. **Stay Updated**: Review system updates and training materials

---

## 📅 System Maintenance

**User Responsibilities**:

- Keep login credentials secure
- Report issues promptly
- Provide feedback for improvements
- Attend training updates

**Administrator Responsibilities**:

- User account management
- Data backup verification
- System updates and patches
- Performance monitoring

---

**Ready to get started?** Login and explore the system!

For additional support, contact your system administrator.
