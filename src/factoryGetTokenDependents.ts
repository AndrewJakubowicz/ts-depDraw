

const factoryGetTokenDependents = ({tssServer,
                                    winston,
                                    relative_path,
                                    scanFileForIdentifierTokens,
                                    extractTokensFromFile}) =>
                                    (filePath, line, offset) =>
    new Promise((resolve, reject) => {
    
    const traverseNavTreeToken = factoryTraverseNavTreeToken({winston, relative_path})

    tssServer.open(filePath)
        .then( _ => { winston.log('trace', 'opened:', filePath)})
        .then(_ => tssServer.references(filePath, line, offset))
        .then(respObj => {
            if (!(respObj.success)){
                throw new Error("Error: Can't get references.");
            }
            return respObj;
        })
        .then(refObj => {
            winston.log('trace', `referenceObject: `, refObj);
            const references = refObj.body.refs;
            return (references as any[]).filter( refToken => !refToken.isDefinition );
        })
        .then(filteredList => {
            // UNIQUE FILE PATHS WERE FAILING BECAUSE LATER WE REQUIRE A 1 to 1 LINK.

            // winston.log('trace', `filtered referenceObject: `, filteredList);
            // let filePaths: Set<string> = new Set(); // Sets are iterated over in insertion order.
            // let relativePath: string;

            // (filteredList as any[]).forEach(token => {
            //     relativePath = relative_path(global.tsconfigRootDir, token.file);
            //     filePaths.has(relativePath) || filePaths.add(relativePath);
            // });

            let navtreePromises = [];
            filteredList.forEach(({file}) => {
                tssServer.open(file)
                    .catch(err => {throw new Error("Opening relative file path failed")})
                
                navtreePromises.push(tssServer.navtree(file))
            });
            // This promise is all the unique navtrees.
            return Promise.all([...navtreePromises, filteredList]);
        })
        .then(navTreeResponse => {
            winston.log('trace', `Response to navtree:`, navTreeResponse);
            let references = (navTreeResponse as any[]).slice(-1)[0];
            let navTrees = navTreeResponse.slice(0, -1);

            let scopesAffectedByReference = [];
            winston.log('trace', `reflength and navTrees length`, references.length, navTrees.length);
            if (references.length !== navTrees.length){
                winston.log('warn', `Losing data because lengths aren't equal! ${references.length} !== ${navTrees.length}`);
            }
            references.forEach((tokenRef, i) => {

                winston.log('trace', `Dispatching traverseNavTreeToken on `, navTrees[i].body, `and token reference`, tokenRef);
                let _tempDependents = traverseNavTreeToken(navTrees[i].body, tokenRef);
                winston.log('trace', '_tempDependents:', _tempDependents, 'for token:', tokenRef);
                scopesAffectedByReference.push(..._tempDependents);
            });
            winston.log('trace', `scopesAffectedByReference after forEach:`, scopesAffectedByReference)
            return scopesAffectedByReference
        })
        .then(scopesAffectedByReference => {

            // Find the reference identifier.
            const newTokens = (scopesAffectedByReference as any).map(token => {
                // Huge overhead here, find first identifier token of the scope given.
                // We need to add exceptions (like modules, and maybe more?...)
                if (token.kind === "script"){
                    return {
                        ...token,
                        displayString: token.file
                    }
                }
                return scanFileForIdentifierTokens(token.file)
                    .then(allFileTokens => {
                        const filteredTokens = extractTokensFromFile(allFileTokens, token.spans.start, token.spans.end)
                        for (let _token of filteredTokens){
                            if (_token.type === 'Identifier') {
                                return tssServer.quickinfo(token.file, _token.start.line, _token.start.character)
                                    .then(quickInfoResponse => {
                                        let responseObj = quickInfoResponse.body;
                                        responseObj.file = token.file;
                                        switch (token.kind){
                                            case 'module':
                                                responseObj.kind = token.kind;
                                                responseObj.displayString = token.text;
                                        }
                                        return responseObj
                                    });
                            }
                        }
                    })
                    .catch(err => { throw new Error(`Error in scanFileForIdentifierTokens promise chain: ${err}`)})
            })
            return Promise.all(newTokens);
        },
        err => {
            winston.log('error', `Error traversing nav tree: ${err}`)
            reject(`Error traversing nav tree: ${err}`);
        })
        .then(dependentsList => {
            /**
             * Here we want to scrape out the duplicates.
             * This is done by hashing each token with a minimalistic hash,
             * and then removing any duplicates.
             */

            /**
             * Use to get a unique string for each node.
             */
            const hashNodeToString = node =>
                Object.keys(node).map(key => {
                    switch(key){
                        case "start":
                        case "end":
                            return hashNodeToString(node[key])
                        case "file":
                        case "line":
                        case "offset":
                            return String(node[key])
                        default:
                            return "";
                    }
                }).filter(v => v.length !== 0).join("|");
            
            let hashSet = new Set();
            let filteredList = dependentsList.filter(token => {
                return !hashSet.has(hashNodeToString(token)) && hashSet.add(hashNodeToString(token))
            });
            return filteredList;
        })
        .then(JSON.stringify)
        .then(resolve)
        .catch(err => {reject(`Error in GetTokenDependents: ${err}`)});
    })


/**
 * Helper function for traversing the navTree
 */
function factoryTraverseNavTreeToken({winston, relative_path}) {
    return function traverseNavTreeToken (navTreeToken, refToken, results = []): any[]{
    if (!tokenInRange({winston}, navTreeToken.spans[0].start,navTreeToken.spans[0].end, refToken.start)){
        winston.log('trace', `inside tokenInRange, returning empty`);
        return []
    }
    let leafToken = {text: navTreeToken.text,
                    kind: navTreeToken.kind,
                    kindModifiers: navTreeToken.kindModifiers,
                    spans: navTreeToken.spans,
                    file: relative_path(global.tsconfigRootDir, refToken.file)
                }

    if (leafToken.spans.length !== 1){
        winston.log('warn', 'Spans is not == 1, Info lost!', leafToken);
    }
    leafToken.spans = leafToken.spans[0];
    winston.log('trace', `Created childItemScope: `, leafToken, results);
    if (!navTreeToken.childItems){
        return [leafToken];
    } else {
        results.push(leafToken);
    }
    navTreeToken.childItems.forEach(token => {
        results.push(...traverseNavTreeToken(token, refToken, []))
    });
    winston.log('trace', `Results array: `, results);
    return results
}
}

/**
 * tokenInRange returns boolean representing if token is within scope.
 */
function tokenInRange({winston}, start, end, tokenStart){
    winston.log('trace', `tokenInRange`, start.line <= tokenStart && end.line >= tokenStart, start, tokenStart)
    return     (start.line === tokenStart.line && start.offset < tokenStart.offset)
            || (end.line === tokenStart.line && end.offset > tokenStart.offset)
            || (start.line < tokenStart.line && end.line > tokenStart.line)
}

export default factoryGetTokenDependents;


