# SmartLab Blood Cell Quality Testing System

## 🎯 **Production-Ready PT:EQA Analysis Platform**

Professional web application for hospital blood cell quality testing with **universal CSV processing**, automated **Proficiency Testing / External Quality Assessment (PT:EQA)**, and comprehensive reporting.

---

## ✨ Key Features

### 🔄 **Universal Data Processing**

- **Multi-format CSV support**: Automatically detects and processes BloodData-Test01, Combined, and Mockup formats
- **Intelligent normalization**: Converts all formats to standard structure
- **Real-time validation**: Identifies and handles invalid/missing data
- **Batch processing**: Load multiple files simultaneously

### 📊 **PT:EQA Analysis**

- **Z-Score calculation**: Per CLIA and CAP guidelines
- **Automated grading**: Excellent, Good, Satisfactory, Unsatisfactory, Serious
- **Configurable criteria**: Adjust allowable errors and thresholds
- **Model-based evaluation**: Group by instrument model code
- **Statistical summaries**: Pass rates, distributions, trends

### � **Interactive Visualization**

- **Real-time dashboards**: Grade distribution and performance metrics
- **Model comparison charts**: Average Z-scores across instruments
- **Filterable tables**: By model, parameter, grade, lab code
- **Quality alerts**: Color-coded warnings for critical issues

### 📤 **Export & Reporting**

- **CSV export**: Complete results with summaries
- **Detailed evaluations**: Per-lab, per-parameter breakdowns
- **CAPA documentation**: Root cause and corrective actions
- **Audit trails**: Activity logging for compliance

### 🔐 **Security & Access Control**

- **Role-based permissions**: Administrator, Supervisor, Analyst
- **Session management**: 24-hour timeout, activity tracking
- **Secure authentication**: Password policies and best practices

---

## 🚀 Quick Start

This project is containerized for easy deployment and development.

### Prerequisites

- Docker
- Docker Compose

### Run the Application

1.  **Build and Start**:
    ```bash
    docker compose up --build -d
    ```

2.  **Access the Application**:
    Open [http://localhost:3002](http://localhost:3002) in your browser.

3.  **Stop the Application**:
    ```bash
    docker compose down
    ```

---

## 📁 Project Structure

```
BloodCellQualityTesting/
├── app/                  # Next.js Application (Frontend & API)
├── resources/            # Documentation and Data Files
├── docker-compose.yml    # Docker Compose Configuration
└── README.md             # Project Documentation
```

## 🔬 PT:EQA Methodology

### Z-Score Calculation

```
Z = (Measured Value - Reference Value) / Allowable Error
```

### Default Allowable Errors (CLIA-based)

| Parameter | Allowable Error | Unit    |
| --------- | --------------- | ------- |
| RBC       | ±0.2            | ×10¹²/L |
| WBC       | ±1.2            | ×10⁹/L  |
| PLT       | ±45             | ×10⁹/L  |
| Hb        | ±0.7            | g/dL    |
| Hct       | ±2.1            | %       |
| MCV       | ±4.5            | fL      |
| MCH       | ±1.5            | pg      |
| MCHC      | ±1.65           | g/dL    |

### Grading Criteria

| Grade              | Z-Score Range     | Status   | Action Required        |
| ------------------ | ----------------- | -------- | ---------------------- |
| **Excellent**      | \|Z\| ≤ 0.5       | Pass     | Continue practices     |
| **Good**           | 0.5 < \|Z\| ≤ 1.0 | Pass     | Maintain procedures    |
| **Satisfactory**   | 1.0 < \|Z\| ≤ 2.0 | Pass     | Monitor performance    |
| **Unsatisfactory** | 2.0 < \|Z\| ≤ 3.0 | **Fail** | Investigation required |
| **Serious**        | \|Z\| > 3.0       | **Fail** | Immediate action       |

---

## 📊 Supported Data Formats

The system automatically detects and processes multiple CSV formats:

### 1. BloodData-Test01 Format

```csv
Lab Code,A_RBC,A_WBC,A_PLT,...,B_RBC,B_WBC,B_PLT,...,Brand code,Model code
00001,4.08,8.51,212,...,4.95,21.44,205,...,600,602
```

### 2. Combined Format

Complex format with Thai headers, detailed metadata, and extended columns.

### 3. Mockup Formats (AV/E/RAW)

Simplified formats with Brand_N, B_M_No, and Type columns.

**Format Detection**: Automatic based on header analysis  
**Normalization**: All formats → StandardBloodTestRecord  
**Validation**: Real-time error detection and reporting

---

## 🛠️ Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide Icons** - Modern iconography

### Backend

- **Next.js API Routes** - Serverless functions
- **Node.js** - Runtime environment
- **fs/promises** - File system operations

### Deployment

- **Vercel** - Frontend hosting
- **Railway / Render** - Backend API hosting
- **GitHub** - Version control & CI/CD

---

## 📚 Documentation

| Document                                               | Purpose               | Audience               |
| ------------------------------------------------------ | --------------------- | ---------------------- |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)           | Production deployment | DevOps, Administrators |
| [PRODUCTION_USER_GUIDE.md](./PRODUCTION_USER_GUIDE.md) | End-user manual       | Lab Staff, Supervisors |
| [HOW_TO_RUN.md](./HOW_TO_RUN.md)                       | Development setup     | Developers             |
| README.md                                              | Project overview      | Everyone               |

