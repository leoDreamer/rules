const Engine = require('../libjs/engine')
const redis = require('redis')
console.log(`pid: ${process.pid}`)

const redisCli = redis.createClient([{host: 'localhost', port: 6379, password: '', db: 1}])
const engine = new Engine([{host: 'localhost', port: 6379, password: '', db: 1}], redisCli)

const numMap = {
  rule: 2,
  event: 10
}
const each = 100
async function sleep (time) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('sleep done')
      resolve()
    }, time)
  })
}

async function main () {
  async function testEvent () {
    let emit = false
    console.time('run')
    let j = 0
    for(var i = 0; i < numMap.event; i++) {
      const param1 = parseInt(Math.random() * 100)
      const param = parseInt(Math.random() * 100)
      const target = parseInt(Math.random() * 100000 % numMap.rule)
      if (param1 < 50 && param > 50) {
        j++
        emit = true
      }
      const ret = await engine.submitEvent(`rule${target}`, { param1, param })
        .catch(err => {
          console.log(`Submit Event Error: ${err}`)
        })
      console.log(`index: ${i} param1: ${param1} param: ${param} ret: ${ret} target: ${target}`)
    }
    console.timeEnd('run')
    console.log(`emit ${j} times`)
  }
  async function addRules () {
    for (var i = 0; i < numMap.rule / each; i++) {
      await Promise.all(new Array(each).fill(0).map((e, index) => {
        return engine.addRule(`rule${i * each + index}`, {
          [`rule${i * each + index}$state`]: {
            "start": {
              "r0": {
                "all": [{
                  "m": {
                    "$gt": {
                      "param": 50
                    }
                  }
                }],
                "all": [{
                  "m": {
                    "$lt": {
                      "param1": 50
                    }
                  }
                }],
                "to": "emit",
                "run": "emit"
              }
            }
          }
        })
        .catch(err => {
          console.log(`Add Rule Error: ${err}`)
        })
      }))
      await sleep(1 * 1000)
      console.log(`add rule ${(i + 1) * each} done`)
    }
  }
  async function testFact () {
    const ret = await engine.submitFact('ab', {
      tem: 60,
      sid: 5,
    })
    .catch(err => {
      console.log(`Submit Fact Error: ${err}`)
    })
    const ret1 = await engine.submitFact('ab', {
      tem1: 6,
      sid: 5
    })
    .catch(err => {
      console.log(`Submit Fact Error: ${err}`)
    })
    const ret2 = await engine.submitFact('ab', {
      tem: 6,
      sid: 5
    })
    .catch(err => {
      console.log(`Submit Fact Error: ${err}`)
    })
    const ret3 = await engine.submitFact('ab', {
      tem1: 6,
      sid: 5
    })
    .catch(err => {
      console.log(`Submit Fact Error: ${err}`)
    })
    console.log(`test fact ${ret} ${ret1} ${ret2} ${ret3}`)
  }
  async function test1 () {
    await engine.addRule('test1', {
      'test1$state': {
        "start": {
          "r0": {
            "all": [{
              "m": {
                "$gt": {
                  "param": 50
                }
              }
            }],
            "all": [{
              "m": {
                "$lt": {
                  "param1": 50
                }
              }
            }],
            "to": "emit",
            "run": "emit"
          }
        }
      }
    })
    // await sleep(6 * 1000)
    // await engine.ensureRuleset('test1')
    const r1 = await engine.submitEvent('test1', { param: 60, param1: 6 })
    const r2 = await engine.submitFact('test1', { param: 60, sid: 1 })
    const r3 = await engine.submitFact('test1', { param1: 6, sid: 1 })
    engine.host.deleteState('test1', 1)
    const r4 = await engine.submitFact('test1', { param: 6, sid: 1 })
    const r5 = await engine.submitFact('test1', { param: 60, sid: 1 })
    console.log(`${engine.host.getState('test1', 1)} ${r1} ${r2} ${r3} ${r4} ${r5}`)
  }
  await test1()
}

main()