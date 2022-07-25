import { SelectionStrategy, Range } from "../api";
import { TextEditor } from "vscode";
import { expandRange } from "../shared/typescript/expandRange";
import { createSourceFile, ScriptTarget } from "typescript";

export class TypescriptStrategy implements SelectionStrategy {
    grow(editor: TextEditor, excludeBrackets: boolean): Range[] {
        const doc = editor.document;
        const startRanges = editor.selections.map(selection => ({
            start: doc.offsetAt(selection.start),
            end: doc.offsetAt(selection.end)
        }));
        const text = doc.getText();
        const node = createSourceFile(doc.fileName, text, ScriptTarget.Latest);
        const outRanges = startRanges
            .map(range => expandRange(range, node, text, { excludeBrackets }))
            .filter(Boolean) as Range[];
        return outRanges;
    }
}