---

## 🔄 Development Workflow

### Local Development

```bash
# Install dependencies
cd app && npm install

# Run development server
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Test production build locally
npm start
```

### Testing

```bash
# Test API endpoint
curl http://localhost:3001/api/pt-eqa/load

# Should return JSON with:
# - metadata: { totalFiles, totalRecords, uniqueModels, evaluations }
# - files: [ { filename, format, validRecords, modelCodes, statistics } ]
# - ptEqa: { results, summary }
```

### Code Quality

```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run type-check
```

---

## 🐛 Troubleshooting

### Common Issues

#### "No data files found"

**Cause**: CSV files not in expected location  
**Solution**: Verify files exist in workspace root and `Blood Test Mockup CSVs Sept 28 2025/` folder

#### "Failed to load PT:EQA data"

**Cause**: API route error or file parsing issue  
**Solution**:

1. Check browser console for errors
2. Verify CSV file format
3. Review server logs: `npm run dev` output

#### "Invalid records" warning

**Cause**: Missing or malformed data in CSV  
**Solution**:

1. Check CSV has all required columns
2. Ensure numeric values have no units
3. Remove empty rows

#### Build errors

**Cause**: TypeScript or dependency issues  
**Solution**:

```bash
rm -rf node_modules .next
npm install
npm run build
```

---

## 🔐 Security Notes

### For Production

- ✅ Change default passwords immediately
- ✅ Use environment variables for sensitive config
- ✅ Enable HTTPS (automatic with Vercel/Railway)
- ✅ Set proper CORS origins (not `*`)
- ✅ Regular dependency updates: `npm audit fix`
- ✅ Implement rate limiting for API routes
- ✅ Regular backups of data files

### For Development

- ⚠️ Never commit `.env` files
- ⚠️ Use `.env.local` for local secrets
- ⚠️ Test with sample data, not production data
- ⚠️ Review security before deploying

---

## 📈 Roadmap

### Current Version: 2.0 (Production Ready)

- ✅ Universal CSV processing
- ✅ PT:EQA analysis with configurable criteria
- ✅ Interactive visualizations
- ✅ CSV export
- ✅ Multi-role authentication
- ✅ Production deployment configs

### Future Enhancements

