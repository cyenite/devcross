# Devcross - Developer Crossword Puzzle Generator

**Devcross** is a Visual Studio Code extension that generates developer-themed crossword puzzles right in your editor. It leverages the power of Google Gemini API to create engaging puzzles based on your chosen keywords. 

## Features

* **Generate crossword puzzles:** Create custom puzzles with developer-related terms.
* **Integrated webview:**  Solve the puzzles directly within VS Code.
* **Customizable keywords:** Tailor the puzzles to your desired difficulty and topics.

## Prerequisites

* **VS Code:** Devcross is a VS Code extension and requires VS Code to be installed.
* **Google Gemini API Key:**  You'll need a valid API key to access the Gemini model. You can obtain one from the [Google Cloud Console](https://makersuite.google.com/app/apikey).

## Installation

1. Open VS Code and navigate to the Extensions view.
2. Search for "Devcross" and click Install.

## Usage

1. **Start Devcross:** Once installed, you can start the extension in two ways:
    * Use the command palette: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and type ```Launch Devcross``` or ```Devcross: Start``` to launch the crossword generator.
2. **Enter API Key:** If you haven't previously saved your API key, you'll be prompted to enter it. 
3. **Generate Puzzle:** The crossword puzzle will be generated automatically of the API key is valid.
4. **Solve the Puzzle:** Use the interactive crossword grid in editor to solve the puzzle.

## How it Works

Devcross uses the Google Gemini API to generate crossword puzzles based on the keywords you provide. The extension then renders the puzzle in a webview within VS Code, allowing you to solve it interactively.

## Note

* Your API key is stored securely in VS Code's global state.
* Ensure you have an active internet connection to access the Gemini API.

## Contributing

Contributions to Devcross are welcome! Feel free to open issues or submit pull requests on the [GitHub repository](https://github.com/cyenite/devcross).

## License

This extension is licensed under the [MIT License](https://github.com/cyenite/devcross/blob/main/LICENSE.md).


<a href="https://www.buymeacoffee.com/cyenite"> <img align="left" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" height="50" width="210" alt="Buy Me A Coffee" /></a>