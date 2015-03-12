/* eslint-env mocha */
/* eslint func-names: 0 */
'use strict';
var assert = require('assert');
var path = require('path');
var GLOBSTAR = path.join(__dirname, 'globstar.js');

function ENOENT(cmd) {
  var err = new Error('spawn ' + cmd + ' ENOENT');
  err.code = 'ENOENT';
  err.errno = 'ENOENT';
  err.syscall = 'spawn ' + cmd;
  err.path = cmd;
  return err;
}

describe('globstar', function() {

  describe('main', function() {
    var mockery = require('mockery');
    var mockSpawn = require('mock-spawn');
    var spawn;
    var npmlog;
    var logs;
    var globstar;

    beforeEach(function() {
      logs = [];
      npmlog = {
        log: function() {
          logs.push(arguments);
        },
      };
      spawn = mockSpawn(true);
      mockery.enable({
        useCleanCache: true,
        warnOnReplace: false,
        warnOnUnregistered: false,
      });
      mockery.registerMock('npmlog', npmlog);
      mockery.registerMock('child_process', { spawn: spawn });
      mockery.registerAllowable(GLOBSTAR, true);
      globstar = require(GLOBSTAR);
    });

    afterEach(function() {
      mockery.deregisterAll();
      mockery.resetCache();
      mockery.disable();
    });

    it('should throw an Error on missing COMMAND', function(done) {
      globstar([], function(status) {
        var found = false;
        logs.forEach(function(entry) {
          var level = entry[0];
          var msg = entry[2];
          if (/COMMAND/i.test(msg)) {
            assert.strictEqual(level, 'error');
            found = true;
          }
        });
        assert.ok(found);
        assert.ok(status);
        done();
      });
    });

    it('should throw an Error on failing COMMAND', function(done) {
      mockery.deregisterMock('child_process');
      mockery.resetCache();
      require(GLOBSTAR)(['--', 'false'], function(status) {
        assert.strictEqual(status, 1);
        done();
      });
    });

    it('should throw an Error on unknown COMMAND', function(done) {
      spawn.setDefault(function(cb) {
        assert.strictEqual(this.command, 'NOENTRY_COMMAND');
        this.emit('error', new ENOENT('NOENTRY_COMMAND'));
        this.emit('close', 1); // see gotwarlost/mock-spawn#4
        cb(1);
      });

      globstar(['NOENTRY_COMMAND'], function(status) {
        var found = false;
        logs.forEach(function(entry) {
          var level = entry[0];
          var msg = entry[2];
          if (level === 'error' && /NOENTRY_COMMAND/i.test(msg)) {
            found = true;
          }
        });
        assert.ok(found);
        assert.ok(status);
        done();
      });
    });

    it('should respect --ignore', function(done) {
      spawn.setDefault(function(cb) {
        assert.strictEqual(this.command, 'echo');
        assert.deepEqual(this.args, ['globstar.js']);
        this.stdout.write(this.args.join(' '));
        this.emit('close', 0); // see gotwarlost/mock-spawn#4
        cb(0);
      });
      globstar(['--ignore', 'test.js', '--', 'echo', '*.js'], function(status) {
        logs.forEach(function(entry) {
          var msg = entry[2];
          if (/Running/i.test(msg)) {
            assert.ok(/echo.*globstar.js/.test(msg), msg + ' does not ' +
              'include "echo .* globstar.js"');
          }
        });
        assert.strictEqual(status, 0);
        done();
      });
    });

    it('should respect --node', function(done) {
      spawn.setDefault(function(cb) {
        assert.strictEqual(this.command, 'echo');
        assert.deepEqual(this.args, ['*/*/package.json']);
        this.stdout.write(this.args.join(' '));
        this.emit('close', 0); // see gotwarlost/mock-spawn#4
        cb(0);
      });
      globstar(['--node', '--', 'echo', '*/*/package.json'], function(status) {
        assert.strictEqual(status, 0);
        done();
      });
    });

    it('should respect -v', function(done) {
      var noEntryError = new ENOENT('NOENTRY_COMMAND');
      spawn.setDefault(function(cb) {
        this.emit('error', noEntryError);
        this.emit('close', 1); // see gotwarlost/mock-spawn#4
        cb(1);
      });

      globstar(['-vv', '--', 'NOENTRY_COMMAND'], function(status) {
        var found = false;
        logs.forEach(function(entry) {
          var level = entry[0];
          var msg = entry[2];
          if (level === 'error' && /NOENTRY_COMMAND/i.test(msg)) {
            found = true;
          }
        });
        assert.ok(found);
        assert.ok(status);
        done();
      });
    });
  });

  describe('cli', function() {
    var spawn = require('child_process').spawn;
    this.timeout(5000);

    function listen(cmd, args, onClose) {
      var capture = {
        stderr: '',
        stdout: '',
      };
      var sut = spawn(cmd, args);

      sut.on('close', onClose.bind(capture));

      [
        'stderr',
        'stdout',
      ].forEach(function(stream) {
        sut[stream].setEncoding('utf8');
        sut[stream].on('data', function(data) {
          capture[stream] += data;
        });
      });
    }

    it('should output a message and return a non-zero exit status on errors',
      function(done) {
        listen('node', [GLOBSTAR], // missing COMMAND
          function onClose(status) {
            assert.notStrictEqual(this.stderr, '');
            assert.ok(status !== 0, 'unexpected exit status: ' + status);
            done();
          }
        );
      }
    );

    it('should echo foobar', function(done) {
      listen('node', [GLOBSTAR, '--', 'echo', 'foobar'],
        function onClose(status) {
          assert.strictEqual(this.stdout.trim(), 'foobar');
          assert.strictEqual(status, 0);
          done();
        }
      );
    });

    it('should glob READ*.md', function(done) {
      listen('node', [GLOBSTAR, '--', 'echo', 'READ*.md'],
        function onClose(status) {
          assert.strictEqual(this.stdout.trim(), 'README.md');
          assert.strictEqual(status, 0);
          done();
        }
      );
    });
  });

});
