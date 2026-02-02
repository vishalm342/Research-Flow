# ResearchFlow 🧠🌊

> **Deep Research. Automated.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Orchestration-orange)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Powered%20By-Groq-red)](https://groq.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

**ResearchFlow** is an autonomous AI programming agent system designed to conduct in-depth internet research and generate high-quality, comprehensive reports. By orchestrating a team of specialized AI agents—a **Researcher**, a **Writer**, and an **Editor**—ResearchFlow transforms a single user prompt into a polished, citation-backed document, turning hours of manual work into a seamless automated workflow.

---

## 🚀 Why ResearchFlow?

In the era of information overload, finding accurately sourced summaries is difficult. Simple LLM chats often hallucinate facts or provide shallow answers. ResearchFlow solves this by forcing a **structure** of behavior that mimics a real-world editorial team.

### The Impact
*   **Accuracy & Grounding:** By using real-time web search (Tavily/DuckDuckGo), ResearchFlow reduces hallucinations. Every claim is cross-referenced with live data.
*   **Depth over Breadth:** Unlike a standard chatbot that gives you one shot, ResearchFlow iterates. The **Editor** agent critiques the **Writer's** draft, forcing rewrites until quality standards are met.
*   **Enterprise Speed:** Powered by **Groq's** LPU inference engine, complex multi-agent reasoning steps that usually take minutes happen in seconds.
*   **For Everyone:** From academic researchers to market analysts, this tool democratizes access to deep, structured report generation without needing prompt engineering expertise.

---

## ⚡ Key Features

*   **🕵️‍♂️ Autonomous Researcher Agent:** Intelligently queries search engines, scrapes top results, and extracts key facts relevant to the user's topic.
*   **✍️ Pro Writer Agent:** Synthesizes scattered data into structured, readable reports with proper sections and flows.
*   **📝 Critical Editor Agent:** Reviews drafts for clarity, accuracy, and flow, rejecting sub-par work and requesting revisions automatically.
*   **🕸️ Graph-Based Workflow:** Built on **LangGraph**, enabling complex state management, loops (Editor sending back to Writer), and conditional logic.
*   **⚡ High-Performance Backbone:** Uses **FastAPI** for asynchronous request handling and **MongoDB** for session persistence.
*   **🎨 Modern React UI:** A clean, responsive interface to track agent progress live and view beautifully formatted Markdown reports.

---

## 🏗️ Architecture

ResearchFlow treats the research process as a state machine via LangGraph:

1.  **User Input:** Topic is received via the Frontend.
2.  **Research Phase:** The **Researcher** generates search queries, fetches content using Tavily/DuckDuckGo, and summarizes findings.
3.  **Drafting Phase:** The **Writer** takes the research data and produces a first draft.
4.  **Review Phase:** The **Editor** critiques the draft.
    *   *If valid:* The workflow ends.
    *   *If invalid:* The Editor provides feedback, and control loops back to the **Writer**.
5.  **Delivery:** The final report is streamed to the user.

---

## 🛠️ Tech Stack

### Backend
*   **Core:** Python 3.11+, FastAPI
*   **AI Orchestration:** LangChain, LangGraph
*   **LLM Provider:** Groq (primary), OpenAI (compatible)
*   **Search & Scrape:** Tavily API, DuckDuckGo Search, BeautifulSoup4
*   **Database:** MongoDB (Motor async driver)

### Frontend
*   **Framework:** React (Vite)
*   **Styling:** Tailwind CSS
*   **Animation:** Framer Motion
*   **State:** React Hooks

---

## 🏁 Getting Started

### Prerequisites
*   [Docker](https://www.docker.com/) & Docker Compose (Recommended)
*   OR Python 3.10+ & Node.js 18+
*   API Keys:
    *   **Groq API Key:** For the LLM ([Get it here](https://console.groq.com/))
    *   **Tavily API Key:** For search ([Get it here](https://tavily.com/))

### Installation (Docker - Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/Research-Flow.git
    cd Research-Flow
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in `backend/` and `frontend/`:
    
    `backend/.env`:
    ```env
    GROQ_API_KEY=gsk_...
    TAVILY_API_KEY=tvly-...
    MONGODB_URL=mongodb://mongodb:27017
    ```

3.  **Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```

4.  **Access the App:**
    *   Frontend: `http://localhost:5173`
    *   Backend Docs: `http://localhost:8000/docs`

### Manual Installation

<details>
<summary>Click to view manual setup instructions</summary>

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

</details>

---

## 💡 Usage

1.  Open the dashboard at `http://localhost:5173`.
2.  Click **"Start New Research"**.
3.  Enter a research topic (e.g., *"The impact of Quantum Computing on Cybersecurity in 2025"*).
4.  Watch the agents work in real-time:
    *   See the **Researcher** finding sources.
    *   Watch the **Writer** drafting.
    *   Wait for the **Editor's** seal of approval.
5.  Read, download, or copy your final report.

---

## 🔮 Roadmap

*   [ ] **Export Options:** PDF and Docx export support.
*   [ ] **Human-in-the-Loop:** Allow users to pause and guide the researcher mid-flow.
*   [ ] **Multi-Session Context:** Allow agents to remember previous research sessions.
*   [ ] **Local LLM Support:** Integration with Ollama for privacy-focused offline research.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by Vishal M.
</p>
