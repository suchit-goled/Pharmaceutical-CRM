# 💊 AI Pharmaceutical CRM

An AI-powered Pharmaceutical Customer Relationship Management (CRM) system built using **React**, **FastAPI**, **LangGraph**, and **Groq LLM** to automate Medical Representative (MR) interactions with healthcare professionals.

---

## 🚀 Project Overview

Medical Representatives spend significant time manually recording doctor interactions after each visit.

This project uses **Large Language Models (LLMs)** and **LangGraph** to automatically:

- Extract structured CRM data
- Analyze doctor interactions
- Generate AI recommendations
- Predict business insights
- Validate CRM completeness
- Assist MRs using a conversational AI assistant

---

## ✨ Features

### 🤖 AI Interaction Extraction
- Convert natural language into structured CRM records
- Auto-fill doctor information
- Detect products, hospitals, samples, follow-ups, notes, and outcomes

### 📊 Interaction Analysis
- AI-generated interaction summary
- Sentiment Analysis
- Confidence Score
- Topic Extraction

### 💡 AI Suggestions
- Next Action Recommendation
- Follow-up Planning
- Priority Detection
- Recommended Promotional Material
- Engagement Score

### 📈 Visit Intelligence
- Prescription Probability
- Visit Success Score
- Competitor Risk
- Doctor Category
- Business Opportunity Prediction

### ✅ Compliance Check
- CRM Completion Validation
- Missing Field Detection
- Risk Assessment

### 💬 Pharma AI Assistant
Interactive AI Assistant capable of:

- Rewriting summaries
- Explaining sentiment
- Generating follow-up emails
- Creating next visit plans
- Identifying missing CRM fields
- Editing CRM data using natural language

---

# 🏗 Tech Stack

## Frontend

- React
- TypeScript
- Redux Toolkit
- Tailwind CSS
- Axios
- Lucide React
- Vite

---

## Backend

- FastAPI
- LangGraph
- Groq API
- Python
- Pydantic

---

## AI

- Groq LLM
- Prompt Engineering
- Structured JSON Extraction
- LangGraph State Management

---

# 🧠 LangGraph Workflow

The project is implemented using a LangGraph workflow consisting of multiple AI nodes.

```
User Input
      │
      ▼
Extraction Node
      │
      ▼
Analysis Node
      │
      ▼
Suggestions Node
      │
      ▼
Visit Intelligence Node
      │
      ▼
Compliance Node
      │
      ▼
Frontend Dashboard
```

---

# 🔄 LangGraph Nodes

## 1️⃣ Extraction Node

Converts doctor's conversation into structured CRM data.

Output includes:

- Doctor Name
- Hospital
- Specialization
- Product
- Visit Date
- Follow-up Date
- Samples
- Notes

---

## 2️⃣ Analysis Node

Analyzes the interaction.

Generates:

- Summary
- Sentiment
- Confidence Score
- Topics

---

## 3️⃣ Suggestions Node

Provides AI recommendations.

Generates:

- Next Action
- Follow-up
- Priority
- Engagement Score
- Recommended Material

---

## 4️⃣ Visit Intelligence Node

Predicts business insights.

Generates:

- Prescription Probability
- Visit Success Score
- Competitor Risk
- Doctor Category
- Business Opportunity

---

## 5️⃣ Compliance Node

Validates CRM completeness.

Checks:

- Missing Fields
- Ready for Submission
- Compliance Risk

---

# 💻 Folder Structure

```
Pharmaceutical-CRM
│
├── backend
│   ├── ai_graph
│   ├── services
│   ├── app.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Pharmaceutical-CRM.git
```

---

## Backend

```bash
cd backend

pip install -r requirements.txt

python -m uvicorn app:app --reload
```

Backend runs at

```
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# 📸 Application Features

- AI CRM Auto Fill
- AI Dashboard
- AI Suggestions
- Visit Intelligence
- Compliance Dashboard
- Pharma AI Chat Assistant
- Interactive CRM Form

---

# 🎯 Learning Outcomes

Through this project I learned:

- LangGraph Workflow Design
- Prompt Engineering
- State-based AI Applications
- FastAPI Backend Development
- React + Redux State Management
- LLM Integration using Groq
- AI-assisted CRM Automation
- Pharmaceutical Sales Workflow

---

# 🔮 Future Improvements

- Voice-based interaction logging
- OCR for doctor's handwritten notes
- Multi-language support
- PDF report generation
- Email automation
- Calendar integration
- Cloud deployment
- Authentication & Role-based Access

---

# 👨‍💻 Author

**Suchit Goled**

Electronics & Communication Engineering Student

Passionate about AI, Full Stack Development, Embedded Systems, and Intelligent Healthcare Applications.

---

# 📄 License

This project is developed for educational and demonstration purposes.
