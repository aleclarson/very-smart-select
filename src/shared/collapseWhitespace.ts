import { Range } from "../api";

const WHITESPACE = /\s/;

export function collapseWhitespace(source: string, range: Range): Range {
    let i = range.start;
    let leftRemove = 0;
    while (i < source.length && WHITESPACE.test(source.charAt(i))) {
        i++;
        leftRemove++;
    }
    let j = range.end - 1;
    let rightRemove = 0;
    while (j >= 0 && WHITESPACE.test(source.charAt(j))) {
        j--;
        rightRemove++;
    }
    return {
        start: range.start + leftRemove,
        end: range.end - rightRemove
    };
}
