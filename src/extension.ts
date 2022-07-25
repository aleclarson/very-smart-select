import { window, ExtensionContext, commands, Selection, Disposable, workspace } from "vscode";
import { SelectionStrategy } from "./api";
import { TypescriptStrategy } from "./languages/typescript";
import { ReactStrategy } from "./languages/react";

export function activate(context: ExtensionContext) {
    const verySmartSelect = new VerySmartSelect();
    context.subscriptions.push(verySmartSelect);

    const growCommand = commands.registerCommand("very-smart-select.grow", () => {
        verySmartSelect.grow();
    });
    const shrinkCommand = commands.registerCommand("very-smart-select.shrink", () => {
        verySmartSelect.shrink();
    });
    const jsxCommand = commands.registerCommand("very-smart-select.wrap-jsx-element", () => {
        verySmartSelect.wrapJsxElement();
    });

    context.subscriptions.push(growCommand);
    context.subscriptions.push(shrinkCommand);
    context.subscriptions.push(jsxCommand);
}

export function deactivate() {}

function areSelectionsEqual(selections: Selection[], otherSelections: Selection[]): boolean {
    return (
        selections.length === otherSelections.length &&
        selections.every((selection, index) => selection.isEqual(otherSelections[index]))
    );
}

class VerySmartSelect {
    private strategies: { [key: string]: SelectionStrategy | undefined } = {};

    private selectionsHistory: Selection[][] = [];
    private windowSelectionListener: Disposable;
    private didUpdateSelections: boolean = false;
    private excludeBrackets: boolean = false;

    constructor() {
        this.strategies["typescript"] = new TypescriptStrategy();
        this.strategies["typescriptreact"] = new ReactStrategy();
        this.strategies["javascript"] = new TypescriptStrategy();
        this.strategies["javascriptreact"] = new ReactStrategy();
        this.strategies["json"] = new TypescriptStrategy();
        this.strategies["jsonc"] = new TypescriptStrategy();

        this.excludeBrackets = workspace.getConfiguration("very-smart-select").excludeBrackets;

        this.windowSelectionListener = window.onDidChangeTextEditorSelection(e => {
            if (this.didUpdateSelections) {
                this.didUpdateSelections = false;
            } else {
                this.selectionsHistory = [];
            }
        });
    }

    public grow() {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
        const doc = editor.document;
        const strategy = this.strategies[doc.languageId];
        if (strategy === undefined) {
            commands.executeCommand("editor.action.smartSelect.grow");
            return;
        }
        const ranges = strategy.grow(editor, this.excludeBrackets);
        const selections = ranges.map(
            range => new Selection(doc.positionAt(range.start), doc.positionAt(range.end))
        );
        this.updateSelectionsHistory(editor.selections);
        this.updateSelections(selections);
    }

    public shrink() {
        const selections = this.selectionsHistory.pop();
        if (selections) {
            this.updateSelections(selections);
        } else {
            commands.executeCommand("editor.action.smartSelect.shrink");
        }
    }

    public wrapJsxElement(): void {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }
        const doc = editor.document;
        const strategy = this.strategies[doc.languageId];
        if (strategy?.wrapJsxElement) {
            const ranges = strategy.wrapJsxElement(editor);
            const selections = ranges.map(
                range => new Selection(doc.positionAt(range.start), doc.positionAt(range.end))
            );
            this.updateSelectionsHistory(editor.selections);
            this.updateSelections(selections);
        }
    }

    public dispose() {
        this.windowSelectionListener.dispose();
    }

    private updateSelections(selections: Selection[]) {
        const editor = window.activeTextEditor;
        if (editor && selections.length > 0) {
            this.didUpdateSelections = true;
            editor.selections = selections;
        }
    }

    private updateSelectionsHistory(selections: Selection[]) {
        const lastSelections =
            this.selectionsHistory.length > 0
                ? this.selectionsHistory[this.selectionsHistory.length - 1]
                : undefined;
        if (lastSelections === undefined || !areSelectionsEqual(lastSelections, selections)) {
            this.selectionsHistory.push([...selections]);
        }
    }
}
