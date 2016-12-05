
/**
 * Author: Andrew Jakubowicz
 */
init();

async function init() {
    await makeRequest('/api/getFileText')
        .then((val: string) => {
            let domCode = document.getElementById("code-text-box");
            let getFileTextRequest = JSON.parse(val);

            domCode.innerText = getFileTextRequest.text;
            document.getElementById('code-file-title').innerText = getFileTextRequest.file;

        })
        .catch(err => console.error(err));
}


/**
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