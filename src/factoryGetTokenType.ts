/**
 * Returns getTokenType method for api.
 */
const  factoryGetTokenType = ({tssServer, winston}) => (filePath, line, offset) => 
    new Promise((resolve, reject) => {
    tssServer.open(filePath)
        .then(response => {
                winston.log('trace', 'promise fulfilled: file opened ', response);
                return tssServer.quickinfo(filePath, line, offset);
              },
              reject)
        .then(JSON.stringify,
              reject)
        .then(resolve)
        .catch(reject);
    
    })

export default factoryGetTokenType;