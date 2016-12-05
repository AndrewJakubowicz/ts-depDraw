
/**
 * Author: Andrew Jakubowicz
 */
init();

async function init() {
    await makeRequest('/api/getJSONtest')
        .then((val: string) => {
            alert(JSON.parse(val).name);
        })
        .catch(err => console.error(err));
}


/**
 * Code from: http://stackoverflow.com/a/30008115
 * Thank you.
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
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