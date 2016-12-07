# ts-depDraw
Visualisation of typescript project dependencies.


The idea of this project is to create a dependency graph of your project.






# TODO

- Experiment with how to display the data collected.
    - Maybe with a stack?
- Get rid of duplicate reference
    - And tick isDefinition, and fill in end of definition using define.

- Write some server tests.
- Write more tsServer tests.




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

Storage of the memory.

```
Hash table [**filepath**] -> {  tokenData[] (ordered) ,
                                Segment tree of the isDefinition scopes -> token data }
```


Range tree can be used because it can be traversed inorder to generate the display.


## Token data

tokenText: string

tokenType: string

isDefinition: bool

start: {line: number, offset: number}

end?: {line: number, offset: number}

