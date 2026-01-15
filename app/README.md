# SmartLab Hospital - Blood Cell Quality Testing System

A modern, professional web application designed specifically for hospital environments to manage and analyze blood cell quality testing results. This system replaces traditional Streamlit applications with a robust, scalable Next.js frontend and planned FastAPI backend.

## 🏥 Project Overview

SmartLab Hospital is a comprehensive laboratory information management system that provides:

- **Professional Medical Interface** - Clean, hospital-grade UI designed for medical professionals
- **Advanced Quality Analysis** - Z-Score calculations and automated grading system
- **Multi-file Processing** - Batch upload and processing of CSV test results
- **Real-time Reporting** - PDF generation and comprehensive analytics
- **Role-based Access Control** - Administrator, Supervisor, and Analyst roles
- **Quality Alerts** - Automated flagging of concerning test results

## 🚀 Technology Stack

### Frontend

- **Next.js 15.5.4** - React-based web framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework with custom medical theming
- **React Hook Form** - Efficient form handling
- **Lucide React** - Modern icon library
- **Recharts** - Data visualization components

### Data Processing

- **Papa Parse** - CSV file parsing and processing
- **jsPDF** - PDF report generation
- **Custom Analysis Engine** - Z-Score calculations and quality grading

### Development Tools

- **Node.js 24.9.0** - Runtime environment
- **npm** - Package manager
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## 📋 Features

### Authentication & Access Control

- Demo login system with role-based access (Administrator, Supervisor, Analyst)
- Professional medical-themed login interface
- User session management

### Dashboard Interface

- **Real-time Statistics** - Total tests, quality alerts, active labs, average scores
- **Activity Monitoring** - Recent system activities and user actions
- **Quality Distribution** - Visual representation of test result grades
- **File Upload Interface** - Drag-and-drop CSV file processing

### Data Analysis Engine

- **Z-Score Calculations** - Statistical analysis against reference ranges
- **Automated Grading** - Five-tier quality grading system:
  - Excellent (Z-score ≤ 1.0)
  - Good (Z-score ≤ 1.5)
  - Satisfactory (Z-score ≤ 2.0)
  - Unsatisfactory (Z-score ≤ 3.0)
  - Serious (Z-score > 3.0)
- **Quality Flags** - Automated alerts for concerning results
- **Reference Ranges** - Comprehensive blood parameter standards

### Supported Blood Parameters

- White Blood Cells (WBC)
- Red Blood Cells (RBC)
- Hemoglobin
- Hematocrit
- Mean Corpuscular Volume (MCV)
- Mean Corpuscular Hemoglobin (MCH)
- Mean Corpuscular Hemoglobin Concentration (MCHC)
- Platelets
- Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils

### Report Generation

- **Comprehensive PDF Reports** - Laboratory test summaries
- **Detailed Test Reports** - Individual test analysis with parameters
- **Quality Analysis Reports** - Period-based quality assessments
- **Laboratory Performance Reports** - Multi-lab comparative analysis

## 🛠 Installation

### Prerequisites

- Node.js 18+ (recommended: 24.9.0)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd BloodCellQualityTesting/app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open application**
   - Navigate to `http://localhost:3001` (Grafana commonly uses `3000`; use `3001` for this app)
   - Use demo credentials to login:
     - Administrator: `admin/admin123`
     - Supervisor: `supervisor/super123`
     - Analyst: `analyst/analyst123`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with medical theming
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main dashboard page
├── components/            # Reusable React components (future)
├── lib/                   # Utility libraries
│   ├── analysis.ts        # Z-score calculations and grading
│   ├── csv.ts             # CSV processing and validation
│   └── reports.ts         # PDF report generation
└── types/                 # TypeScript type definitions
    └── index.ts           # Application data models
```

## 🎨 Design System

### Color Palette

- **Primary**: Medical blues (#2563eb, #1e40af, #1e3a8a)
- **Success**: Green tones for excellent/good results
- **Warning**: Yellow/orange for concerning results
- **Error**: Red tones for serious alerts
- **Neutral**: Professional grays for interface elements

### Component Classes

- `medical-card` - Standard card container
- `medical-button` - Button styles with variants
- `medical-input` - Form input styling
- `grade-*` - Quality grade specific styling

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code analysis

## 📊 CSV File Format

### Required Headers

- Sample ID
- Test Date
- Analyst
- Laboratory
- WBC, RBC, Hemoglobin, Hematocrit
- MCV, MCH, MCHC, Platelets
- Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils

### Optional Headers

- Patient ID
- Comments/Notes

### Sample CSV Template

The application provides a downloadable CSV template with sample data for reference.

## 🚧 Future Development

### Backend Integration (Planned)

- **FastAPI Backend** - RESTful API with Python
- **Database Integration** - SQLite/PostgreSQL for data persistence
- **Authentication System** - JWT-based secure authentication
- **Real-time Updates** - WebSocket connections for live data

### Enhanced Features (Roadmap)

- **Advanced Analytics** - Trend analysis and predictive insights
- **Multi-language Support** - Internationalization
- **Mobile Responsive** - Enhanced mobile interface
- **Integration APIs** - Laboratory equipment integration
- **Audit Trails** - Comprehensive activity logging

## 🔒 Security Considerations

- Input validation for all file uploads
- Secure file processing with size limits
- Type-safe data handling with TypeScript
- Medical data privacy compliance ready

## 🤝 Contributing

This is a specialized medical application. Please ensure any contributions:

- Follow medical software development best practices
- Include appropriate testing for data accuracy
- Maintain HIPAA compliance considerations
- Use TypeScript for type safety

## 📄 License

[License information to be added]

## 📞 Support

For technical support or medical use questions, please contact the development team.

---

**Note**: This application is designed for hospital laboratory environments. Ensure proper validation and testing before use in production medical settings.
