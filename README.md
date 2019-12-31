# Cellaserv dashboard

Welcome to the cellaserv interactive dashboard! It's the advanced web interface
for cellaserv. Whereas the cellaserv's integrated `:4280` http interface is
static and basic, the cellaserv dashboard is using
[Angular](https://angular.io) to be dynamic and interactive.

It's written using Angular and TypeScript.

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
  path in `src/app/cellaserv_api.ts`.
* Start the development server: `ng serve --port 4242`. We specify the port
  because the default one is the same as cellaserv.

## Testing

Simply start the development server (`ng serve --port 4242`) and make change to
the project's file. Angular's dev server watches them and will reload the page
automatically when needed.

## Updating

To update the Angular and other npm dependencies:

```
ng update --all
```

## Testing

TODO: unit testing
