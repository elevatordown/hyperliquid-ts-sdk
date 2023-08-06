#!/usr/bin/env zsh

yarn ts-node examples/cli.ts cancel $1 & yarn ts-node examples/cli.ts split buy $1 10000$ 50 last-$2% last+0.1%
