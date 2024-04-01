import * as fs from 'fs'
import * as path from 'path'
import { https } from 'follow-redirects'
import { execSync } from 'child_process'

async function installNeoGo(): Promise<string | undefined> {
  const toolsDir = path.resolve(path.join(__dirname, '..', 'neogo'))

  const platform = process.platform
  let osType = platform.toString()
  let fileExtension = ''
  if (platform == 'win32') {
    osType = 'windows'
    fileExtension = '.exe'
  }

  const goCompilerExecutablePath = path.resolve(path.join(toolsDir, `neogo${fileExtension}`))
  if (fs.existsSync(goCompilerExecutablePath)) {
    return goCompilerExecutablePath
  }

  const version = '0.105.1'
  const arch = process.arch

  let archType = 'arm64'
  if (arch == 'x64') {
    archType = 'amd64'
  }

  if (osType == 'windows' && archType == 'arm64') {
    throw new Error(`Unsupported architecture: ${osType}-${arch}`)
  }

  if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true })
  }

  if (!fs.existsSync(goCompilerExecutablePath)) {
    if (osType == 'darwin' && archType == 'arm64') {
      const neoGoArchivePage = 'https://github.com/nspcc-dev/neo-go/archive/refs/tags'
      const downloadUrl = `${neoGoArchivePage}/v${version}.zip`
      const zipPath = path.join(toolsDir, 'neogo.zip')

      await downloadAndVerify(downloadUrl, zipPath)

      /* eslint-disable @typescript-eslint/no-var-requires */
      const AdmZip = require('adm-zip')
      const zip = new AdmZip(zipPath)

      zip.extractAllTo(toolsDir, true)
      const extractedFolderPath = path.join(toolsDir, 'neo-go-' + version)
      console.log(extractedFolderPath)
      execSync(`make -C ${extractedFolderPath}`)
    } else {
      const fileName = `neo-go-${osType}-${archType}${fileExtension}`
      const neoGoReleasePage = 'https://github.com/nspcc-dev/neo-go/releases'
      const downloadUrl = `${neoGoReleasePage}/download/v${version}/${fileName}`

      await downloadAndVerify(downloadUrl, goCompilerExecutablePath)
    }
  }

  fs.chmodSync(goCompilerExecutablePath, '755')
  execSync(`${goCompilerExecutablePath} node -h`)
  return goCompilerExecutablePath
}

async function downloadAndVerify(downloadUrl: string, downloadPath: string) {
  try {
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(downloadPath)
      https
        .get(downloadUrl, (response: { pipe: (stream: fs.WriteStream) => void }) => {
          response.pipe(file)
          file.on('finish', () => {
            file.close()
            resolve()
          })
        })
        .on('error', (err: { message: any }) => {
          fs.unlink(downloadPath, () => {}) // Delete the file async on error
          reject(err.message)
        })
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

installNeoGo()
