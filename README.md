# ts-depDraw

![Catching a hidden dependency!](http://i.imgur.com/QomKSln.gif)

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


Install with `npm install -g ts-depdraw`.
![using npm to install ts-depdraw](http://i.imgur.com/MJX7N1a.gif)


# Start Server:

```
    Usage: ts-depDraw <file path>

    Current limitations:
        - Requires you to initialize the program from the
          directory containing tsconfig.json.

    Options:

    -h, --help           output help
```



This will start the server that traverses your project.

## Example initiation:

If you have a project with the structure:

```
.
├── src
│   └── app.ts
└── tsconfig.json
```

You must start the server from the folder with the `tsconfig.json`
and with the filepath of a `.ts` file.

In this case we'll start the server on `app.ts`.

`ts-depDraw src/app.ts`


# Exploring your code

Let's explore a simple single file example (multiple files are supported).

Continuing on from the above example, imagine `app.ts` has the following code:

```
function A(){
    return "Hello";
}

function B(){
    return A() + "World!"
}
```

When the server starts it will open the browser to `http://localhost:8080/` and you'll be greeted by the following screen:

![Welcome screen](http://i.imgur.com/4ifDG4v.png)

If you've got a saved diagram, you can load it, otherwise just press __continue__.

## UI

![Blank UI](http://i.imgur.com/m6z1At4.png)

Notice your code appears at the bottom.
The blank space is where the diagram will be created.

As you explore, additional files may be traversed and they'll be added next to the current one (`src/app.ts`).

In this case we want to check what dependencies function `B` has.

![dragonfly popup](http://i.imgur.com/bihN3ji.gif)

Instead of just clicking tokens, we can also click the dependencies and dependents in the __dragonfly popup__.

This will build up a path (or dragonfly tail) of the tokens you've traversed.

![Building Dragonfly tail](http://i.imgur.com/CnFxZIZ.gif)

__Clicking__ the dragonfly's tail or path will commit them to the diagram.
When nodes are added to the diagram, all dependencies between the committed nodes are added.

> This allows you to discover hidden dependencies between tokens.

In this example we click on the functions in the order `A() -> B() -> C()`,
and the dependency between `C` and `A` is picked up.

![Commiting](http://i.imgur.com/ki4UAMu.gif)

## Finding nodes in code

Just click on the node in the diagram to be taken to the token in the code.

## Removing a node

Double click on a node to remove it from the diagram.


# Contribution

I need help making it presentable.
If this idea excites you, please contact me on [twitter](https://twitter.com/spyr1014).

## Contribution to frontend

To work on the frontend you'll need to clone [this frontend repo](https://github.com/SpyR1014/ts-depDraw-front).

## Contribution to backend

Clone this repo.

`npm install`

To run:

`npm start <filePath>` is the same as `ts-depDraw <filePath>`

### Testing

`npm test`

# Task list

 - [x] Get text from file.
 - [x] Get token information from file.
 - [x] Get rough dependencies for a token.
 - [x] Get rough dependents for a token.
 - [x] Create frontend repo.
 - [ ] Fix tests so that things are legit.
 - [x] Share/[Save/Load] diagram
 - [ ] Able to add text nodes
 - [x] Fix edge between the same node.
 - [x] All edges added between nodes
 - [ ] Add projectless server to allow loading of other projects.
 - [x] Integrate front end with backend.
 - [x] Refactor end points in front end to be easily changed.
 - [ ] Refactor end points in back end to be easily changed.
 - [x] Use opn to open browser.
 - [ ] Create completely unique user ID's for sessions (and logging)
 - [ ] Set up logging server.


 # Known Bugs

 - [ ] Dependencies are anything in scope. Regardless if they are actual dependencies.
 - [ ] If a function is represented in a single line, a scope tree doesn't form properly.
 - [x] Function declaration headers are listed as dependencies.
 - [x] Duplicated dependents for some tokens.
 - [x] tsserver chunks responses which can break JSON parse.
 - [ ] Template literal strings don't tokenize properly.
 - [x] ex5.ts line 1, offset 13 - causes error
 - [ ] Sometimes parameters infinitely nest in the definition dragonfly list.
 - [ ] Large files crash the server when buffering the tsserver responses is required.


# 