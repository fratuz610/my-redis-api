"use strict";

class AdminAuth {

  constructor(logFactory, config, expressUtil, authUtil) {
    this.log = logFactory.get('AdminAuth');
    this.config = config;
    this.expressUtil = expressUtil;
    this.authUtil = authUtil;
  }

  middleware(req,res,next) {

  	var authHeader = req.get("authorization");

    if(!authHeader)
      return next(this.expressUtil.httpError(401, "adminAuth: please provide authentication"));

    var auth = this.authUtil.parseBasicAuth(authHeader);

    if(auth.error)
      return next(this.expressUtil.httpError(401, "adminAuth: please provide authentication: " + auth.error));

    if(auth.username !== this.config.admin.username || auth.password !== this.config.admin.password)
      return next(this.expressUtil.httpError(401, "adminAuth: invalid username/password"));
    
    return next();
  }

}

module.exports = AdminAuth;