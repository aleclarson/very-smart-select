import { isBlock, isObjectBindingPattern, isObjectLiteralExpression, Node } from "typescript";
import { Range } from "../../api";
import { collapseWhitespace } from "../collapseWhitespace";
import { nodeToRange } from "./nodeToRange";
import { pathToPosition } from "./pathToPosition";

const nodeTypesWithBrackets = [isBlock, isObjectLiteralExpression, isObjectBindingPattern];

export function expandRange(
    range: Range,
    node: Node,
    text: string,
    opts: {
        excludeBrackets?: boolean;
        shouldExpandFurther?: (expansionNode: Node) => boolean;
    } = {}
): Range | undefined {
    const shouldExpandFurther = opts.shouldExpandFurther || (() => false);
    const path = pathToPosition(node, range.start, range.end);
    let expansionNode: Node | undefined;
    let expansionRange: Range | undefined;
    for (let i = path.length - 1; i >= 0; i--) {
        const candidate = path[i];
        const candidateRange = nodeToRange(candidate);
        if (candidateRange === undefined) {
            continue;
        }
        if (shouldExpandFurther(candidate)) {
            continue;
        }
        const outRange = collapseWhitespace(text, candidateRange);
        if (
            (outRange.start < range.start && outRange.end >= range.end) ||
            (outRange.end > range.end && outRange.start <= range.start)
        ) {
            expansionNode = candidate;
            expansionRange = candidateRange;
            break;
        }
    }
    if (expansionNode === undefined || expansionRange === undefined) {
        return undefined;
    }
    const outRange = collapseWhitespace(text, expansionRange);
    if (opts.excludeBrackets) {
        const expansionNodeSelected: Node = expansionNode;
        if (nodeTypesWithBrackets.some(isType => isType(expansionNodeSelected))) {
            const alreadyInBrackets =
                outRange.start + 1 === range.start && outRange.end - 1 === range.end;
            // if we are already inside the bracket selection then expand to include them
            if (!alreadyInBrackets) {
                outRange.start++;
                outRange.end--;
            }
        }
    }
    return outRange;
}
