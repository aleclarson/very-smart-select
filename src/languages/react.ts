import { TypescriptStrategy } from "./typescript";
import { TextEditor } from "vscode";
import { createSourceFile, ScriptTarget, SyntaxKind } from "typescript";
import { expandRange } from "../shared/typescript/expandRange";
import { Range } from "../api";

export class ReactStrategy extends TypescriptStrategy {
    wrapJsxElement(editor: TextEditor) {
        const doc = editor.document;
        const startRanges = editor.selections.map(selection => ({
            start: doc.offsetAt(selection.start),
            end: doc.offsetAt(selection.end)
        }));
        const text = doc.getText();
        const node = createSourceFile(doc.fileName, text, ScriptTarget.Latest);
        const outRanges = startRanges
            .map(range =>
                expandRange(range, node, text, {
                    excludeBrackets: true,
                    shouldExpandFurther(node) {
                        return (
                            node.kind !== SyntaxKind.JsxElement &&
                            node.kind !== SyntaxKind.JsxSelfClosingElement &&
                            node.kind !== SyntaxKind.JsxFragment
                        );
                    }
                })
            )
            .filter(Boolean) as Range[];
        return outRanges;
    }
}
