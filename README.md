# node-red-codeengine
Node RED docker configuration designed to run on IBM Code Engine

_work in progress_

## Environment variables

### Authentication
`NODE_RED_USERNAME` Admin username

`NODE_RED_PASSWORD` Admin password

### Cloudant/CouchDB storage

`NODE_RED_CLOUDANT_URL`

`NODE_RED_CLOUDANT_DB_NAME` || "nodered"
`NODE_RED_CLOUDANT_APP_NAME` || "nodered"

`NODE_RED_CLOUDANT_APIKEY`=<apikey>

`NODE_RED_CLOUDANT_AUTH_TYPE=COUCHDB_SESSION`
`NODE_RED_CLOUDANT_USERNAME`=<username>
`NODE_RED_CLOUDANT_PASSWORD`=<password>


