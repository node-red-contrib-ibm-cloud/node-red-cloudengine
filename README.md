# node-red-codeengine
Node RED docker configuration designed to run on IBM Code Engine

_work in progress_

## Environment variables

### Authentication for editor
`NODE_RED_USERNAME` Admin username

`NODE_RED_PASSWORD` Admin password

### Cloudant/CouchDB persistent storage

`NODE_RED_CLOUDANT_URL` URL to Cloudant/CouchDB database

`NODE_RED_CLOUDANT_DB_NAME` Name of database used to store Node-RED data (defaults to **nodered**)

`NODE_RED_CLOUDANT_APP_NAME` Name of application used as document prefix (defaults to **nodered**)

#### Cloudant authentication
To use IBM Cloud IAM authentication set `NODE_RED_CLOUDANT_APIKEY` to the API key in the console.

To use IBM Cloud legacy authentication or CouchDB authentication, set the following:
```
NODE_RED_CLOUDANT_AUTH_TYPE=COUCHDB_SESSION
NODE_RED_CLOUDANT_USERNAME=<username>
NODE_RED_CLOUDANT_PASSWORD=<password>
```

