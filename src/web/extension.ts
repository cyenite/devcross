import * as vscode from 'vscode';
import { LeaderboardViewProvider } from './leaderboard_provider';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('devcross.start', () => handleStartCommand(context));
	context.subscriptions.push(disposable);

	const leaderboardProvider = new LeaderboardViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(LeaderboardViewProvider.viewType, leaderboardProvider)
	);
}

/**
 * Handles the command to start the crossword generator.
 * 
 * @param context The extension context
 */
async function handleStartCommand(context: vscode.ExtensionContext) {

	const githubSession = await authenticateWithGitHub();
	var githubUsername = githubSession?.account.label || '--';

	let apiKey = await getApiKey(context);
	if (!apiKey) return;

	const panel = createWebviewPanel();
	panel.webview.html = generateWebviewContent(panel, context, apiKey, githubUsername);
}

/**
 * Retrieves the stored API key or prompts the user to input it.
 * 
 * @param context The extension context
 * @returns The API key, or null if the user cancels input.
 */
async function getApiKey(context: vscode.ExtensionContext): Promise<string | null> {
	let apiKey = context.globalState.get<string>('crosswordApiKey');

	const storedApiKeyValid = apiKey != null ? await verifyApiKey(apiKey) : false;

	if (!storedApiKeyValid || !apiKey) {
		apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your Gemini API Key for crossword generation',
			placeHolder: 'API Key',
			ignoreFocusOut: true,
			password: true
		});

		if (!apiKey) {
			vscode.window.showErrorMessage('Gemini API key is required to use this extension.');
			return null;
		}

		const apiKeyValid = await verifyApiKey(apiKey);

		if (!apiKeyValid) {
			return null;
		}

		await context.globalState.update('crosswordApiKey', apiKey);
		vscode.window.showInformationMessage('API key saved successfully.');
	}

	return apiKey;
}


/**
 * Verifies the given API key.
 * 
 * @param apiKey The API key to verify
 * @returns True if the API key is valid, false otherwise.
 */
async function verifyApiKey(apiKey: string): Promise<boolean> {
	try {
		const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
			method: 'GET',
		});

		if (response.status === 200) {
			return true;
		} else {
			console.error('API Key verification failed with status:', response.status);
			vscode.window.showErrorMessage('Invalid API key. Please enter a valid Gemini API key.');
			return false;
		}
	} catch (error) {
		console.error('Error verifying API key:', error);
		vscode.window.showErrorMessage('An error occurred while verifying the API key.');
		return false;
	}
}


/**
 * Authenticates with GitHub. The resultant session info can be used to populate and update the user's position in the leaderboard.
 * 
 * @returns The authentication session, or undefined if authentication fails.
 */
async function authenticateWithGitHub(): Promise<vscode.AuthenticationSession | undefined> {
	try {
		const session = await vscode.authentication.getSession('github', ['user:email'], { createIfNone: true });
		return session;
	} catch (error) {
		vscode.window.showErrorMessage('Authentication with GitHub failed.');
		console.error('GitHub authentication error:', error);
		return undefined;
	}
}



/**
 * Creates a new webview panel for the crossword puzzle.
 * 
 * @returns The created webview panel.
 */
function createWebviewPanel(): vscode.WebviewPanel {
	return vscode.window.createWebviewPanel(
		'devcross',
		'Devcross',
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);
}

/**
 * Provider for the sidebar webview.
 */
class CrosswordViewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly context: vscode.ExtensionContext) { }

	async resolveWebviewView(webviewView: vscode.WebviewView) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.context.extensionUri]
		};

		const panel = createWebviewPanel();

		const githubSession = await authenticateWithGitHub();
		var githubUsername = githubSession?.account.label || '--';

		let apiKey = await getApiKey(this.context);

		if (!apiKey) {
			return;
		}

		webviewView.webview.html = generateWebviewContent(panel, this.context, apiKey, githubUsername);
	}
}

/**
 * Generates the HTML content for the crossword webview.
 * 
 * @param panel The webview panel
 * @param context The extension context
 * @param apiKey The stored API key
 * @returns The HTML content as a string.
 */
function generateWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, apiKey: string, githubUsername: string): string {
	const getUri = (fileName: string) =>
		panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', fileName));

	const crosswordScriptUri = getUri('jquery.crossword.js');
	const customScriptUri = getUri('script.js');
	const styleUri = getUri('style.css');
	const jqueryUri = getUri('jquery-1.6.2.min.js');
	const loaderUri = getUri('loading.gif');

	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Crossword Puzzle</title>
			<link href="${styleUri}" rel="stylesheet" />
			<meta http-equiv="Content-Security-Policy" content="
				default-src 'none';
				img-src ${panel.webview.cspSource};
				style-src ${panel.webview.cspSource} 'unsafe-inline';
				script-src ${panel.webview.cspSource};
				connect-src https://generativelanguage.googleapis.com;
				vscode-resource: https:;
			">
		</head>
		<body data-api-key="${apiKey}" data-github-username="${githubUsername}">
		 	<div id="user-info">
                Logged in as: <strong>${githubUsername}</strong>
            </div>
			<div id="loader" style="display: none;">
				<img src="${loaderUri}" alt="Loading..." />
			</div>
			<div id="puzzle-wrapper"></div>
			<script src="${jqueryUri}"></script>
			<script src="${crosswordScriptUri}"></script>
			<script type="module" src="${customScriptUri}"></script>
		</body>
		</html>`;
}

export function deactivate() { }
