/**
 * Returns getFileText method for api.
 * 
 * winston is the logger.
 */
const  factoryGetFileText = ({tssServer, winston, readFile}) => filePath => 
    new Promise((resolve, reject) => {
    // Initiate tssServer open callback.
    tssServer.open(filePath)
        .then(response => {
                winston.log('trace', 'promise fulfilled:', response)
              },
              err => reject(err))
        .then(_ => {
                readFile(filePath, 'utf8', function (err, data) {
                        if (err) {
                            winston.log('error', `getFileText failed with ${err}`);
                            new Error(`getFileText failed with ${err}`);
                        }

                        const fileTextResponse = {
                            file: filePath,
                            text: data
                        }
                        return JSON.stringify(fileTextResponse);
                    });
               },
               err => reject(err))
        .then(resolve)
        .catch(err => reject(err));

    
    })

export default factoryGetFileText;