const fs = require('fs');

// 读取原始数据
const data = JSON.parse(fs.readFileSync('functions/api/data/initial_hosts.json', 'utf8'));

// 生成环境变量格式的数据
const envData = JSON.stringify(data);

// 写到文件
fs.writeFileSync('initial-hosts-data.json', envData);

console.log('环境变量数据已生成，文件大小:', envData.length, '字符');
console.log('前100个字符预览:', envData.substring(0, 100));

// 生成 Cloudflare 设置命令
console.log('\n=== Cloudflare 设置命令 ===');
console.log('请在 Cloudflare Dashboard 中设置以下环境变量:');
console.log('变量名: INITIAL_HOSTS_DATA');
console.log('变量值: (复制下面的JSON内容)');

// 为了便于复制，我们将数据分成几行
const chunkSize = 10000;
console.log('\nJSON数据 (分段复制):');
for (let i = 0; i < envData.length; i += chunkSize) {
  console.log(envData.substring(i, i + chunkSize));
}
