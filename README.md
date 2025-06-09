# choibooru

This is an imageboard system similar to Danbooru or Gelbooru written primarily in JavaScript.


## Setup

The following programs are prerequisites to running this:

- nodejs
- npm
- sqlite3
- openssl

On Linux, the init.sh script can be used to initialise the installation with the following commands:

```sh
chmod +x init.sh
./init.sh
```

init.sh can be run either for development mode, creating .dev.env, with `./init.sh` or `./init.sh dev`, or in production mode, creatoing .prod.env, with `./init.sh prod`.

The first time running the script will give a message like ".dev/prod.env created with default configuration." The file created will need to be populated with the environment variables necessary to run the server:

- `SESSION_KEY`: the key used to encrypt session variables
- `HTTP_HOSTNAME`: the hostname the server runs on
- `HTTP_PORT`: the port the HTTP server runs on
- `HTTPS_PORT`: the port the HTTPS server runs on
- `CN`: the name used for the SSL certificate

After adding values for these environment variables, run init.sh again to generate the private key and certificate.

Once the installation has been initialised, run the following commands to start the server:

```sh
chmod +x start.sh
./start.sh
```


## Authors

- [@meganekkogekirabu](https://www.github.com/meganekkogekirabu)
- [@junovzla](https://www.github.com/junovzla) (Spanish translator)
