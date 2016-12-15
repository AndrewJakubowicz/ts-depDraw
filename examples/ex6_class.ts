
class exampleClass {

    constructor() {

    }

    returnSomething(){
        dependencyFunction()
    }

    static staticMethod(){
        return 1 + 1
    }
}



function dependencyFunction(){
    // Do nothing.
    return 1 + 1
}


let rar = new exampleClass();


exampleClass.staticMethod();