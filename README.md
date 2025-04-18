# Chatbot Desktop 🤖

A modern desktop application for LLM chatbots with advanced features including online search, file uploads, and multi-model support. ✨

## Features 🚀

- **Multi-Model Support** 🧠
  - OpenAI models
  - Claude models
  - OpenRouter integration (access to various models)

- **Search Capabilities** 🔍
  - Google Search integration
  - Exa.ai Search
  - Exa.ai Browse
  - Real-time search results review

- **File Handling** 📁
  - PDF file uploads
  - Image uploads
  - (Planned) Word/PDF parsing

- **User Experience** 🎯
  - Resizable textarea
  - Light/Dark theme 
  - Multilingual support
  - Customizable system prompts
  - Model provider switching
  - API key management

## TODO List 📋

### Message Management
- [ ] Message list pagination
- [ ] Message search functionality
- [ ] Message categorization and tagging

### Performance Optimization
- [ ] Virtual scrolling for message list
- [ ] Lazy loading for message content
- [ ] Message list performance optimization
- [ ] Memory usage optimization for long conversations


## Getting Started 🎮

### Search Feature Setup
1. Navigate to Settings -> Advanced -> RAG Settings
2. Input your preferred search API key (Exa.ai recommended)

### Model Configuration
1. Access Settings to configure your preferred model provider
2. Input the corresponding API key
3. Customize model settings as needed

## Screenshots 📸

### Model Provider Selection
![Model Provider Selection](./screenshots/Screenshot%202025-04-17%20174853.png)

### Model Customization
![Model Customization](./screenshots/Screenshot%202025-04-17%20174916.png)

### Search API Configuration
![Search API Configuration](./screenshots/Screenshot%202025-04-17%20174941.png)

### Online Search Feature
![Online Search](./screenshots/Screenshot%202025-04-17%20230030.png)

### Search Results Review
![Search Results](./screenshots/Screenshot%202025-04-17%20175113.png)

### Image Support
![Image Support](./screenshots/Screenshot%202025-04-17%20230341.png)

### Conversation Settings
![Conversation Settings](./screenshots/Screenshot%202025-04-17%20174756.png)

## Changelog 📝

### 2025-04-17
- Added OpenAI model provider support
- Code structure refactoring
- Bug fixes

### 2025-02-17
- Added OpenRouter support
- Restructured model message stream implementation using Vercel AI SDK

## Background 📚

This project was inspired by the need for a clean, feature-rich desktop chatbot application. While reviewing various open-source projects, we noticed most lacked essential features like online search and browsing capabilities. Based on the open-source project [Chatbox](https://github.com/Bin-Huang/chatbox.git), we've created a streamlined version that removes commercial features while adding support for Claude and OpenRouter.

## References 🔗

- Original project: [Chatbox](https://github.com/Bin-Huang/chatbox.git)
