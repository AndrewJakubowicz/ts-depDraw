/**
 * Author: Andrew Jakubowicz
 */

import * as ts from 'typescript';
import * as winston from './appLogger';
import * as fs from 'fs';
import * as path from 'path';

// TODO: Need a good way to collect fileNames.
// takes relative filePath from root
export function navTreeOnFile(relFilePath: string){
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

    return languageServiceHost.getNavigationTree(filePath);
}


