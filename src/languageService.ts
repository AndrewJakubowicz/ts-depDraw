/**
 * Author: Andrew Jakubowicz
 */

import * as ts from 'typescript';
import * as winston from './appLogger';
import * as fs from 'fs';
import * as path from 'path';

// takes relative filePath from root
function createLanguageServiceOnFile(relFilePath: string){
    const rootPath = process.cwd();
    const filePath = path.join(process.cwd(), relFilePath);
    

    let rootFileNames: string[] = [filePath];
    const files: ts.Map<{ version: number }> = {};

    rootFileNames.forEach(fileName => {
        files[fileName] = { version: 0 };
    });

    let configJSON = JSON.parse(fs.readFileSync('tsconfig.json').toString());


    // Options should be gained using ts.convertCompilerOptionsFromJson
    // let options = { module: ts.ModuleKind.CommonJS };
    let {options, errors} = ts.convertCompilerOptionsFromJson(configJSON["compilerOptions"], process.cwd());

    winston.log('trace', 'convertCompilerOptionsFromJson:', options);
    winston.log('trace', 'convertCompilerOptionsFromJson ERRORS:', errors);

    const servicesHost: ts.LanguageServiceHost = {
        getScriptFileNames: () => rootFileNames,
        getScriptVersion: (fileName) => files[fileName] && files[fileName].version.toString(),
        getScriptSnapshot: (fileName) => {
            if (!fs.existsSync(fileName)) {
                return undefined;
            }
            return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
        },
        getCurrentDirectory: () => process.cwd(),
        getCompilationSettings: () => options,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    }

    const languageServiceHost = ts.createLanguageService(servicesHost);
    return languageServiceHost;
}

/**
 * TODO: I may reactivate this in the future for speed. These are much faster than tsserver.
 */


export function navTreeOnFile(relFilePath){
    return createLanguageServiceOnFile(relFilePath).getNavigationTree(relFilePath);
}

// export function semanticClassifications(relFilePath, startLineAndOffset, endLineAndOffset){
//     const {start, length} = getLengthOfSpan(relFilePath, startLineAndOffset, endLineAndOffset);
//     return createLanguageServiceOnFile(relFilePath).getEncodedSyntacticClassifications(relFilePath, {start, length});
// }

// export function getLengthOfSpan(relFilePath, start, end){
//     const sourceFile = ts.createSourceFile(path.basename(relFilePath), fs.readFileSync(relFilePath).toString(), ts.ScriptTarget.Latest);
//     winston.log('trace', 'sourceFile:', sourceFile);
//     const startPos = ts.getPositionOfLineAndCharacter(sourceFile, start.line, start.offset);
//     const endPos = ts.getPositionOfLineAndCharacter(sourceFile, end.line, end.offset);
//     return {start: startPos, length: endPos - startPos};
// }


