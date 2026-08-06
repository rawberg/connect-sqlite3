# Connect SQLite3

connect-sqlite3 is a SQLite3 session store modeled after the TJ's connect-redis store.


## Installation
```sh
	  $ npm install connect-sqlite3
```

## Options

  - `table='sessions'` Database table name
  - `db='sessionsDB'` Database file name (defaults to table name), OR an already-initialized sqlite3 database connection object
  - `dir='.'` Directory to save the `'<db>'` file in (only used when `db` is a filename)
  - `createDirIfNotExists='false'` Directory `dir` is created recursively if it doesn't exist (only used when `db` is a filename)
  - `concurrentDB='false'` Enables [WAL](https://www.sqlite.org/wal.html) mode (defaults to false)

`db` can be either a filename, in which case connect-sqlite3 opens (and creates, if needed) the database itself using [`sqlite3`](https://www.npmjs.com/package/sqlite3) — install it with `npm install sqlite3` if it isn't already a dependency of your project — or an already-initialized database connection object, in which case your application is responsible for creating and managing that connection.

## Usage
```js
    var connect = require('connect'),
        SQLiteStore = require('connect-sqlite3')(connect);

    connect.createServer(
      connect.cookieParser(),
      connect.session({ store: new SQLiteStore, secret: 'your secret' })
    );
```
  with express
```js
    3.x:
    var SQLiteStore = require('connect-sqlite3')(express);

    4.x:
    var session = require('express-session');
    var SQLiteStore = require('connect-sqlite3')(session);

    app.configure(function() {
      app.set('views', __dirname + '/views');
      app.set('view engine', 'ejs');
      app.use(express.bodyParser());
      app.use(express.methodOverride());
      app.use(express.cookieParser());
      app.use(session({
        store: new SQLiteStore,
        secret: 'your secret',
        cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
      }));
      app.use(app.router);
      app.use(express.static(__dirname + '/public'));
    });
```
  or pass an already-initialized database connection instead of a filename, if you'd rather manage the connection yourself (this also lets you skip the `sqlite3` dependency in favor of a different driver, as long as it exposes the same `run`/`get`/`all`/`exec` methods):
```js
    var session = require('express-session'),
        sqlite3 = require('sqlite3'),
        SQLiteStore = require('connect-sqlite3')(session);

    var dbConnection = new sqlite3.Database('./sessions.db');

    app.use(session({
      store: new SQLiteStore({ db: dbConnection }),
      secret: 'your secret'
    }));
```
## Test
```sh
    $ npm test
```