- [ ] **Database integration** (PostgreSQL / Supabase)
- [ ] **Advanced reporting** (PDF, Excel multi-sheet)
- [ ] **Email notifications** (automated alerts)
- [ ] **Trend analysis** (historical comparison)
- [ ] **Mobile app** (React Native)
- [ ] **API documentation** (Swagger/OpenAPI)
- [ ] **Unit testing** (Jest + Testing Library)
- [ ] **E2E testing** (Playwright)

---

## 🤝 Contributing

### For Internal Development Team

1. **Branch naming**: `feature/description` or `fix/description`
2. **Commit messages**: Clear, descriptive, imperative mood
3. **Pull requests**: Include description and testing notes
4. **Code review**: Required before merging to main

### Reporting Issues

1. Check existing issues first
2. Include steps to reproduce
3. Attach sample data (anonymized)
4. Provide browser/environment details

---

## 📞 Support

### For Users

- **User Guide**: [PRODUCTION_USER_GUIDE.md](./PRODUCTION_USER_GUIDE.md)
- **Email**: support@smartlab.example.com
- **Help Desk**: (internal portal)

### For Developers

- **Documentation**: This README + inline comments
- **API Docs**: http://localhost:3001/api/docs (coming soon)
- **GitHub Issues**: (repository link)

---

## 📄 License

Internal use only - SmartLab Hospital  
Professional hospital-grade application for blood cell quality testing.

---

## ✅ Production Checklist

**Before Going Live**:

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] CORS settings appropriate
- [ ] Default passwords changed
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] User documentation distributed
- [ ] Team trained on system

**After Deployment**:

- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] DNS configured correctly
- [ ] Load testing completed
- [ ] Incident response plan in place

---

## 🌟 Current Status

**✅ READY FOR PRODUCTION**

- Frontend: Next.js optimized build
- Backend: API routes tested and validated
- Data Processing: Universal format support
- PT:EQA: Full evaluation workflow
- Documentation: Complete user and deployment guides
- Security: Role-based access, activity logging
- Deployment: Vercel + Railway/Render configs ready

**Next Steps**:

1. Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) to deploy
2. Configure production environment variables
3. Load real data and verify results
4. Train team using [PRODUCTION_USER_GUIDE.md](./PRODUCTION_USER_GUIDE.md)
5. Monitor system and gather feedback

---

**Built with ❤️ for SmartLab Hospital**  
_Professional Blood Cell Quality Testing System_

- **[HOW_TO_RUN.md](HOW_TO_RUN.md)** - Detailed setup and running instructions#### 2. รันแอปพลิเคชัน

- **[DOCKER_README.md](DOCKER_README.md)** - Docker deployment guide

- **API Docs**: http://localhost:8000/docs (Swagger UI)```bash

streamlit run app.py

## 🔐 Login Credentials```

````#### 3. เข้าสู่ระบบ

Administrator: admin / admin123

Supervisor: supervisor / super123ใช้ข้อมูลเข้าสู่ระบบเริ่มต้น:

Analyst: analyst / analyst123

