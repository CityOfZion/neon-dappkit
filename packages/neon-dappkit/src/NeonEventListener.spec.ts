import { ChildProcess, spawn } from 'child_process'
import * as path from 'path';
import assert from 'assert'

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function neoGoPath() {
  return path.resolve(path.join(__dirname, '..', 'neogo', 'neogo'))
}

function getDataDir() {
  return path.resolve(path.join(__dirname, '..', 'data'))
}

describe('NeonEventListener', function () {
  this.timeout(60000)
  let childProcess: ChildProcess;

  beforeEach(async function () {
    const neoGo = neoGoPath();
    const dataDir = getDataDir();

    childProcess = spawn(neoGo, ['node', '--config-file', `${dataDir}/protocol.unit_testnet.single.yml`, '--relative-path', dataDir], {})
    await wait(1200)

    return true
  })

  afterEach('Tear down', async function () {
    return childProcess.kill();
  })

  it('does execute neoGo', async () => {
    assert(childProcess !== undefined, 'child process running neo-go is set')
  })
})
