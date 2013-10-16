#!/bin/bash
# clone popular node repos and run all of their tests with superstack enabled

set -e

function run_repo {
    git clone $1
    cd $2 && npm i
    ln -s ../../../ node_modules/superstack
    cp ../replace.sh ./test
    cd test && ./replace.sh && cd ..
    npm test
    cd ..
    rm -rf $2
}

run_repo https://github.com/substack/node-browserify.git node-browserify
run_repo https://github.com/mikeal/request.git request
run_repo https://github.com/caolan/async.git async
run_repo https://github.com/dominictarr/through.git through
run_repo https://github.com/senchalabs/connect.git connect
run_repo https://github.com/jprichardson/node-fs-extra.git node-fs-extra
run_repo https://github.com/LearnBoost/engine.io.git engine.io
