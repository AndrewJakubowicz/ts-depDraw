
/**
 * Author: Andrew Jakubowicz
 */

// globals represents the data being represented on the page.
let globals = {
    displayText: "",
    currentTokens: []
};




/** Function that starts on load. */
async function init() {
    let filePath: string;

    // We want the base files text!
    let textFileRequest = fileWeWant => {
        return makeRequest('/api/getFileText', { filePath: fileWeWant })
    }
    
    // Initial request to get the name of the file.
    await makeRequest('/api/init')
        // Get the text for the file.
        .then(textFileRequest)
        // Update the page with the information.
        .then((val: string) => {
            let getFileTextRequest = jsonUtil.parseEscaped(val);
            pageUtil.updateCodeOnPage(getFileTextRequest.text)
            globals.displayText = getFileTextRequest.text;
            document.getElementById('code-file-title').innerText = getFileTextRequest.file;
            // Save the filePath returned to use with future functions.
            filePath = getFileTextRequest.file;

            // Now we want to highlight the words that might have definitions attached to them.
            // This call will return a json object that specifies line number, offset and length
            // of identifier.
            return makeRequest('/api/getFileTextMetadata', { filePath: filePath })
        }).then((res: string) => {
            globals.currentTokens = jsonUtil.parseEscaped(res);
            return globals.currentTokens
        }).then()
        .catch(err => console.error(err));
}





















/** These functions help update areas of the page. */
namespace pageUtil{
    /**
     * Updates the code tag on the page.
     * 
     * @param {string} textData Text to place in the code box.
     */
    export function updateCodeOnPage(textData: string) {
        document.getElementById("code-text-box").innerText = '\n' + textData;
    }
}


/**
 * makeRequest is a helper function that calls a url.
 * Code adapted from: http://stackoverflow.com/a/30008115
 * 
 * @param {string} url Relative url to call.
 * @param {obj} [params] key/values to pass into the url.
 * @returns {Promise} promise that containes the result of the api call.
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
