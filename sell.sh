#!/usr/bin/env zsh

yarn ts-node examples/cli.ts cancel sell $1 & yarn ts-node examples/cli.ts split sell $1 10000$ 25 last-0.1% last+$2%
