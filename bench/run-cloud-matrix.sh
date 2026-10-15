#!/usr/bin/env bash
# Runs the ten Scenarios on the cloud runner against every build, one build at
# a time (parallel launches hit API 500s). Retries a launch that 500s, twice.
# Usage: bench/run-cloud-matrix.sh <round>
set -u
round=$1
dir=bench/cloud/$round; mkdir -p $dir
run() { # <log> <files> <env name>
  for attempt in 1 2 3; do
    start=$(date +%s)
    com verify scenarios run $2 --environment "$3" --wait --timeout-seconds 3600 --non-interactive > $1 2>&1
    code=$?
    grep -q "server returned 500" $1 && ! grep -qE "^(passed|failed|blocked) " $1 && { sleep 20; continue; }
    break
  done
  echo "$(basename $1 .log) exit=$code seconds=$(( $(date +%s) - start )) attempts=$attempt" >> $dir/summary.txt
}
envname() { python3 -c "import json;print(json.load(open('bench/environments.json'))['$1']['env_name'])"; }
for b in base move rename menu postcode copy bug-preview bug-total bug-count bug-declined bug-charge bug-confirm; do
  run $dir/$b.log scenarios "$(envname $b)"
done
for b in bug-confirm base; do
  run $dir/strict-$b.log scenarios-strict/04s-confirm-button.yaml "$(envname $b)"
done
echo "round $round done" >> $dir/summary.txt
