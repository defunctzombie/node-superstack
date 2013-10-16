#!/bin/bash
# injects a require('superstack'); line into the start of every js file

for file in $(find *.js); do
    sed -i.old '1s/^/require("superstack");/' $file
    rm $file.old
done
