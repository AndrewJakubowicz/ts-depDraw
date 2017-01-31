import * as fs from 'fs';
/**
 * Returns getFileText method for api.
 * 
 * winston is the logger.
 */
const  factoryGetFileText = ({tssServer, winston}) => filePath => 
    new Promise((resolve, reject) => {
    // Initiate tssServer open callback.
    tssServer.open(filePath)
        .then(response => {
                winston.log('trace', 'promise fulfilled:', response)
              },
              err => reject(err))
        .then(_ => {
                // Grab file text
                fs.readFile(filePath, 'utf8', function (err, data) {
                        if (err) {
                            winston.log('error', `getFileText failed with ${err}`);
                            // return res.status(500)
                            //           .send();
                            new Error(`getFileText failed with ${err}`);
                        }

                        const fileTextResponse = {
                            file: filePath,
                            text: data
                        }
                        return resolve(JSON.stringify(fileTextResponse));
                        // return res.status(200)
                        //         .send();
                    });
               },
               err => reject(err))
        .catch(err => reject(err));

    
    })




export default factoryGetFileText;