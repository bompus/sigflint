#!/bin/bash
# Stands in for run-capped inside the phase scope that run-admitted.sh starts: the first argument (the cap) is
# already applied to the whole scope, so the command runs directly in it.
shift
exec "$@"
