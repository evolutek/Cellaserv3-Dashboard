# Cellaserv dashboard

Welcome to the cellaserv interactive dashboard! It's the advanced web interface
of cellaserv. Whereas the integrated `:4280` http interface is static and
basic, the cellaserv dashboard is using [Angular](https://angular.io) to be
dynamic and interactive.

## Using

* Install npm with your package manager
* Clone this repository:

```
git clone git@bitbucket.org:evolutek/cellaserv3-dashboard.git
cd cellaserv3-dashboard
```

* Install the dependencies using npm: `npm install`. You will most likely need
  to add the `node_modules/.bin/` directory to your `PATH`.
* If the cellaserv3 broker is not listening on `localhost:4200`, change the
  path in `src/app/cellaserv.service.ts`.
* Start the development server: `ng serve --port 4242`. We specify the port
  because the default one is the same as cellaserv.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app
will automatically reload if you change any of the source files.

## Updating

To update the dependencies:

```
npm update
```

## Testing

TODO: unit testing
