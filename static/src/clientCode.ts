
/**
 * Author: Andrew Jakubowicz
 */

init();



/**
 * Helper functions to parse JSON.
 * 
 * This solves problems that are caused by the communication with tsserver.
 * Backslashes in filepaths.
 */
namespace jsonUtil {
    /** THIS IS FROM http://stackoverflow.com/a/17168929 */
    JSON.stringify = JSON.stringify || function (obj) {
        var t = typeof (obj);
        if (t != "object" || obj === null) {
            // simple data type
            if (t == "string") obj = '"' + obj + '"';
            return String(obj);
        }
        else {
            // recurse array or object
            var n, v, json = [], arr = (obj && obj.constructor == Array);
            for (n in obj) {
                v = obj[n]; t = typeof (v);
                if (t == "string") v = '"' + v + '"';
                else if (t == "object" && v !== null) v = JSON.stringify(v);
                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
            var rawString = (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
            return rawString;
        }
    };

    function escape(key, val) {
        if (typeof (val) != "string") return val;

        var replaced = encodeURIComponent(val);
        return replaced;
    };

    /**
     * stringifyEscape takes an object and stringifies it.
     * String values are URIencoded.
     */
    export function stringifyEscape(obj) {
        return JSON.stringify(obj, escape);
    };
    /** End of code from stackOverflow */


    /**
     * parseEscaped takes a JSON string and returns an object.
     * String values are decoded using decodeURIComponent.
     */
    export function parseEscaped(encodedJSON: string) {
        return JSON.parse(encodedJSON, (key, val) => {
            return typeof val === 'string' ? decodeURIComponent(val) : val
        });
    }
}







async function init() {
    let filePath: string;

    // We want the base files text!
    let textFileRequest = fileWeWant => {
        return makeRequest('/api/getFileText', { filePath: fileWeWant })
    }

    await makeRequest('/api/init')
        .then(textFileRequest)
        .then((val: string) => {
            let getFileTextRequest = jsonUtil.parseEscaped(val);
            updateCodeOnPage(getFileTextRequest.text)
            document.getElementById('code-file-title').innerText = getFileTextRequest.file;
            // Save the filePath returned to use with future functions.
            filePath = getFileTextRequest.file;

            // Now we want to highlight the words that might have definitions attached to them.
            // This call will return a json object that specifies line number, offset and length
            // of identifier.
            return makeRequest('/api/getFileTextMetadata', { filePath: filePath })
        }).then((res: string) => {
            console.log(jsonUtil.parseEscaped(res));
        })
        .catch(err => console.error(err));
}


/**
 * makeRequest is a helper function that calls a url.
 * Code adapted from: http://stackoverflow.com/a/30008115
 */
function makeRequest(url, params?: Object) {
    return new Promise((resolve, reject) => {

        /**
         * Set up the parameters so they can be passed into api call.
         */
        let stringParams = '';
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
            } else {
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
function updateCodeOnPage(textData: string) {
    document.getElementById("code-text-box").innerText = '\n' + textData;
}