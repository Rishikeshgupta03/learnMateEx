# LearnMate v2

1. cd server && npm install
2. Copy .env.example to .env and add XAI_API_KEY.
3. npm start
4. Chrome -> chrome://extensions -> Developer mode -> Load unpacked -> extension/
5. Open the extension popup and enable Selection Assistant.
6. Select text on a webpage. Click the small 'Use LearnMate' bubble.
7. The side panel shows only Selected Text, actions, Result, plus your saved custom prompts.

Custom prompts are saved locally in Chrome and are reusable task-specific actions.

For testing without API credits, set USE_DEMO=true.

Never put the xAI API key in the extension. Keep it in the backend .env.