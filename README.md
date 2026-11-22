# CITI-Senti

**Citizen Feedback Intelligence via Glot500-m for Trilingual Aspect-Based Sentiment Analysis in Baguio City**

CITI-Senti is a research-based web application designed to analyze multilingual citizen feedback concerning local government policies, ordinances, resolutions, programs, services, and public issues in Baguio City.

The project applies Aspect-Based Sentiment Analysis (ABSA) using a fine-tuned Glot500-m multilingual language model to identify policy-related aspect categories and classify their corresponding sentiments as **Positive, Neutral, or Negative**.

CITI-Senti focuses on feedback expressed in **English, Tagalog, and Ilocano**, including code-switched comments, to support a more detailed understanding of citizen perspectives in a linguistically diverse environment.

## Project Objectives

The project aims to:

- Develop a multilingual aspect-based sentiment analysis approach for citizen feedback concerning local governance in Baguio City.
- Fine-tune Glot500-m for multi-label aspect-category detection and aspect-level sentiment classification.
- Evaluate the proposed approach against Logistic Regression and Linear Support Vector Machine (SVM) baselines.
- Develop a web-based platform that allows users to analyze multilingual feedback and voluntarily contribute their comments.
- Present aggregated aspect and sentiment insights that may support the systematic examination of public concerns and perceptions of local government initiatives.

## Key Features

### Citizen Portal

- **Analyze Feedback** — Analyze English, Tagalog, Ilocano, and code-switched comments to identify policy-related aspects and their corresponding sentiments.
- **Contribute Feedback** — Voluntarily submit feedback and securely view, edit, or delete contributions without creating an account.
- **Public Insights** — Explore aggregated feedback statistics, aspect frequencies, and sentiment distributions.
- **Aspect Categories** — View the 11 predefined categories used to organize policy-related concerns.
- **How It Works** — Learn about the multilingual analysis process, interpretation of predictions, and model limitations.
- **About CITI-Senti** — Explore the project's background, objectives, significance, and research information.

### Admin Portal

- **Admin Dashboard** — Monitor feedback submissions, processing activity, and overall sentiment patterns.
- **Feedback Management** — Review, moderate, and organize citizen submissions and associated policy information.
- **Policy Insights and Reports** — Analyze policy-specific feedback, compare sentiment patterns, examine trends, and export analytical data.

## Aspect-Based Sentiment Analysis

Unlike conventional sentiment analysis, which typically assigns a single sentiment to an entire comment, CITI-Senti identifies multiple policy-related aspects within the same text and predicts the sentiment associated with each detected category.

The system uses 11 predefined aspect categories:

| Code | Aspect Category |
|---|---|
| A01 | Policy Benefits and Impact |
| A02 | Implementation and Enforcement |
| A03 | Cost, Fees and Penalties |
| A04 | Accessibility and Convenience |
| A05 | Fairness and Inclusivity |
| A06 | Rules and Policy Provisions |
| A07 | Government Administration and Responsiveness |
| A08 | Public Safety and Security |
| A09 | Environmental Impact |
| A10 | Traffic and Transportation Impact |
| A11 | Other |

Each detected aspect is classified as **Positive, Neutral, or Negative**, allowing comments discussing multiple concerns to be analyzed at the aspect-category level.

## Research Scope

CITI-Senti focuses on textual citizen feedback relevant to local governance in Baguio City. It supports multilingual and code-switched expressions involving English, Tagalog, and Ilocano.

The research evaluates fine-tuned Glot500-m against traditional machine learning baselines using precision, recall, and Macro-F1 score, including additional analysis across the three languages.

The web application is intended to use the selected fine-tuned Glot500-m model for live feedback analysis. Model training and experimental evaluation are maintained separately from the web application.

## Project Status

**In Development**

CITI-Senti is currently under active research and development. Application features, model integration, database implementation, and deployment are being developed progressively.

## Disclaimer

CITI-Senti is an academic research project and is not an official platform of the Baguio City Government.

The system's predictions are generated through automated natural language processing and may contain inaccuracies. Aggregated findings reflect the feedback collected through the platform and should not be interpreted as representative of the entire population of Baguio City.

The application is intended to support research and the interpretation of citizen feedback, not to make official government decisions.