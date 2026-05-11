import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'blocknote-editor.markdownEditor',
      new MarkdownEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'),
      ],
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Track whether a change originated from the webview to prevent echo loop
    let isWebviewSaving = false;

    const sendContent = () => {
      webviewPanel.webview.postMessage({
        type: 'update',
        content: document.getText(),
      });
    };

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'ready') {
        // Webview signals it's mounted and listening — safe to send content now
        sendContent();
      } else if (message.type === 'save') {
        isWebviewSaving = true;
        try {
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(document.lineCount, 0)
          );
          edit.replace(document.uri, fullRange, message.content);
          await vscode.workspace.applyEdit(edit);
        } finally {
          isWebviewSaving = false;
        }
      }
    });

    // Only forward external changes — not ones we just applied from the webview
    const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (
        e.document.uri.toString() === document.uri.toString() &&
        !isWebviewSaving
      ) {
        sendContent();
      }
    });

    // Re-send content when panel regains focus (e.g. after tab switch)
    const viewStateSubscription = webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.visible) {
        sendContent();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose();
      viewStateSubscription.dispose();
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'webview.js')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource} data:; img-src ${webview.cspSource} data: blob:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BlockNote Editor</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #ffffff; color: #000000; }
    #root { height: 100vh; overflow-y: auto; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function deactivate() {}
