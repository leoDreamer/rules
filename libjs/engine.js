const d = require('./durableEngine')
class Engine {
  constructor (redisConf, redisCli) {
    this.host = d.host(redisConf)
    this.redisCli = redisCli
    this.extendEngine(this.host, redisCli)
  }

  loadRules () {}

  async addRule (name, rule) {
    const _self = this
    return new Promise((resolve, reject) => {
      _self.host.setRuleset(name, rule, (err, ret) => {
        if (err) reject(err)
        resolve(ret)
      })
    })
  }

  async deleteRules (ruleName) {
    const _self = this
    return new Promise((resolve, reject) => {
      _self.host.deleteRuleset(ruleName, (err, result) => {
        if (err) reject(err)
        resolve(reuslt)
      })
    })
  }

  async submitEvent (name, fact) {
    await this.ensureRuleset(name)
      .catch(err => {
        throw err
      })
    return this.host.post(name, fact)
  }

  async submitFact (name, fact) {
    await this.ensureRuleset(name)
      .catch(err => {
        throw err
      })
    return this.host.assert(name, fact)
  }

  async ensureRuleset (name) {
    const _self = this
    return new Promise ((resolve, reject) => {
      _self.host.ensureRuleset(name, function (err, result) {
        if (err) reject(err)
        resolve(result)
      })
    })
  }

  extendEngine (host, redisCli) {
    host.getAction = function (actionName) {
      if (actionName === 'emit') {
        return function(c) {
          console.log('eimit ' + JSON.stringify(c));
        }
      }
      return null
    }
    host.loadRuleset = function(rulesetName, complete) {
      redisCli.hget('engine-rulesets', rulesetName, function(err, result) {
        if (err) {
            complete(err);
        } else {
            complete(null, JSON.parse(result));
        }
      })
    }
    host.saveRuleset = function(rulesetName, rulesetDefinition, complete) {
      redisCli.hset('engine-rulesets', rulesetName, JSON.stringify(rulesetDefinition), complete);
    }
  }
}

module.exports = Engine