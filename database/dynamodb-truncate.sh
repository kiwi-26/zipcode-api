#!/bin/bash

set -e

prefix=$1
tables=$(aws dynamodb list-tables | jq -r '.[][] | select(. | test("^'$prefix'-.+"))')

tmp_scan_data=$(mktemp)
tmp_delete_items=$(mktemp)

for t in $tables; do
    key=$(aws dynamodb describe-table --table-name $t | jq -r '.Table.KeySchema[].AttributeName')

    # 予約語はprojection-expressionで指定できないため、全て#を付与してしまう
    proj=$(echo $key | tr ' ' '\n' | sed -E 's/(.+)/#\1/' | tr '\n' ',' | sed 's/,$//')
    attr=$(echo $key | tr ' ' '\n' | sed -E 's/(.+)/"#\1":"\1"/' | tr '\n' ',' | sed 's/,$//' | sed -E 's/(.+)/{\1}/')

    while :; do
        aws dynamodb scan --table-name $t --projection-expression "$proj" --expression-attribute-names "$attr" --max-item 25 > $tmp_scan_data

        count=$(cat $tmp_scan_data | jq '.Count')
        if [[ $count -eq 0 ]]; then
        echo "${t}: delete completed."
        break
        fi

        echo "${t}: delete progress ... ${count}."

        cat $tmp_scan_data | jq '.Items[] | {"Key": .} | {"DeleteRequest": .}' | jq -s '.' | jq '{"'$t'": .}' > $tmp_delete_items

        aws dynamodb batch-write-item --request-items file://$tmp_delete_items > /dev/null
    done
done