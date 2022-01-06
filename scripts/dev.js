// 针对某个包进行打包
const fs = require('fs');
const execa = require('execa');

const target = 'reactivity';

async function build(target) {
    await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], {
        stdio: 'inherit'
    });
}

build(target);
