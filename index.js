'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var Checker = require('jscs/lib/checker');
var configFile = require('jscs/lib/cli-config');

module.exports = function (config) {
	var out = [];
	var checker = new Checker();

	checker.registerDefaultRules();
	checker.configure(config ? require(config) : configFile.load('.jscsrc', process.cwd()));

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-jscs', 'Streaming not supported'));
			return cb();
		}

		try {
			var errors = checker.checkString(file.contents.toString(), path.basename(file.path));
			errors.getErrorList().forEach(function (err) {
				out.push(errors.explainError(err, true));
			});
		} catch (err) {
			out.push(err.message.replace('null:', file.relative + ':'));
		}

		this.push(file);
		cb();
	}, function (cb) {
		if (out.length > 0) {
			this.emit('error', new gutil.PluginError('gulp-jscs', out.join('\n\n')));
		}

		cb();
	});
};
