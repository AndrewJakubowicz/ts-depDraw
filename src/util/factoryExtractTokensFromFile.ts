/**
 * Helper function that ~~binary~~ searches a file list.
 */
const factoryExtractTokensFromFile = ({winston}) =>
                    (fileTokenList, start, end) => {
    winston.log('trace', `extractTokensFromFile called with`, fileTokenList, start, end);

    // TODO: optimise with binary search.
    return fileTokenList.filter(token => {
        return tokenInRange(start, end, token.start)
    });
}

/**
 * tokenInRange returns boolean representing if token is within scope.
 */
function tokenInRange(start, end, tokenStart){
    return     (start.line === tokenStart.line && start.offset >= tokenStart.character)
            || (end.line === tokenStart.line && end.offset <= tokenStart.character)
            || (start.line < tokenStart.line && end.line > tokenStart.line)
}

export default factoryExtractTokensFromFile;