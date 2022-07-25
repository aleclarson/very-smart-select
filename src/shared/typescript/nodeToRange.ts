import { isTemplateSpan, Node, SyntaxKind } from "typescript";
import { Range } from "../../api";

export function nodeToRange(node: Node): Range | undefined {
    let ds = 0;
    let de = 0;
    if (node.kind === SyntaxKind.TemplateHead) {
        ds = 2;
        de = -2;
    }
    if (node.kind === SyntaxKind.TemplateTail) {
        ds = 1;
        de = -1;
    }
    if (node.kind === SyntaxKind.TemplateMiddle) {
        ds = 1;
        de = -2;
    }
    if (isTemplateSpan(node)) {
        ds = -2;
        de = -node.literal.getFullWidth() + 1;
    }
    return {
        start: node.getFullStart() + ds,
        end: node.getEnd() + de
    };
}
