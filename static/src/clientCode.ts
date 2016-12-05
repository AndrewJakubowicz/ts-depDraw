
/**
 * Author: Andrew Jakubowicz
 */
init();


async function init() {
    let filePath: string;
    // We want the base files text!
    await makeRequest('/api/getFileText')
        .then((val: string) => {
            let getFileTextRequest = JSON.parse(val);
            updateCodeOnPage(getFileTextRequest.text)
            document.getElementById('code-file-title').innerText = getFileTextRequest.file;
            // Save the filePath returned to use with future functions.
            filePath = getFileTextRequest.file;

        })
        .catch(err => console.error(err));
    

    // Now we want to highlight the words that might have definitions attached to them.
    // This call will return a json object that specifies line number, offset and length
    // of identifier.
    await makeRequest('/api/getIdentifierTokens', {filePath: filePath})
        .then((res: string) => {

        });
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
        if (params && typeof params == "object"){
            stringParams = Object.keys(params).map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }).join('&');
        }

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url + '?' + stringParams);

        xhr.setRequestHeader('Content-Type','application/json');

        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300){
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };

        xhr.onerror = function(){
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };

        xhr.send();
    });
}

// NewLine before text preserves formatting.
function updateCodeOnPage(textData: string){
    document.getElementById("code-text-box").innerText = '\n' + textData;
}