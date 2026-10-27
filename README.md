# Research Compass AI
### AI-Based Research Intelligence System

Research Compass AI is a software-based research intelligence platform designed to help students and researchers analyse multiple research papers in one place. It uses Natural Language Processing (NLP) and Machine Learning (ML) techniques to explore research topics, identify patterns in algorithms and datasets, discover potential research gaps, and generate possible research directions.

Instead of reviewing every paper independently, users can analyse a collection of research papers and gain a structured overview of the research landscape.

## Project Objectives

- Simplify the analysis and comparison of research papers.
- Identify important research topics, algorithms, datasets, and keywords.
- Discover relationships between papers using semantic similarity.
- Group related papers into research-topic clusters.
- Identify potential research gaps using corpus-level patterns and supporting evidence.
- Generate possible research directions based on the identified gaps.
- Provide an interactive dashboard for exploring research insights.

## Key Features

### 1. Research Paper Management
Upload and analyse research-paper PDFs, view extracted metadata, and manage the papers included in the research corpus.

### 2. Research Landscape
Visualise research topics, algorithm usage, dataset concentration, keywords, and discovered topic clusters through interactive charts and summaries.

### 3. Potential Research Gap Analysis
Analyse patterns such as underrepresented topics, repeated algorithms, dataset concentration, and future-work statements to identify potential research gaps. Supporting evidence helps users understand the basis of each finding.

### 4. Research Idea Generation
Convert identified research gaps into possible research directions with problem descriptions, suggested approaches, feasibility indicators, and links to relevant literature.

### 5. Similar Papers
Search for semantically related research papers using an idea, hypothesis, or text query. The system ranks relevant papers using text embeddings and similarity analysis.

### 6. Machine Learning Model Lab
Explore unsupervised clustering and compare classification models, including:

- Naive Bayes
- Logistic Regression
- Support Vector Machine (SVM)
- Decision Tree
- Random Forest
- K-Nearest Neighbours (KNN)
- Multi-Layer Perceptron (MLP)

The Model Lab provides classification metrics and topic-prediction functionality for the available research corpus.

## Technologies Used

**Frontend:** React, TypeScript, Vite, Recharts

**Backend and data processing:** Python, FastAPI, PyMuPDF, SQLite

**Natural Language Processing:** TF-IDF, Sentence Transformers, `all-MiniLM-L6-v2`

**Machine Learning:** Scikit-learn, K-Means clustering, cosine similarity, and classification algorithms

**Development Tools:** Git, GitHub, and Visual Studio Code or a compatible IDE

## System Workflow

1. Upload research-paper PDFs.
2. Validate the files and extract available text and metadata.
3. Preprocess the extracted text for analysis.
4. Represent text using TF-IDF features and semantic embeddings.
5. Apply similarity analysis, clustering, and classification.
6. Analyse research topics, algorithms, datasets, and related patterns.
7. Identify potential research gaps and associate them with supporting evidence.
8. Generate possible research directions and display the findings through the dashboard.

## Project Structure

The repository contains the frontend application and supporting backend/project files.

```text
research-compass-ai/
├── backend/          # Backend and analysis-related files
├── public/           # Public assets
├── src/              # Frontend source code
├── package.json      # Project scripts and dependencies
├── package-lock.json # Dependency lock file
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # Project documentation
```

Additional configuration files and project assets may also be present.

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- Python, if required by the backend
- A modern web browser

### Run the Frontend

**1. Clone the repository**

```bash
git clone https://github.com/jonachris153/research-compass-ai.git
```

**2. Navigate to the project directory**

```bash
cd research-compass-ai
```

**3. Install the dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

Open the local URL displayed in the terminal to access the application.

### Backend Setup

If the backend is required for paper processing and machine-learning features, install its dependencies using the configuration provided in the `backend/` directory and start it using the project's configured startup command. Configure any required API URLs or environment variables before running the application.

**Note:** The frontend and backend may need to run separately, depending on the current project configuration.

## Expected Outputs

Research Compass AI provides:

- Research corpus summaries
- Extracted paper metadata
- Topic clusters and similarity results
- Algorithm and dataset usage visualisations
- Potential research gaps with supporting evidence
- Suggested research directions
- Classification metrics and predicted research topics

## Research Gap Interpretation

The system identifies **potential research gaps within the analysed corpus**. Its scores and insights are indicators derived from the available papers, not proof of global research novelty.

Researchers should verify suggested gaps and ideas through broader literature searches and critical review before using them as claims of novelty.

## Applications

- Academic research and literature reviews
- Student project ideation
- Research planning
- Emerging-technology analysis
- University research groups
- Research and development teams
- Cross-domain literature exploration

## Future Scope

Potential improvements include expanding the supported research domains, analysing citation networks, integrating knowledge graphs, improving evidence extraction, incorporating larger research collections, and enhancing research-direction recommendations.
