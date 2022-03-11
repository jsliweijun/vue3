// 把 package 目录下所有的包都进行打包
const fs = require('fs');
const execa = require('execa');

// 过滤 packages 目录中的文件
const targets = fs.readFileSync('packages').filter((f) => {
    if (!fs.statSync(`packages/${f}`).isDirectory()) {
        return false;
    }
    return true;
});

// 进行打包
// 使用 rollup -c --environment target:shared
async function build(target) {
    await execa('rollup', ['-c', '--environment', `TARGET:${target}`], {
        stdio: 'inherit'
    });
}
// stdio 参数是子进程打包信息共享给父进程

function runParallel(targets, iteratorFn) {
    const res = [];
    for (const item of targets) {
        const p = iteratorFn(item);
        res.push(p);
    }
    return Promise.all(res);
}
