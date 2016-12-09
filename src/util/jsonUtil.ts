/**
 * Helper functions to parse JSON.
 * 
 * This solves problems that are caused by the communication with tsserver.
 * Backslashes in filepaths.
 */

/** THIS IS FROM http://stackoverflow.com/a/17168929 */
JSON.stringify = JSON.stringify || function (obj) {
    var t = typeof (obj);
    if (t != "object" || obj === null) {
        // simple data type
        if (t == "string") obj = '"'+obj+'"';
        return String(obj);
    }
    else {
        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        for (n in obj) {
            v = obj[n]; t = typeof(v);
            if (t == "string") v = '"'+v+'"';
            else if (t == "object" && v !== null) v = JSON.stringify(v);
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }
        var rawString = (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
       return rawString;
    }
};

function escape (key, val) {
    if (typeof(val)!="string") return val;

    var replaced = encodeURIComponent(val);
    return replaced;
};

/**
 * stringifyEscape takes an object and stringifies it.
 * String values are URIencoded.
 */
export function stringifyEscape(obj){
    return JSON.stringify(obj,escape);
};
/** End of code from stackOverflow */


/**
 * parseEscaped takes a JSON string and returns an object.
 * String values are decoded using decodeURIComponent.
 */
export function parseEscaped(encodedJSON: string){
    return JSON.parse(encodedJSON, (key, val) => {
        return typeof val === 'string' ? decodeURIComponent(val) : val
    });
}