```- **Administrator**: admin / admin123

- **Supervisor**: supervisor / super123

## 🏗️ Architecture- **Analyst**: analyst / analyst123

- **Demo**: ใช้ปุ่ม "Demo Access"

````

┌─────────────────────────────────────────┐### การใช้งาน

│ Web Application │

│ │#### 📤 อัปโหลดข้อมูล

│ ┌──────────────┐ ┌──────────────┐ │

│ │ Frontend │ │ Backend │ │1. เลือก "Upload a new CSV file"

│ │ Next.js │───▶│ FastAPI │ │2. อัปโหลดไฟล์ CSV ที่มีคอลัมน์ต้องการ:

│ │ Port 3001 │ │ Port 8000 │ │ - `Lab Code`: รหัสห้องปฏิบัติการ

│ └──────────────┘ └──────────────┘ │ - `Brand code`: รหัสยี่ห้อ

│ React Python │ - `Model code`: รหัสรุ่นเครื่อง

│ TypeScript Pandas │ - คอลัมน์ข้อมูลการทดสอบต่างๆ

│ Tailwind CSS NumPy │

└─────────────────────────────────────────┘#### 🔄 การประมวลผล

````

1. ระบบจะแบ่งข้อมูลตาม Model Code อัตโนมัติ

## ✨ Features2. เลือก Model Code ที่ต้องการวิเคราะห์

3. ระบบจะคำนวณ Z-Score และให้เกรดอัตโนมัติ

- 🔐 **Authentication System** - JWT-based with role management

- 📤 **File Upload** - CSV file processing#### 📊 การวิเคราะห์

- 📊 **Data Analysis** - Z-score calculation and grading

- 📈 **Interactive Dashboard** - Real-time statistics- **Detailed Calculation Viewer**: ดูรายละเอียดการคำนวณ

- 📋 **Detailed Reports** - Model-specific analysis- **Visual Analysis**: กราฟแสดงการกระจายข้อมูล

- 💾 **Export Functionality** - CSV and Excel formats- **Quality Alerts**: แจ้งเตือนปัญหาคุณภาพ

- 📝 **Activity Logging** - Complete audit trail

- 👥 **Multi-user Support** - Administrator, Supervisor, Analyst roles#### 📥 การส่งออกข้อมูล



## 🛠️ Make Commands- **CSV Export**: ไฟล์ CSV พร้อมการคำนวณทั้งหมด

- **Excel Export**: ไฟล์ Excel หลายแผ่นงาน

```bash- **PDF Report**: รายงานละเอียดพร้อมคำแนะนำ

make help           # Show all commands- **Batch Export**: ส่งออกรายงานทุกห้องปฏิบัติการพร้อมกัน

make dev-backend    # Start backend (port 8000)

make dev-frontend   # Start frontend (port 3001)### สิทธิ์การเข้าถึง

make up             # Start Docker containers

make down           # Stop Docker containers#### Administrator

make logs           # View container logs

make status         # Check container status- เข้าถึงทุกฟีเจอร์

```- ดู Analytics Dashboard

- ปรับแต่งการตั้งค่า Z-Score Thresholds

## 📁 Project Structure- ดู Activity Log ทั้งหมด



```#### Supervisor

BloodCellQualityTesting/

├── app/                    # Frontend (Next.js + TypeScript)- วิเคราะห์ข้อมูลทั้งหมด

│   ├── src/- ดู Analytics Dashboard

│   │   ├── app/           # Pages (login, dashboard, analysis)- ส่งออกรายงาน

│   │   ├── components/    # React components- ดูแจ้งเตือนคุณภาพ

│   │   ├── contexts/      # Auth context

│   │   ├── lib/           # API client#### Analyst

│   │   └── types/         # TypeScript types

│   ├── Dockerfile- วิเคราะห์ข้อมูล

│   └── package.json- ส่งออกรายงานพื้นฐาน

│- ดูผลการวิเคราะห์

├── web-app/backend/       # Backend (FastAPI + Python)

│   ├── main.py           # API server### ระบบแจ้งเตือนคุณภาพ

│   ├── requirements.txt  # Dependencies

│   ├── venv/             # Virtual environment#### 🚨 Critical Alert (สีแดง)

│   ├── Dockerfile

│   └── data/             # Uploads & results- เกรด "Serious problem" (Z-Score > 3)

│- ต้องการการตรวจสอบด่วน

├── docker-compose.yml     # Docker orchestration

├── Makefile              # Quick commands#### ⚠️ Warning Alert (สีส้ม)

└── README.md             # This file

