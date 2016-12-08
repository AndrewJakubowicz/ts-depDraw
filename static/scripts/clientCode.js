var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
/**
 * Author: Andrew Jakubowicz
 */
init();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        var filePath;
        // We want the base files text!
        yield makeRequest('/api/getFileText')
            .then(function (val) {
            var getFileTextRequest = JSON.parse(val);
            updateCodeOnPage(getFileTextRequest.text);
            document.getElementById('code-file-title').innerText = getFileTextRequest.file;
            // Save the filePath returned to use with future functions.
            filePath = getFileTextRequest.file;
        })
            .catch(function (err) { return console.error(err); });
        // Now we want to highlight the words that might have definitions attached to them.
        // This call will return a json object that specifies line number, offset and length
        // of identifier.
        yield makeRequest('/api/getFileTextMetadata', { filePath: filePath })
            .then(function (res) {
            console.log(JSON.parse(res));
        }).catch(function (err) {
            console.error(err);
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
