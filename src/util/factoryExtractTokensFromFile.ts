/**
 * Helper function that ~~binary~~ searches a file list.
 */
const factoryExtractTokensFromFile = ({winston}) =>
                    (fileTokenList, start, end) => {
    winston.log('trace', `extractTokensFromFile called with`, fileTokenList, start, end);


    // TODO: optimise with binary search.
    return fileTokenList.filter(token => {
        if (token.start.line === start.line) {
            return token.start.character > start.offset
        }
        if (token.start.line === end.line) {
            return token.start.character < end.offset
        }
        return (token.start.line >= start.line && token.start.line <= end.line)
    });
}

export default factoryExtractTokensFromFile;