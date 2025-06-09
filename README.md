# choibooru

This is an imageboard system similar to Danbooru or Gelbooru written primarily in JavaScript.


## Setup

The following programs are prerequisites to running this:

- nodejs
- npm
- sqlite3
- openssl

On Linux, the init.sh script can be used to start the server with the following commands:

```sh
chmod +x init.sh
./init.sh
```

init.sh can be run either in development mode, using environment variables from .dev.env, with `./init.sh` or `./init.sh dev`, or in production mode, using environment variables from .prod.env, with `./init.sh prod`.

The first time running the script will give a message like ".dev/prod.env created with default configuration." The file created will need to be populated with the environment variables necessary to run the server:

- `SESSION_KEY`: the key used to encrypt session variables
- `HTTP_HOSTNAME`: the hostname the server runs on
- `HTTP_PORT`: the port the HTTP server runs on
- `HTTPS_PORT`: the port the HTTPS server runs on
- `CN`: the name used for the SSL certificate

After adding values for these environment variables, the server can be run.


## Authors

- [@meganekkogekirabu](https://www.github.com/meganekkogekirabu)
- [@junovzla](https://www.github.com/junovzla) (Spanish translator)
