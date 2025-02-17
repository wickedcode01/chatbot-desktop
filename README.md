# Chatbot-desktop
Desktop application for llm chatbot.
## 2025-02-17 update notes
Now the project has supported OpenRouter, which means you can switch any models you want. Besides, I have resturctured the implementation of model message stream. It's more clear and simple by using Vercel AI SDK.
## Background
I reviewed many open-source projects, and most only have basic text chat functionality without support for online search or browse. Therefore, I decided to develop a clean version based on the open-source project [Chatbox](https://github.com/Bin-Huang/chatbox.git), removing many of its commercial features, and adding support for Claude and OpenRouter. 



# Support Features
- ✅Google Search
- ✅Exa.ai Search
- ✅Exa.ai Browse
- ✅File upload (only support pdf)
- ✅Image upload
- ✅Resizable textarea
- ⭕Parse Word/PDF file etc.

# How to enable search feature
Settings -> Advanced -> RAG Settings
Input your API key.

# Reference
https://github.com/Bin-Huang/chatbox.git
