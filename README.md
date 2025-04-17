# Chatbot-desktop
Desktop application for LLM chatbot.
## 2025-04-17 update notes
Add new model provider OpenAI.
Refactor the code structure to make it more concise.
Bug fix.
## 2025-02-17 update notes
Now the project has supported OpenRouter, which means you can switch any models you want. Besides, I have resturctured the implementation of model message stream. It's more clear and simple by using Vercel AI SDK.
## Background
I reviewed many open-source projects, and most only have basic text chat functionality without support for online search or browse. Therefore, I decided to develop a clean version based on the open-source project [Chatbox](https://github.com/Bin-Huang/chatbox.git), removing many of its commercial features, and adding support for Claude and OpenRouter. 

## Screenshots
![screenshot](./screenshots/Screenshot%202025-04-17%20174853.png)
Support three model providers, you can input your API key here.
![screenshot](./screenshots/Screenshot%202025-04-17%20174916.png)
You can customize the model you use.
![screenshot](./screenshots/Screenshot%202025-04-17%20174941.png)
Input your search API key. Recommend to use exa.ai, google sucks.
![screenshot](./screenshots/Screenshot%202025-04-17%20175108.png)
Click the online search button, turn on the search functionality. The model will determine whether to use tools.
![screenshot](./screenshots/Screenshot%202025-04-17%20175113.png)
Review the search results that are sent to the model
![screenshot](./screenshots/Screenshot%202025-04-17%20174756.png)
Conversation settings, you can modify system prompt here.

More features waiting for you to discover...
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
