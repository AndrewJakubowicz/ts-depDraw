/**
 * 
 * Finds definition of token, and then filters the tokens from the definition filePath
 * to only include the tokens which are Indentifiers and within the start and end range.
 * 
 * QuickInfo is then called on the dependencies found to get their info and an array is sent.
 * 
 */
const factoryGetTokenDependencies = ({tssServer, winston, relative_path, scanFileForIdentifierTokens, extractTokensFromFile}) =>
                                    (filePath, line, offset) =>
    new Promise((resolve, reject) => {
    tssServer.open(filePath)
        .then(_ => {winston.log('trace', 'successfully opened file')})
        .then(_ => tssServer.definition(filePath, line, offset))
        .then(respObj => {
            if (!respObj.success){
                throw new Error("Failed to define token");
            }
            return respObj
        })
        .then(resp => {
            const definitionToken = resp,
                  definitionFilePath = resp.body[0].file;
            
            return scanFileForIdentifierTokens(relative_path(global.tsconfigRootDir, definitionFilePath))
                .then(allFileTokens => {
                    winston.log('trace', `Slicing dependencies using`, definitionToken, allFileTokens);

                    return extractTokensFromFile(allFileTokens,
                                        definitionToken.body[0].start,
                                        definitionToken.body[0].end);
                })
                .then(selectTokens => selectTokens.filter( token => token.type === 'Identifier' ),
                    err => {throw new Error("Error extracting tokens")})
                .then(selectTokens => {
                    winston.log('trace', 'filtered tokens:', selectTokens);
                    return selectTokens;
                },
                 err => {throw new Error("Error filtering tokens")})
                .then(identifierTokens => {
                    let quickInfoList = [];
                    (identifierTokens as any[]).forEach(token => {
                        quickInfoList.push(tssServer.quickinfo(definitionFilePath, token.start.line, token.start.character));
                    });
                    return Promise.all(quickInfoList);
                })
                .then(definitionList => {
                    winston.log('trace', 'DEFINITION LIST', definitionList);
                    const trimmedArgs = definitionList.map(v => v.body);
                    trimmedArgs.forEach(v => { v['file'] =  relative_path(global.tsconfigRootDir, definitionFilePath) });
                    return trimmedArgs;
                })
                .catch(err => {throw new Error("Error in scanFileForIdentifierTokens promise chain: " + err.message)})
        })
        .then(JSON.stringify)
        .then(resolve)  
        .catch(err => {
            return reject(err);
        });
    })


export default factoryGetTokenDependencies;