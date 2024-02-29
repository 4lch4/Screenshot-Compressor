#!/usr/bin/env bun

import { $ } from 'bun'
import { program } from 'commander'
import { execa } from 'execa'
import { cpus, homedir } from 'os'
import { basename, dirname, join, resolve } from 'path'
import { gray, green, yellow } from 'picocolors'
import pkg from '../package.json'

const Oxipng = '/home/alcha/.cargo/bin/oxipng'

/** Resolves to the `~/Media/Pictures/Screenshots/Compressed` directory. */
const DefaultDestPath = join(homedir(), 'Media', 'Pictures', 'Screenshots', 'Compressed')

type CommandOptions = {
  threads: string
  keep: boolean
}

async function runCommand(srcPath: string, destPath: string) {
  const { threads, keep } = program.opts<CommandOptions>()
  const cmdArgs = ['--opt', 'max', '--preserve', '--dir', destPath]

  if (!srcPath.endsWith('.png')) {
    console.warn(
      yellow(`[index#runCommand]: "${srcPath}" is not a PNG file, treating as a directory...`),
    )

    cmdArgs.push('--recursive', '--threads', threads)
  }

  console.log(
    gray(`[index#runCommand]: Running command: ${Oxipng} ${[...cmdArgs, srcPath].join(' ')}`),
  )

  const { stderr, stdout, exitCode } = await execa(Oxipng, [...cmdArgs, srcPath])

  if (exitCode === 0) {
    console.log(
      green(`[index#runCommand]: Successfully compressed "${basename(srcPath)}" to "${destPath}"`),
    )

    if (stdout.length > 0) console.log(green(`[index#runCommand]: stdout: ${stdout}`))

    if (keep) {
      console.log(gray(`[index#runCommand]: Keeping original file in "${dirname(srcPath)}"`))
    } else {
      console.log(green(`[index#runCommand]: Removing original file "${srcPath}"`))

      await $`rm ${srcPath}`
    }
  } else {
    console.error('[index#runCommand]: Command failed, stderr:')
    console.error(stderr)
  }

  process.exit(exitCode)
}

const SourcePathArg = program
  .createArgument('<srcPath>', 'Path to the image or directory of images to compress')
  .argParser(value => resolve(value))
  .default(process.cwd())

const DestPathArg = program
  .createArgument('[destPath]', 'Destination directory for the compressed image(s)')
  .argParser(value => resolve(value))
  .default(DefaultDestPath)

const ThreadsOption = program
  .createOption('-t, --threads <threads>', 'Number of threads to use')
  .default(cpus().length / 2)
  .env('SSC_THREADS')

const KeepOption = program
  .createOption('-k, --keep', 'Keep the original file')
  .default(false)
  .env('SSC_KEEP')

program
  .name(pkg.name)
  .version(pkg.version)
  .description(pkg.description)
  .action(runCommand)
  .addArgument(SourcePathArg)
  .addArgument(DestPathArg)
  .addOption(ThreadsOption)
  .addOption(KeepOption)
  .parse(process.argv)
