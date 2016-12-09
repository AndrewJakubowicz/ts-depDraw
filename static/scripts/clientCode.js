/**
 * Author: Andrew Jakubowicz
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
init();
/**
 * Helper functions to parse JSON.
 *
 * This solves problems that are caused by the communication with tsserver.
 * Backslashes in filepaths.
 */
var jsonUtil;
(function (jsonUtil) {
    /** THIS IS FROM http://stackoverflow.com/a/17168929 */
    JSON.stringify = JSON.stringify || function (obj) {
        var t = typeof (obj);
        if (t != "object" || obj === null) {
            // simple data type
            if (t == "string")
                obj = '"' + obj + '"';
            return String(obj);
        }
        else {
            // recurse array or object
            var n, v, json = [], arr = (obj && obj.constructor == Array);
            for (n in obj) {
                v = obj[n];
                t = typeof (v);
                if (t == "string")
                    v = '"' + v + '"';
                else if (t == "object" && v !== null)
                    v = JSON.stringify(v);
                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
            var rawString = (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
            return rawString;
        }
    };
    function escape(key, val) {
        if (typeof (val) != "string")
            return val;
        var replaced = encodeURIComponent(val);
        return replaced;
    }
    ;
    /**
     * stringifyEscape takes an object and stringifies it.
     * String values are URIencoded.
     */
    function stringifyEscape(obj) {
        return JSON.stringify(obj, escape);
    }
    jsonUtil.stringifyEscape = stringifyEscape;
    ;
    /** End of code from stackOverflow */
    /**
     * parseEscaped takes a JSON string and returns an object.
     * String values are decoded using decodeURIComponent.
     */
    function parseEscaped(encodedJSON) {
        return JSON.parse(encodedJSON, function (key, val) {
            return typeof val === 'string' ? decodeURIComponent(val) : val;
        });
    }
    jsonUtil.parseEscaped = parseEscaped;
})(jsonUtil || (jsonUtil = {}));
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, textFileRequest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    textFileRequest = function (fileWeWant) {
                        return makeRequest('/api/getFileText', { filePath: fileWeWant });
                    };
                    return [4 /*yield*/, makeRequest('/api/init')
                            .then(textFileRequest)
                            .then(function (val) {
                            var getFileTextRequest = jsonUtil.parseEscaped(val);
                            updateCodeOnPage(getFileTextRequest.text);
                            document.getElementById('code-file-title').innerText = getFileTextRequest.file;
                            // Save the filePath returned to use with future functions.
                            filePath = getFileTextRequest.file;
                            // Now we want to highlight the words that might have definitions attached to them.
                            // This call will return a json object that specifies line number, offset and length
                            // of identifier.
                            return makeRequest('/api/getFileTextMetadata', { filePath: filePath });
                        }).then(function (res) {
                            console.log(jsonUtil.parseEscaped(res));
                        })["catch"](function (err) { return console.error(err); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * makeRequest is a helper function that calls a url.
 * Code adapted from: http://stackoverflow.com/a/30008115
 */
function makeRequest(url, params) {
    return new Promise(function (resolve, reject) {
        /**
         * Set up the parameters so they can be passed into api call.
         */
        var stringParams = '';
        if (params && typeof params == "object") {
            stringParams = Object.keys(params).map(function (key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }).join('&');
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url + '?' + stringParams);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            }
            else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}
// NewLine before text preserves formatting.
function updateCodeOnPage(textData) {
    document.getElementById("code-text-box").innerText = '\n' + textData;
}
