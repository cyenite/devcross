import * as vscode from 'vscode';

export class LeaderboardViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'devcross.leaderboardView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    /**
     * Builds the HTML content for the leaderboard webview.
     * @param webview - The webview to generate the HTML for.
     * @returns - The HTML content for the webview.
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const leaderboardData = JSON.stringify(this._getDummyLeaderboardData());

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
				<h2> Devcross Leaderboard</h2>
				<div id="leaderboard"></div>
				<script>
					const leaderboardData = ${leaderboardData};

					function populateLeaderboard() {
						const leaderboardContainer = document.getElementById('leaderboard');
						leaderboardContainer.innerHTML = '';
						leaderboardData.forEach((entry, index) => {
							const entryDiv = document.createElement('div');
							entryDiv.className = 'leaderboard-entry';
							entryDiv.innerHTML = \`
								<span class="rank">\${index + 1}.</span>
								<span class="username"> \${entry.username}</span>
								<span class="score">\${entry.score} pts</span>
							\`;
							leaderboardContainer.appendChild(entryDiv);
						});
					}

					populateLeaderboard();
				</script>
			</body>
			</html>`;
    }


    /**
     * Generates dummy leaderboard data.
     */
    private _getDummyLeaderboardData() {
        // TODO(Ron): Implement API to fetch real leaderboard data
        return [
            { username: 'Jane', score: 100 },
            { username: 'MarkTk', score: 90 },
            { username: 'Sfogli', score: 80 },
            { username: 'Mwaura', score: 70 },
            { username: 'Rono', score: 60 },
        ];
    }
}
