# ts-depDraw


Install with `npm install ts-depDraw -D`.

Usage:

```
    Usage: ts-depDraw <file path>

    Current limitations:
        - Requires you to initialize the program from the
          directory containing tsconfig.json.

    Options:

    -h, --help           output help
```




Visualisation of typescript project dependencies.


The idea of this project is to create a dependency graph of your project.




## Token data

tokenText: string

tokenType: string

isDefinition: bool

start: {line: number, offset: number}

end?: {line: number, offset: number}

references: []


# Task list

 - [x] Get text from file.
 - [x] Get token information from file.
 - [x] Get rough dependencies for a token.
 - [x] Get rough dependents for a token.
 - [x] Create frontend repo.
 - [ ] Use opn to open browser.
 - [ ] Fix tests so that things are legit.
 - [x] Share/[Save/Load] diagram
 - [ ] Able to add text nodes
 - [x] Fix edge between the same node.
 - [x] All edges added between nodes


 # Known Bugs

 - [ ] Dependencies are anything in scope. Regardless if they are actual dependencies.
 - [ ] If a function is represented in a single line, a scope tree doesn't form properly.
 - [x] Function declaration headers are listed as dependencies.
 - [x] Duplicated dependents for some tokens.
 - [x] tsserver chunks responses which can break JSON parse.
 - [ ] Template literal strings don't tokenize properly.
 - [x] ex5.ts line 1, offset 13 - causes error
