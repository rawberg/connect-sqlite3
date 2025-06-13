# Connect SQLite3

connect-sqlite3 is a SQLite3 session store modeled after the TJ's connect-redis store.


## Installation
```sh
	  $ npm install connect-sqlite3
```

## Options

  - `table='sessions'` Database table name
  - `db=dbConnection` SQLite database connection object
  - `concurrentDB='false'` Enables [WAL](https://www.sqlite.org/wal.html) mode (defaults to false)

> **Note:** The `options` parameter requires an already initialized database connection instead of a file name. This design allows the library to remain flexible about database connection management in your application.

## Usage
```js
    var connect = require('connect'),
        dbConnection = new sqlite3.Database(':memory:'),
        SQLiteStore = require('connect-sqlite3')(connect);

    connect.createServer(
      connect.cookieParser(),
      connect.session({ store: new SQLiteStore({ db: dbConnection }), secret: 'your secret' })
    );
```
  with express
```js
    3.x:
    var SQLiteStore = require('connect-sqlite3')(express);

    4.x:
    var session = require('express-session');
    var SQLiteStore = require('connect-sqlite3')(session);

    var dbConnection = new sqlite3.Database('./sessions.db')
    app.configure(function() {
      app.set('views', __dirname + '/views');
      app.set('view engine', 'ejs');
      app.use(express.bodyParser());
      app.use(express.methodOverride());
      app.use(express.cookieParser());
      app.use(session({
        store: new SQLiteStore({ db: dbConnection }),
        secret: 'your secret',
        cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
      }));
      app.use(app.router);
      app.use(express.static(__dirname + '/public'));
    });
```
## Test
```sh
    $ npm test
```
