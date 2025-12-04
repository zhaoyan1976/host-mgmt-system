const fs = require('fs');

// 读取初始数据
const data = JSON.parse(fs.readFileSync('functions/api/data/initial_hosts.json', 'utf8'));
const jsonString = JSON.stringify(data);

// 生成用于 Wrangler bulk put 的格式
// 格式：[{"key": "key_name", "value": "value_string"}]
const bulkData = [
  {
    "key": "__initial_hosts__",
    "value": jsonString
  }
];

// 写入文件用于 bulk put
fs.writeFileSync('kv-bulk-data.json', JSON.stringify(bulkData, null, 2));

// 也保留单独的文件用于 API
fs.writeFileSync('kv-api-data.json', jsonString);

console.log('✅ KV 数据已生成');
console.log(`📊 数据条数: ${data.length}`);
console.log(`📦 数据大小: ${jsonString.length} 字符 (${(jsonString.length / 1024).toFixed(2)} KB)`);
console.log('\n=== 下一步操作 ===');
console.log('1. 在 Cloudflare Dashboard 创建 KV namespace: INITIAL_DATA_DB');
console.log('2. 在 Pages -> Functions -> KV Bindings 添加绑定: INITIAL_DATA_DB');
console.log('3. 使用以下命令导入数据:\n');

console.log('【方法B - Wrangler CLI (推荐)】');
console.log('  步骤：');
console.log('  a) 登录: wrangler login');
console.log('  b) 导入: wrangler kv bulk put kv-bulk-data.json --namespace-id=你的NAMESPACE_ID\n');

console.log('【方法C - Cloudflare API】');
console.log('  需要获取以下信息：');
console.log('  - Account ID: 在 Cloudflare Dashboard 右侧边栏查看');
console.log('  - Namespace ID: 在 KV namespace 详情页查看');
console.log('  - API Token: 在 My Profile -> API Tokens 创建');
console.log('  然后运行以下命令：');
console.log('  curl -X PUT "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/storage/kv/namespaces/YOUR_NAMESPACE_ID/values/__initial_hosts__" \\');
console.log('    -H "Authorization: Bearer YOUR_API_TOKEN" \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    --data-binary "@kv-api-data.json"');
