import * as vscode from 'vscode';

export class LeaderboardViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'devcross.leaderboardView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.command === 'startGame') {
                await vscode.commands.executeCommand('devcross.start');
            }
        });
    }

    /**
     * Builds the HTML content for the leaderboard webview.
     * @param webview - The webview to generate the HTML for.
     * @returns - The HTML content for the webview.
     */
    private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const authSession = await vscode.authentication.getSession('github', ['user:email']);
        const githubUsername = authSession?.account.label || 'Guest';

        const leaderboardData = JSON.stringify(this._getDummyLeaderboardData(githubUsername));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media/style', 'style_leaderboard.css'));

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Leaderboard</title>
            <link href="${styleUri}" rel="stylesheet" />
        </head>
        <body>
            <h2>Devcross Leaderboard</h2>

            <button id="play-button">🎮 Play Now</button>

            <div id="leaderboard"></div>
            
            <script>
                // Acquire the VS Code API for communication
                const vscode = acquireVsCodeApi();

                const leaderboardData = ${leaderboardData};
                const githubUsername = "${githubUsername}";

                // Function to populate leaderboard
                function populateLeaderboard() {
                    const leaderboardContainer = document.getElementById('leaderboard');
                    leaderboardContainer.innerHTML = '';
                    leaderboardData.forEach((entry, index) => {
                        const entryDiv = document.createElement('div');
                        entryDiv.className = 'leaderboard-entry';

                        let displayUsername = entry.username;

                        if (entry.username === githubUsername) {
                            entryDiv.classList.add('current-user');
                            displayUsername += ' (you)';
                        }

                        entryDiv.innerHTML = \`
                            <span class="rank" > \${ index + 1 }. </span>
                            <span class="username" > \${ displayUsername } </span>
                            <span class="score" > \${ entry.score } pts </span>
                        \`;
                        leaderboardContainer.appendChild(entryDiv);
                    });
                }


                populateLeaderboard();

                // Play button event listener
                document.getElementById('play-button').addEventListener('click', () => {
                    // Send a message to the VS Code extension
                    vscode.postMessage({ command: 'startGame' });
                });
            </script>
        </body>
        </html>`;
    }


    /**
     * Generates dummy leaderboard data.
     */
    private _getDummyLeaderboardData(loggedInUser: string): { username: string, score: number }[] {
        // TODO(Ron): Implement API to fetch real leaderboard data
        return [
            { username: 'AI', score: 100 },
            { username: 'informix', score: 80 },
            { username: loggedInUser, score: 0 },
        ];
    }
}
