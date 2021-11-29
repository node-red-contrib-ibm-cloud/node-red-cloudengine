/**
 * Copyright 2014, 2019 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const { CloudantV1 } = require('@ibm-cloud/cloudant');
const fs = require('fs');

let settings;
let appname;
let dbname;
let dbservice;

let currentFlowRev = null;
let currentSettingsRev = null;
let currentCredRev = null;
let currentSessionsRev = null;

let libraryCache = {};

function prepopulateFlows(resolve) {
    dbservice.getDocument({
        db: dbname,
        docID: appname + "/flow"
    }).then(response => {
        // Flows already exist - leave them alone
        resolve();
    }).catch(error => {
        let promises = [];
        if (fs.existsSync(settings.userDir + "/default/flows.json")) {
            try {
                const flow = fs.readFileSync(settings.userDir + "/default/flows.json", "utf8");
                const flows = JSON.parse(flow);
                console.log(`[cloudantStorage] Installing default flows from ${settings.userDir}/default/flows.json`);
                promises.push(cloudantStorage.saveFlows(flows));
            } catch (err2) {
                console.log("[cloudantStorage] Failed to populate default flows");
                console.log(err2);
            }
        } else {
            console.log("[cloudantStorage] No default flows found");
        };
        if (fs.existsSync(settings.userDir + "/default/flow_creds.json")) {
            try {
                const cred = fs.readFileSync(settings.userDir + "/default/flow_creds.json", "utf8");
                const creds = JSON.parse(cred);
                console.log(`[cloudantStorage] Installing default credentials from ${settings.userDir}/default/flow_creds.json`);
                promises.push(cloudantStorage.saveCredentials(creds));
            } catch (err2) {
                console.log("[cloudantStorage] Failed to populate default credentials");
                console.log(err2);
            }
        } else {
            console.log("[cloudantStorage] No default credentials found");
        };
        Promise.all(promises).then(function () {
            resolve();
        })
    })
}


let cloudantStorage = {
    init: function (_settings) {
        settings = _settings.cloudantService || {};
        //console.log(JSON.stringify(settings, null, 2));

        if (!settings) {
            var err = Promise.reject("[cloudantStorage] Settings not found");
            err.catch(err => {});
            return err;
        }

        appname = settings.prefix || require('os').hostname();
        dbname = settings.db || "nodered";
        dbservice = CloudantV1.newInstance({serviceName: settings.serviceName || "NODE_RED_CLOUDANT"});
        
        return new Promise(function (resolve, reject) {
            // Does database exist?
            dbservice.headDatabase({db: dbname})
            .then(response => {
                console.log("[cloudantStorage] Flows database found");
                prepopulateFlows(resolve);
            }).catch(error => {
                dbservice.putDatabase({db: dbname})
                .then(response => {
                    console.log(`[cloudantStorage] Created database ${dbname}`);
                    // Create standard views
                    const flowMap = {
                        map: `function (doc) {
                            var p = doc._id.split("/");
                            if (p.length > 2 && p[2] == "flow") {
                                var meta = { path: p.slice(3).join("/") };
                                emit([p[0], p[2]], meta);
                            }
                        }`
                    }
                    const libMap = {
                        map: `function (doc) {
                            var p = doc._id.split("/");
                            if (p.length > 2) {
                                if (p[2] != "flow") {
                                    var pathParts = p.slice(3, -1);
                                    for (var i = 0; i < pathParts.length; i++) {
                                        emit([p[0], p[2], pathParts.slice(0, i).join("/")], { dir: pathParts.slice(i, i + 1)[0] });
                                    }
                                    var meta = {};
                                    for (var key in doc.meta) {
                                        meta[key] = doc.meta[key];
                                    }
                                    meta.fn = p.slice(-1)[0];
                                    emit([p[0], p[2], pathParts.join("/")], meta);
                                }
                            }
                        }`
                    }
                    const designDoc = {
                        views: {
                            'flow_entries_by_app_and_type': flowMap,
                            'lib_entries_by_app_and_type': libMap
                        }
                    }
                    service.putDesignDocument({
                        db: dbname,
                        designDocument: designDoc,
                        ddoc: 'library'
                    }).then(response => {
                        console.log("[cloudantStorage] Created standard views")
                        prepopulateFlows(resolve);
                    }).catch(error => {
                        reject("[cloudantStorage] Failed to create standard views: " + error.toString());
                    });    
                }).catch(error => {
                    reject("[cloudantStorage] Failed to create database: " + error.toString())
                })
            })
        })
    },

    getFlows: function () {
        return new Promise(function (resolve, reject) {
            dbservice.getDocument({
                db: dbname,
                docID: appname + "/flow"
            }).then(response => {
                currentFlowRev = response.result.rev
                resolve(resolve.result.flow);
            }).catch(error => {
                if (error.status != 404) {
                    reject(error.toString());
                } else {
                    resolve([]);
                }
            })
        });
    },

    saveFlows: function (flows) {
        return new Promise(function (resolve, reject) {
            let params = {
                db: dbname,
                docID: appname + "/flow",
                document: {flow: flows}
            };
            if (currentFlowRev) {
                params.rev = currentFlowRev;
            };
            dbservice.putDocument(params)
            .then(response =>{
                currentFlowRev = response.result.rev;
                resolve();
            }).catch(error => {
                reject(error.toString())
            });
        });
    },

    getCredentials: function () {
        return new Promise(function (resolve, reject) {
            dbservice.getDocument({
                db: dbname,
                docID: appname + "/credential"
            }).then(response => {
                currentCredRev = response.result.rev
                resolve(resolve.result.credentials);
            }).catch(error => {
                if (error.status != 404) {
                    reject(error.toString());
                } else {
                    resolve([]);
                }
            })
        });
    },

    saveCredentials: function (credentials) {
        return new Promise(function (resolve, reject) {
            let params = {
                db: dbname,
                docID: appname + "/credential",
                document: {credentials: credentials}
            };
            if (currentCredRev) {
                params.rev = currentCredRev;
            };
            dbservice.putDocument(params)
            .then(response =>{
                currentCredRev = response.result.rev;
                resolve();
            }).catch(error => {
                reject(error.toString())
            });
        });
    },
    
    getSettings: function () {
        return new Promise(function (resolve, reject) {
            dbservice.getDocument({
                db: dbname,
                docID: appname + "/settings"
            }).then(response => {
                currentSettingsRev = response.result.rev
                resolve(resolve.result.settings);
            }).catch(error => {
                if (error.status != 404) {
                    reject(error.toString());
                } else {
                    resolve([]);
                }
            })
        });
    },

    saveSettings: function (settings) {
        return new Promise(function (resolve, reject) {
            let params = {
                db: dbname,
                docID: appname + "/settings",
                document: {settings: settings}
            };
            if (currentSettingsRev) {
                params.rev = currentSettingsRev;
            };
            dbservice.putDocument(params)
            .then(response =>{
                currentSettingsRev = response.result.rev;
                resolve();
            }).catch(error => {
                reject(error.toString())
            });
        });
    },
    
    getSessions: function () {
        return new Promise(function (resolve, reject) {
            dbservice.getDocument({
                db: dbname,
                docID: appname + "/sessions"
            }).then(response => {
                currentSessionsRev = response.result.rev
                resolve(resolve.result.sessions);
            }).catch(error => {
                if (error.status != 404) {
                    reject(error.toString());
                } else {
                    resolve([]);
                }
            })
        });
    },

    saveSessions: function (sessions) {
        return new Promise(function (resolve, reject) {
            let params = {
                db: dbname,
                docID: appname + "/sessions",
                document: {sessions: sessions}
            };
            if (currentSessionsRev) {
                params.rev = currentSessionsRev;
            };
            dbservice.putDocument(params)
            .then(response =>{
                currentSessionsRev = response.result.rev;
                resolve();
            }).catch(error => {
                reject(error.toString())
            });
        });
    },
    
    getLibraryEntry: function (type, path) {  
        let key = appname + "/lib/" + type + path;
        if (path != "" && path.substr(0, 1) != "/") {
            key = appname + "/lib/" + type + "/" + path;
        }

        if (libraryCache[key]) {
            return Promise.resolve(libraryCache[key]);
        }

        return new Promise(function (resolve, reject) {
            dbservice.getDocument({
                db: dbname,
                docID: key
            }).then(response => {
                libraryCache[key] = response.result;
                resolve(response.result);
            }).catch(error => {
                if (path.substr(-1, 1) == "/") {
                    path = path.substr(0, path.length - 1);
                }
                var qkey = [appname, type, path];
                dbservice.postView({
                    db: dbname,
                    ddoc: "library",
                    view: "lib_entries_by_app_and_type",
                    keys: qkey
                }).then(response => {
                    const data = response.result;
                    let dirs = [];
                    let files = [];
                    for (let i = 0; i < data.rows.length; i++) {
                        let row = data.rows[i];
                        let value = row.value;
                        if (value.dir) {
                            if (dirs.indexOf(value.dir) == -1) {
                                dirs.push(value.dir);
                            }
                        } else {
                            files.push(value);
                        }
                    }
                    libraryCache[key] = dirs.concat(files);
                    resolve(libraryCache[key]);
                }).catch(error => {
                    reject(error.toString())
                })
            })
        });
    },

    saveLibraryEntry: function (type, path, meta, body) {
        // Strip multiple slashes
        let p = path.split("/");
        p = p.filter(Boolean);
        path = p.slice(0, p.length).join("/")

        if (path != "" && path.substr(0, 1) != "/") {
            path = "/" + path;
        }
        let key = appname + "/lib/" + type + path;
        return new Promise(function (resolve, reject) {
            var doc = { _id: key, meta: meta, body: body };
            
            dbservice.getDocument({
                db: dbname,
                docID: key
            }).then(response => {
                let params = {
                    db: dbname,
                    docID: key,
                    document: {meta: meta, body: body}
                };
                if (response.result.rev) {
                    params.rev = response.result.rev;
                };

                dbservice.putDocument(params)
                .then(response => {
                    let p = path.split("/");
                    for (let i = 0; i < p.length; i++) {
                        delete libraryCache[appname + "/lib/" + type + (p.slice(0, i).join("/"))]
                    }
                    libraryCache[key] = body;
                    resolve();
                }).catch(error => {
                    reject(error.toString())
                })
            }).catch(error => {
                reject(error.toString())
            })
        });
    }
};

module.exports = cloudantStorage;
