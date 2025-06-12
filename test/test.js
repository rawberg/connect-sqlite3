var should = require('should'),
    session = require('express-session'),
    sqlite3 = require('sqlite3'),
    util = require('util'),
    SQLiteStore = require('../lib/connect-sqlite3.js')(session);
  
describe('connect-sqlite3 basic test suite', function() {
    var dbConnection;

    before(function() {
        dbConnection = new sqlite3.Database(':memory:');
        this.memStore = new SQLiteStore({db: dbConnection});
    });

    after(function() {
        dbConnection.close();
    });

    it('it should save a new session record', function(done) {
        this.memStore.set('1111222233334444', {cookie: {maxAge:2000}, name: 'sample name'}, function(err, rows) {
            should.not.exist(err, 'set() returned an error');
            rows.should.be.empty;
            done();
        });
    });


    it('it should retrieve an active session', function(done) {
        this.memStore.get('1111222233334444', function(err, session) {
            should.not.exist(err, 'get() returned an error');
            should.exist(session);
            (session).should.eql({cookie: {maxAge:2000}, name: 'sample name'});
            done();
        });
    });

    it('it should gracefully handle retrieving an unkonwn session', function(done) {
        this.memStore.get('hope-and-change', function(err, rows) {
            should.not.exist(err, 'get() unknown session returned an error');
            should.equal(undefined, rows, 'unknown session is not undefined');
            done();
        });
    });

    it('it should only contain one session', function(done) {
        this.memStore.length(function(err, len) {
            should.not.exist(err, 'session count returned an error');
            should.exist(len);
            len.should.equal(1);
            done();
        });
    });

    it('it should clear all session records', function(done) {
        var that = this;
        this.memStore.clear(function(err, success) {
            should.not.exist(err, 'clear returned an error');
            success.should.be.true;

            that.memStore.length(function(err, len) {
                should.not.exist(err, 'session count after clear returned an error');
                should.exist(len);
                len.should.equal(0);
                done();
            });
        });
    });

    it('it should destroy a session', function(done) {
        var that = this;
        this.memStore.set('555666777', {cookie: {maxAge:1000}, name: 'Rob Dobilina'}, function(err, rows) {
            should.not.exist(err, 'set() returned an error');
            rows.should.be.empty;
            
            that.memStore.destroy('555666777', function(err) {
                should.not.exist(err, 'destroy returned an error');

                that.memStore.length(function(err, len) {
                    should.not.exist(err, 'session count after destroy returned an error');
                    should.exist(len);
                    len.should.equal(0);
                    done();                        
                });                  
            });
        });
    });
});
  
