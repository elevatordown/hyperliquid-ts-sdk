#!/usr/bin/env zsh

yarn ts-node examples/cli.ts cancel buy $1 & yarn ts-node examples/cli.ts split buy $1 10000$ 25 last-$2% last+0.1%
