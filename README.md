# Flash Interview ⚡

**Flash Interview** is an interactive web application designed to help users practice for interviews using a flashcard-based system. It allows for the creation, management, and traversal of a question graph, including root questions and follow-up "tail" questions.

**[👉 Go to Flash Interview](https://als7928.github.io/flash-interview/)**

---

## ✨ Features

- **Interactive Flashcards:** Practice questions on virtual flashcards with timers for both reading the question and providing an answer.
- **Question Graph Editor:**
    - Create and edit a tree of questions, including root questions and nested follow-up questions.
    - Drag-and-drop functionality to easily reorder questions and change their hierarchy.
- **Customizable Timers:** Set the card flip time and the maximum answer time to suit your practice style.
- **Multiple Order Modes:**
    - **Random:** Get a random question from your entire question set.
    - **In Order:** Go through questions sequentially, traversing the question graph in a depth-first manner.
- **Localization:** Supports multiple languages (English and Korean) with an easy-to-extend translation system.
- **Custom Themes:** Switch between Light and Dark themes, or sync with your system preference.
- **Persistent State:** All questions, settings, and theme preferences are saved locally in your browser.
- **Import/Export:** Save your question graph to a JSON file or load one from your disk.
- **Resizable Layout:** The editor panel can be resized or collapsed to focus on the interview cards.

## 🚀 How to Use

1.  **Start the Interview:** Click the **"Start / Next Question"** button to begin.
2.  **The Card Flips:** The card will show a question and automatically flip after the "Flip Time" you set. A progress bar at the top indicates the time until the flip.
3.  **Answer the Question:** Once the card flips, the answer timer starts. Answer the question before the "Max Answer Time" runs out.
4.  **Automatic Progression:** When the answer time is up, the next question card will automatically appear.
5.  **Manual Controls:**
    - Click on a card before it flips to flip it immediately.
    - Click "Start / Next Question" at any time to move to the next question.

### Editing Questions

- **Add a New Root Question:** Click the **"Add New Question"** button.
- **Add a Follow-up Question:** Click the `+` icon next to any existing question.
- **Delete a Question:** Click the `-` icon. This will delete the question and all of its children.
- **Reorder Questions:** Simply **drag and drop** any question to move it. You can drop it between questions, or onto another question to make it a child.

### Settings

- **Timers:** Adjust the `Flip Time` and `Max Answer Time` in the control panel.
- **Question Order:** Choose between `Random` and `In Order` to control how questions are presented.
- **Load/Save:** Use the **Load Settings** and **Save Settings** buttons in the editor footer to import or export your question set as a JSON file.
- **Language & Theme:** Use the dropdowns in the editor footer to change the language and theme.
- **Collapse Editor:** Click the `<` button in the editor header to collapse the panel. Click the `>` button that appears on the left to expand it again.

---
*This tool is designed to be a simple and effective way to prepare for technical and behavioral interviews.*