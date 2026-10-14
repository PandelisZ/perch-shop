#!/usr/bin/env bash
# Runs the ten Verify Scenarios with the local runner against each build.
# Usage: bench/run-local-matrix.sh <round> [build ...]
set -u
round=$1; shift
builds=${*:-base move rename menu postcode copy bug-preview bug-total bug-count bug-declined bug-charge bug-confirm}
mkdir -p bench/local/$round
for b in $builds; do
  env_name=$(python3 -c "import json;print(json.load(open('bench/environments.json'))['$b']['env_name'])")
  start=$(date +%s)
  com verify scenarios run scenarios --environment "$env_name" --local --concurrency 5 --timeout-seconds 900 --non-interactive \
    > bench/local/$round/$b.log 2>&1
  echo "$b exit=$? seconds=$(( $(date +%s) - start ))" | tee -a bench/local/$round/summary.txt
done