```- เกรด "Unsatisfactory" (Z-Score 2-3)

- ควรตรวจสอบและปรับปรุง

## 🔧 Technologies

### การบำรุงรักษา

### Frontend

- **Next.js 15** - React framework with App Router#### การสำรองข้อมูล

- **TypeScript** - Type-safe JavaScript

- **Tailwind CSS** - Utility-first CSS- `users.json`: ข้อมูลผู้ใช้

- **React Hooks** - Modern state management- `activity_log.json`: บันทึกการใช้งาน

- `split_by_model_code/`: ไฟล์ข้อมูลที่แบ่งแล้ว

### Backend

- **FastAPI** - High-performance Python framework#### การอัปเดต

- **Pandas** - Data manipulation and analysis

- **NumPy** - Numerical computing1. สำรองข้อมูลสำคัญ

- **JWT** - Secure authentication2. อัปเดตไฟล์ `app.py`

- **Uvicorn** - ASGI server3. ติดตั้ง dependencies ใหม่หากจำเป็น

4. ทดสอบระบบ

### DevOps

- **Docker** - Container platform### การแก้ไขปัญหา

- **Docker Compose** - Multi-container management

#### ปัญหาการเข้าสู่ระบบ

## 📊 API Endpoints

- ตรวจสอบไฟล์ `users.json`

### Authentication- รีเซ็ตรหัสผ่านด้วยการลบไฟล์และรีสตาร์ท

- `POST /api/auth/login` - User login

- `POST /api/auth/logout` - User logout#### ปัญหาการอัปโหลดไฟล์

- `GET /api/auth/me` - Current user info

- ตรวจสอบรูปแบบไฟล์ CSV

### Analysis- ตรวจสอบคอลัมน์ที่จำเป็น

- `POST /api/analysis/upload` - Upload CSV file- ตรวจสอบการเข้ารหัสไฟล์ (UTF-8)

- `GET /api/analysis/models` - List available models

- `GET /api/analysis/results/{model_code}` - Get analysis results#### ปัญหาการส่งออก PDF

- `GET /api/analysis/export/{model_code}` - Export report

- ตรวจสอบการติดตั้ง reportlab

### Admin- ตรวจสอบสิทธิ์การเขียนไฟล์

- `GET /api/admin/activity-logs` - View activity logs

- `GET /api/admin/statistics` - System statistics### การสนับสนุน



## 🐛 Troubleshootingสำหรับการสนับสนุนทางเทคนิค:



### Port Already in Use1. ตรวจสอบ Activity Log เพื่อระบุปัญหา

```bash2. ตรวจสอบ Console Log ใน Browser

lsof -i :8000  # Check what's using port 80003. ติดต่อผู้ดูแลระบบพร้อมรายละเอียดข้อผิดพลาด

lsof -i :3001  # Check what's using port 3001

kill -9 <PID>  # Kill the process### ข้อกำหนดระบบ

````

- Python 3.8+

### Backend Not Responding- RAM 4GB ขึ้นไป

```bash- เว็บเบราว์เซอร์สมัยใหม่

cd web-app/backend- พื้นที่จัดเก็บข้อมูล 1GB ขึ้นไป

source venv/bin/activate

python -m uvicorn main:app --reload --port 8000### การอัปเกรดในอนาคต

```

- การเชื่อมต่อฐานข้อมูล

### Frontend Build Issues- การส่งอีเมลแจ้งเตือนอัตโนมัติ

```bash- การวิเคราะห์แนวโน้มเชิงเวลา

cd app- การเปรียบเทียบข้อมูลข้ามช่วงเวลา

rm -rf node_modules .next- API สำหรับการเชื่อมต่อระบบภายนอก

npm install
npm run dev
```

## 🔒 Security Notes

- Change `SECRET_KEY` in production
- Use strong passwords
- Enable HTTPS in production
- Regular security updates
- Backup data regularly

## 📝 License

Professional hospital-grade application for blood cell quality testing.

## 🤝 Support

For issues or questions:

1. Check API documentation: http://localhost:8000/docs
2. Review logs: `make logs`
3. Check troubleshooting section above

---

**Current Status**: ✅ Running in Development Mode

- Backend: http://localhost:8000
- Frontend: http://localhost:3001
- API Docs: http://localhost:8000/docs
