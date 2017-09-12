"use strict";

// make sure we are running from the local folder
process.chdir(__dirname);

// utils
var LogFactory = require('./utils/LogFactory.js');
var RedisClient = require('./utils/RedisClient.js');
var AuthUtil = require('./utils/AuthUtil.js');
var Validator = require('./utils/Validator.js');
var ExpressUtil = require('./utils/ExpressUtil.js');

// routes
var ApiRoute = require('./routes/ApiRoute.js');

// services
var HttpService = require('./services/HttpService.js');
var Config = require('./services/Config.js');

// middleware
var AdminAuth = require('./middleware/AdminAuth.js');

// Model
var RedisHelper = require('./models/RedisHelper.js');
var RedisKeys = require('./models/RedisKeys.js');
var MessageModel = require('./models/MessageModel.js');

// We wire everything up
var logFactory = new LogFactory();
var config = new Config(logFactory);

config = config.conf;

var redisKeys = new RedisKeys(config);

var redisClient = new RedisClient(logFactory, config);
redisClient = redisClient.client;

var redisHelper = new RedisHelper(redisClient);

// DEBUG level logging and above
logFactory.setMinLevel(0);

// utils
var expressUtil = new ExpressUtil();
var authUtil = new AuthUtil();
var validator = new Validator();

// models
var messageModel = new MessageModel(logFactory, config, redisClient, redisKeys, redisHelper);

// middleware
var adminAuth = new AdminAuth(logFactory, config, expressUtil, authUtil);

// routes
var apiRoute = new ApiRoute(logFactory, config, expressUtil, messageModel, adminAuth, validator);

// services
var httpService = new HttpService(logFactory, config, apiRoute);

var log = logFactory.get('my-redis-apis');
log.info('my-redis-apis starting on port %d', config.httpPort);

// we start the web interface
httpService.start();