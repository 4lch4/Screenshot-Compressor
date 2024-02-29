import { program } from 'commander'
import pkg from '../package.json'

const app = program.name('auto-compressor').version(pkg.version).description(pkg.description)

console.log(__dirname)

console.log("Hello via Bun!")

