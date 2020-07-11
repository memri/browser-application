## About

This is the repository for Memri's browser client, and developer playground.

## Local build/run

```sh
npm install 
```

To build in playground in dist folder run:

```sh
npm run build
```

## Development

To start webpack dev server run:

```sh
npm run start
```

and opem [localhost:9000](http://localhost:9000)

In the text field at the top left of the page write the url of the pod and press the `connect to pod` button

To use mock data instead of pod, write `mock` instead of the url.

If pod does not allow connection, you may need to use `--disable-web-security` flag for chrome 
(Note, this flag is applied only if `--user-data-dir=someDir` is provided as well)