# Advanced Development

This repository contains three independent application projects covering
e-commerce, video sharing, and AI-powered research.

## Projects

### [FastMart](./FastMart/README.md)

FastMart is a full-stack grocery and general shopping platform built with
React, Express, MongoDB, and Mongoose. It includes customer authentication,
product browsing, cart and checkout flows, Razorpay payments, reviews, order
tracking, Cloudinary image uploads, and an admin dashboard for managing
products, users, orders, and analytics.

### [MiniTube](./mini_tube/README.md)

MiniTube is a lightweight video-sharing application built with a FastAPI
backend and React frontend. Users can register, log in, upload and watch
videos, search the video catalogue, like videos, add comments, and delete
their own uploads. SQLite stores application data and uploaded files are kept
in the local `uploads` directory.

### [MultiAgent ResearchMind](./multiAgent/README.md)

MultiAgent ResearchMind is an AI-assisted research application built with
Streamlit, LangChain, Google Gemini, and Tavily. It searches for relevant
sources, scrapes useful content, creates a structured research report, and
uses a critic chain to review the result. The project also includes optional
PDF/TXT document Q&A and Astra DB vector-store modules.

## Detailed documentation

Each project has its own README with installation instructions, architecture,
configuration, API details, available commands, and deployment notes.