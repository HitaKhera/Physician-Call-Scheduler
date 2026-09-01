# 🩺 Physician Call Scheduler & Clinical Rotation Engine

A clinical-grade, constraint-aware physician call scheduling platform designed for hospital departments, residency training programs, and multi-specialty medical groups. Built with React 19, TypeScript, Tailwind CSS, Express, and Google Gemini AI.

---

## 📋 Features

### 1. 🔄 Automated Rotation Engine
- **Deterministic Constraint Solver**: Automatically schedules Primary 24h Call, Backup Attending Call, Weekend Rounds, and Night Float shifts across attendings, fellows, and residents.
- **ACGME & Duty Hour Compliance**:
  - Rest window enforcement (>48h between 24-hour primary calls).
  - Maximum consecutive night float stretch capping (default: 4 nights).
  - FTE-weighted call volume distribution.
  - 1:1 parity for weekend and recognized clinical holiday coverage.
- **AI Chief Medical Officer Schedule Review**: Powered by the Google Gemini API to analyze fatigue hotspots, identify acute coverage vulnerabilities, and recommend actionable burnout mitigation protocols.

### 2. 📅 Interactive Multi-View Calendar
- **4 Operational Views**:
  - **Month Grid**: Comprehensive department overview with day-level shift badges and conflict indicators.
  - **Week Planner**: Time-blocked weekly layout for acute operational coordination.
  - **Day Focus**: In-depth daily roster with one-click peer trade and direct reassignment actions.
  - **Physician Timeline**: Gantt-style matrix tracking individual doctor duty distributions across the month.
- **Color-Coded Shift Hierarchy**:
  - 🟢 **Primary 24h Call** (`#10B981`)
  - 🔵 **Backup Call** (`#0EA5E9`)
  - 🟣 **Night Float** (`#6366F1`)
  - 🟡 **Weekend Rounds** (`#F59E0B`)
  - 🔴 **Trauma Response Call** (`#F43F5E`)
- **Real-Time Conflict Detection**: Instant alerts for blackout dates, double bookings, and rest-period infringements.

### 3. 👥 Roster & Blackout Date Management
- **Detailed Clinician Profiles**: Specialty tracking, clinical rank (Attending, Fellow, PGY-3 Senior, PGY-2 Junior), FTE ratios, emergency contacts, and monthly shift targets.
- **Interactive Blackout Date Picker**: Clinicians can log unavailable dates with categorized reasons (CME Conferences, Board Exams, Vacations, Post-Call Rest, Wellness).

### 4. 🤝 Shift Swap & Trade Portal
- **Direct 1:1 Trades & Open Coverage Board**: Clinicians can propose direct swaps or post open call slots for department pickup.
- **Fatigue & Conflict Pre-Validation**: Validates duty hour rules before allowing a trade request to be submitted.
- **Chief Administrative Approval Workflow**: 1-click administrative sign-off that updates the live schedule immediately.

### 5. 📊 Workload & Equity Analytics
- **Department Equity Index**: Gini-derived fairness scoring normalized by physician FTE.
- **Burdens Breakdown**: Visual comparisons of total hours, overnight shifts, weekend calls, and holiday duty distribution.

### 6. 📤 Multi-Channel Export & Announcements
- **iCalendar (.ics)**: One-click export to Google Calendar, Apple Calendar, and Microsoft Outlook.
- **Spreadsheet (.csv)**: Export full monthly duty rosters for departmental administration.
- **AI Broadcast Generator**: Generates formatted broadcast emails and pager bulletins summarizing the finalized schedule and clinical reminders.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, tsx, esbuild
- **AI / LLM**: Google Gemini API (`@google/genai`)
- **Build Tool**: Vite 6

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Gemini API Key**: (Optional, for AI schedule analysis and announcement generation)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/physician-call-scheduler.git
   cd physician-call-scheduler
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional for local testing):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 📦 Build & Production

To build the production bundle and start the server:

```bash
# Build Vite frontend and bundle Express backend with esbuild
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── AutoRotationEngine.tsx      # Constraint solver & AI schedule analysis
│   │   ├── CalendarDashboard.tsx       # Month, Week, Day, and Timeline calendar views
│   │   ├── FairnessAnalytics.tsx       # Workload parity & FTE-normalized equity metrics
│   │   ├── Header.tsx                  # Top navigation, conflict alerts, and export menu
│   │   ├── RosterManager.tsx           # Physician directory & blackout date manager
│   │   ├── ScheduleAnnouncementModal.tsx # AI announcement & broadcast generator
│   │   └── ShiftSwapModule.tsx         # Peer shift trades and chief approval queue
│   ├── utils/
│   │   ├── mockData.ts                 # Default clinical rosters and shift data
│   │   └── schedulerEngine.ts          # Constraint checking algorithms & export utilities
│   ├── types.ts                        # Core TypeScript models and interfaces
│   ├── App.tsx                         # Main state orchestrator
│   ├── main.tsx                        # React application entry point
│   └── index.css                       # Global styles and Tailwind imports
├── server.ts                           # Express server proxying Gemini API requests
├── metadata.json                       # Applet configuration and permissions
├── package.json                        # Dependencies and scripts
└── vite.config.ts                      # Vite configuration with Tailwind CSS plugin
```

---

## 🔒 Duty Hour & Safety Constraints

The built-in deterministic validation engine checks against the following clinical scheduling rules:

| Constraint | Description | Severity |
| :--- | :--- | :--- |
| **Double Booking** | Physician assigned to multiple duties on the same calendar day | `CRITICAL` |
| **Blackout Date Violation** | Physician assigned on an approved CME / vacation blackout day | `CRITICAL` |
| **Post-Call Rest Rule** | Less than 48 hours between consecutive 24h Primary Call shifts | `WARNING` |
| **Night Float Cap** | More than 4 consecutive night float duties assigned | `WARNING` |
| **Monthly Target Exceeded** | Physician assigned more shifts than their contracted FTE limit | `WARNING` |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
