/**
 * Author: Andrew Jakubowicz
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
function delay(milliseconds) {
    return new Promise(function (resolve) {
        setTimeout(resolve, milliseconds);
    });
}
function dramaticWelcome() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Hello");
        for (var i = 0; i < 3; i++) {
            yield delay(500);
            console.log(".");
        }
        console.log("WORLD!");
    });
}
dramaticWelcome();
