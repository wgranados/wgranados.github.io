#!/bin/sh
set -eu

if [ -f Gemfile ]; then
  if ! bundle check; then
    bundle install
  fi
fi

exec "$@"
