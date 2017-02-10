# ts-depDraw

# Aim

Prototype a novel way to interact and explore your projects dependencies.

# Introduction

Typescript was chosen as the language due to the language services that they provide.
Due to the opt-in nature of Typescript, dependencies / dependents may be missed if the compiler doesn't recognise them.

The dynamic nature of JavaScript makes discovering some dependency cases very difficult (when looking at token by token cases).
This is further compounded by what can be discovered using the Typescript language services.

However the scope of the project isn't to work out the best way to draw these dependencies,
but also a novel way to explore your project using the dragonfly view.
The Dragonfly view allows you to traverse your dependencies while keeping a history of your path.
If you want to further visualise your path, it is then drawn into a network view, where
all the tokens are checked for dependencies between one another.

This helps reveal any hidden dependencies that you might not have seen.

Finally if there is an issue or something that you want to highlight,
the diagram is savable and thus shared with others (__without needing to share your project files__).



# Installation


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
