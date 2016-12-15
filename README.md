# ts-depDraw


** THIS PRODUCT IS BARELY FUNCTIONAL IN ITS CURRENT STATE **

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


## Client

### Find dependencies

- "click" on highlighted token
- check if it is the definition
- skim reference of that token for isDefinition: true
- go to that filePath for definition
- grab the ordered tokens
- run the start and end (binary search) over the ordered list and grab the tokens.

> Original idea to have a range tree is stupid overhead.
> We don't need a range tree because we can just binary search start and end. (It's already in order)

## Find dependents

- "click" on highlighted token
- Go through all the references (excluding the isDefinition).




# Think more about how much in memory is needed.

~~Storage of the memory.~~

```
Hash table [**filepath**] -> {  tokenData[] (ordered) ,
                                Segment tree of the isDefinition scopes -> token data }
```

This is irrelevant now. We can lazily generate scopes using **navtree** on the file.


## Token data

tokenText: string

tokenType: string

isDefinition: bool

start: {line: number, offset: number}

end?: {line: number, offset: number}

references: []


# Optimisation thoughts

- ~~When scanning the file for tokens, we wait for all the data before cleaning the data.~~
- ~~This could be sped up by simply doing both steps in 1 loop through the data.~~
- Optimised to lazily look everything up.


# Task list

 - [x] Get text from file.
 - [x] Get token information from file.
 - [ ] Get dependencies for a token.
 - [ ] Get dependents for a token.
 - [ ] Create frontend repo.
 - [ ] Use opn to open browser.