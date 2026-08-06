/**
 * Connect - SQLite3
 * Copyright(c) 2012 David Feinberg
 * MIT Licensed
 * forked from https://github.com/tnantoka/connect-sqlite
 */

/**
 * Module dependencies.
 */
var events = require('events'),
    fs = require('fs');

/**
 * @type {Integer}  One day in milliseconds.
 */
var oneDay = 86400000;

/**
 * Return the SQLiteStore extending connect's session Store.
 *
 * @param   {object}    connect
 * @return  {Function}
 * @api     public
 */
module.exports = function(connect) {
    /**
     * Connect's Store.
     */
    var Store = (connect.session) ? connect.session.Store : connect.Store;

    /**
     * Remove expired sessions from database.
     * @param   {Object}    store
     * @api     private
     */
    function dbCleanup(store) {
        var now = new Date().getTime();
        store.db.run('DELETE FROM ' + store.table + ' WHERE ? > expired', [now]);
    }

    /**
     * Initialize SQLiteStore with the given options.
     *
     * @param   {Object}    options
     * @api     public
     */
    function SQLiteStore(options) {
        options = options || {};
        Store.call(this, options);

        this.table = options.table || 'sessions';

        if (options.db && typeof options.db === 'object') {
            // Already-initialized database connection (e.g. `new sqlite3.Database(...)`).
            this.db = options.db;
        } else {
            // Legacy usage: `db` is a filename (or omitted, defaulting to the table name),
            // and the store constructs the sqlite3 connection itself.
            var dbName = options.db || this.table;
            var dbPath;

            if (dbName.indexOf(':memory:') > -1 || dbName.indexOf('?mode=memory') > -1) {
                dbPath = dbName;
            } else {
                dbPath = (options.dir || '.') + '/' + dbName;
            }

            if (options.dir && options.createDirIfNotExists) {
                try {
                    fs.mkdirSync(options.dir, { recursive: true });
                } catch (e) {}
            }

            var sqlite3;
            try {
                sqlite3 = require('sqlite3');
            } catch (e) {
                throw new Error("connect-sqlite3: install the 'sqlite3' package to use a filename for the 'db' option (npm install sqlite3)");
            }

            this.db = new sqlite3.Database(dbPath, options.mode);
        }

        this.client = new events.EventEmitter();
        var self = this;

        this.db.exec((options.concurrentDb ? 'PRAGMA journal_mode = wal; ' : '') + 'CREATE TABLE IF NOT EXISTS ' + this.table + ' (' + 'sid PRIMARY KEY, ' + 'expired, sess)',
            function(err) {
                if (err) throw err;
                self.client.emit('connect');

                dbCleanup(self);
                setInterval(dbCleanup, oneDay, self).unref();
            }
        );
    }

    /**
     * Inherit from Store.
     */
    SQLiteStore.prototype = Object.create(Store.prototype);
    SQLiteStore.prototype.constructor = SQLiteStore;

    /**
     * Attempt to fetch session by the given sid.
     *
     * @param   {String}    sid
     * @param   {Function}  fn
     * @api     public
     */
    SQLiteStore.prototype.get = function(sid, fn) {
        var now = new Date().getTime();
        this.db.get('SELECT sess FROM ' + this.table + ' WHERE sid = ? AND ? <= expired', [sid, now],
            function(err, row) {
                if (err) fn(err);
                if (!row) return fn();
                fn(null, JSON.parse(row.sess));
            }
        );
    };

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param   {String}    sid
     * @param   {Session}   sess
     * @param   {Function}  fn
     * @api     public
     */
    SQLiteStore.prototype.set = function(sid, sess, fn) {
        try {
            var maxAge = sess.cookie.maxAge;
            var now = new Date().getTime();
            var expired = maxAge ? now + maxAge : now + oneDay;
            sess = JSON.stringify(sess);

            this.db.all('INSERT OR REPLACE INTO ' + this.table + ' VALUES (?, ?, ?)',
                [sid, expired, sess],
                function(err, rows) {
                    if (fn) fn.apply(this, arguments);
                }
            );
        } catch (e) {
            if (fn) fn(e);
        }
    };

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param   {String}    sid
     * @api     public
     */
    SQLiteStore.prototype.destroy = function(sid, fn) {
        this.db.run('DELETE FROM ' + this.table + ' WHERE sid = ?', [sid], fn);
    };

    /**
     * Fetch all sessions.
     *
     * @param   {Function}  fn
     * @api     public
     */
    SQLiteStore.prototype.all = function(fn) {
        this.db.all('SELECT * FROM ' + this.table + '', function(err, rows) {
            if (err) fn(err);
            fn(null, rows.map((row) => JSON.parse(row.sess)));
        });
    };

    /**
     * Fetch number of sessions.
     *
     * @param   {Function}  fn
     * @api     public
     */
    SQLiteStore.prototype.length = function(fn) {
        this.db.all('SELECT COUNT(*) AS count FROM ' + this.table + '', function(err, rows) {
            if (err) fn(err);
            fn(null, rows[0].count);
        });
    };

    /**
     * Clear all sessions.
     *
     * @param   {Function}  fn
     * @api     public
     */
    SQLiteStore.prototype.clear = function(fn) {
        this.db.exec('DELETE FROM ' + this.table + '', function(err) {
            if (err) fn(err);
            fn(null, true);
        });
    };

    /**
     * Touch the given session object associated with the given session ID.
     *
     * @param   {string}    sid
     * @param   {object}    session
     * @param   {function}  fn
     * @public
     */
    SQLiteStore.prototype.touch = function(sid, session, fn) {
        if (session && session.cookie && session.cookie.expires) {
            var now = new Date().getTime();
            var cookieExpires = new Date(session.cookie.expires).getTime();
            this.db.run('UPDATE ' + this.table + ' SET expired=? WHERE sid = ? AND ? <= expired',
                [cookieExpires, sid, now],
                function(err) {
                    if (fn) {
                        if (err) fn(err);
                        fn(null, true);
                    }
                }
            );
        } else {
           fn(null, true);
        }
    }

    return SQLiteStore;
};
