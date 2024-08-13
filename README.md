# node-red-codeengine
Node RED docker configuration designed to run on IBM Code Engine

_work in progress_

## Environment variables

### Authentication for editor

To add authentication to the Node-RED editor, set `NODE_RED_USERNAME` to the editor username and `NODE_RED_PASSWORD` to the editor password

### Cloudant/CouchDB persistent storage
To use Cloudant or CouchDB for persistent storage for Node-RED configuration, flows and credentials, set the following:
```
NODE_RED_CLOUDANT_URL`=<Cloudant/CouchDB URL>
NODE_RED_CLOUDANT_DB_NAME=<database name> // Defaults to _nodered_
NODE_RED_CLOUDANT_APP_NAME`=<application name> // Used as document prefix, defaults to _nodered_
```

#### Cloudant authentication
To use IBM Cloud IAM authentication set `NODE_RED_CLOUDANT_APIKEY` to the API key in the console.

To use IBM Cloud legacy authentication or CouchDB authentication, set the following:
```
NODE_RED_CLOUDANT_AUTH_TYPE=COUCHDB_SESSION
NODE_RED_CLOUDANT_USERNAME=<username>
NODE_RED_CLOUDANT_PASSWORD=<password>
```

