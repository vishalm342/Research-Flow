# ResearchFlow 🧠🌊

> Multi-agent AI research pipeline built with LangGraph, FastAPI, and React

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-FF9900?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

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

```text
User Query → [Researcher Agent] → [Writer Agent] → [Editor Agent] → [Refiner Agent] → Final Report
                   ↓                    ↓                  ↓                 ↓
            Web Search API        Draft Report       Quality Check      Score + Polish
```

## ⚙️ How It Works

1. **Researcher Agent**: Intelligently queries search engines, scrapes top results, and extracts key facts relevant to the user's topic.
2. **Writer Agent**: Synthesizes the scattered data gathered by the researcher into a structured, readable first draft.
3. **Editor Agent**: Reviews and critiques the draft for clarity, accuracy, and flow, rejecting sub-par work and requesting revisions automatically.
4. **Refiner Agent**: Applies final polish and assigns a quality score, ensuring the text is fully refined and ready for export.

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

```bash
# Clone the repository
git clone https://github.com/yourusername/Research-Flow.git
cd Research-Flow

# 1. Install and Run Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 2. Install and Run Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
```the agents work in real-time:
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
